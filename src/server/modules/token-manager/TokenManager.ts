/**
 * TokenManager — secure token storage and lifecycle management for Shorts Studio.
 *
 * Architecture:
 *   - All OAuth tokens (access, refresh) are stored EXCLUSIVELY in the system
 *     keystore via keytar (macOS Keychain / Windows Credential Manager / Linux gnome-keyring).
 *   - The SQLite database stores only `tokenKeyRef` — a UUID pointer that maps
 *     to the keytar entry. Tokens NEVER touch the DB or filesystem.
 *   - Each platform's refresh logic is isolated in a private method that calls
 *     the correct OAuth token endpoint.
 *
 * Keytar entry format:
 *   Service:  KEYTAR_SERVICE_NAME ("ShortsStudio")
 *   Account:  tokenKeyRef (UUID v4)
 *   Password: JSON.stringify(SecureTokenData)
 *
 * Error strategy:
 *   All methods throw subclassed TokenManagerError instances that carry
 *   an IpcErrorCode, so IPC handlers can map them directly to IpcError
 *   without string parsing.
 */

import keytar from "keytar";
import { v4 as uuidv4 } from "uuid";

import { KEYTAR_SERVICE_NAME } from "@/shared/constants/platforms";
import type { Platform, SecureTokenData } from "@/shared/types/account";

import {
  KeytarUnavailableError,
  TokenNotFoundError,
  TokenCorruptError,
  TokenExpiredError,
  TokenRefreshFailedError,
  TokenRevokedError,
  OAuthConfigError,
  TokenManagerError,
} from "./errors";

// ─── Platform OAuth configuration ────────────────────────────────────────────

/**
 * Per-platform OAuth token endpoint and environment variable names.
 * Client credentials are read from the environment at runtime —
 * they are NEVER hardcoded.
 */
interface PlatformOAuthConfig {
  /** Token endpoint URL for exchanging refresh_token → access_token */
  tokenEndpoint: string;
  /** Env var name for the OAuth client_id */
  clientIdEnvVar: string;
  /** Env var name for the OAuth client_secret (empty for public clients) */
  clientSecretEnvVar: string | null;
  /** Whether this platform supports refresh tokens (Instagram long-lived tokens use a different flow) */
  supportsRefreshToken: boolean;
  /** HTTP method for the token endpoint */
  method: "POST";
  /** Content type for the request body */
  contentType: "application/x-www-form-urlencoded";
}

const PLATFORM_OAUTH_CONFIG: Record<Platform, PlatformOAuthConfig> = {
  tiktok: {
    tokenEndpoint: "https://open.tiktokapis.com/v2/oauth/token/",
    clientIdEnvVar: "TIKTOK_CLIENT_ID",
    clientSecretEnvVar: "TIKTOK_CLIENT_SECRET",
    supportsRefreshToken: true,
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
  },
  youtube: {
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    clientIdEnvVar: "GOOGLE_CLIENT_ID",
    clientSecretEnvVar: "GOOGLE_CLIENT_SECRET",
    supportsRefreshToken: true,
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
  },
  instagram: {
    // Instagram uses a different flow: refresh a long-lived token
    // by sending GET with the token itself (no client secret in the refresh request)
    tokenEndpoint: "https://graph.instagram.com/refresh_access_token",
    clientIdEnvVar: "INSTAGRAM_APP_ID",
    clientSecretEnvVar: null, // Instagram refresh doesn't use client_secret
    supportsRefreshToken: false, // Uses long-lived token refresh, not OAuth refresh_token
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
  },
};

// ─── Buffer time ─────────────────────────────────────────────────────────────

/**
 * Seconds before actual expiration when we consider a token "expired"
 * and attempt a proactive refresh. Avoids edge cases where a token
 * expires between validation and API call.
 */
const EXPIRY_BUFFER_SECONDS = 60;

// ─── TokenManager class ──────────────────────────────────────────────────────

export class TokenManager {
  private readonly serviceName: string;

  constructor(serviceName: string = KEYTAR_SERVICE_NAME) {
    this.serviceName = serviceName;
  }

  // ─── saveTokens ───────────────────────────────────────────────────────────

  /**
   * Saves OAuth tokens to the system keystore and returns a tokenKeyRef.
   *
   * The tokenKeyRef is a UUID v4 that serves as the "account" field in keytar.
   * This reference is stored in the SQLite database; the actual token data
   * never touches the DB or filesystem.
   *
   * @param accountId - Internal account ID (used for logging only, not stored in keytar)
   * @param tokens    - The secure token data to store
   * @returns tokenKeyRef — UUID that can be used to retrieve tokens later
   * @throws KeytarUnavailableError if the system keystore is inaccessible
   */
  async saveTokens(accountId: string, tokens: SecureTokenData): Promise<string> {
    const tokenKeyRef = uuidv4();

    try {
      const serialized = JSON.stringify(tokens);

      await keytar.setPassword(
        this.serviceName,
        tokenKeyRef,
        serialized,
      );

      return tokenKeyRef;
    } catch (error: unknown) {
      // keytar throws generic errors; detect common failure modes
      if (this.isKeytarAccessError(error)) {
        throw new KeytarUnavailableError(
          `Failed to write tokens for account "${accountId}": ${this.extractErrorMessage(error)}`,
        );
      }

      throw new TokenManagerError({
        code: "UNKNOWN_ERROR",
        message: `Unexpected error saving tokens for account "${accountId}"`,
        details: this.extractErrorMessage(error),
        retryable: false,
      });
    }
  }

  // ─── getTokens ────────────────────────────────────────────────────────────

  /**
   * Retrieves tokens from the system keystore by their tokenKeyRef.
   *
   * @param tokenKeyRef - The UUID reference returned by saveTokens
   * @returns The stored SecureTokenData, or null if no entry exists
   * @throws TokenCorruptError if the stored data cannot be parsed as valid JSON
   * @throws KeytarUnavailableError if the system keystore is inaccessible
   */
  async getTokens(tokenKeyRef: string): Promise<SecureTokenData | null> {
    try {
      const serialized = await keytar.getPassword(this.serviceName, tokenKeyRef);

      // keytar returns null when the entry doesn't exist
      if (serialized === null || serialized === undefined) {
        return null;
      }

      return this.parseSecureTokenData(tokenKeyRef, serialized);
    } catch (error: unknown) {
      if (this.isKeytarAccessError(error)) {
        throw new KeytarUnavailableError(
          `Failed to read tokens for keyRef "${tokenKeyRef}": ${this.extractErrorMessage(error)}`,
        );
      }

      // Re-throw TokenCorruptError from parseSecureTokenData
      if (error instanceof TokenManagerError) {
        throw error;
      }

      throw new TokenManagerError({
        code: "UNKNOWN_ERROR",
        message: `Unexpected error reading tokens for keyRef "${tokenKeyRef}"`,
        details: this.extractErrorMessage(error),
        retryable: false,
      });
    }
  }

  // ─── deleteTokens ─────────────────────────────────────────────────────────

  /**
   * Removes tokens from the system keystore.
   *
   * Should be called when an account is disconnected. Also consider
   * calling this before saving new tokens for the same account if the
   * tokenKeyRef is being replaced.
   *
   * @param tokenKeyRef - The UUID reference to delete
   * @returns true if tokens were found and deleted, false if no entry existed
   * @throws KeytarUnavailableError if the system keystore is inaccessible
   */
  async deleteTokens(tokenKeyRef: string): Promise<boolean> {
    try {
      const result = await keytar.deletePassword(this.serviceName, tokenKeyRef);
      return result;
    } catch (error: unknown) {
      if (this.isKeytarAccessError(error)) {
        throw new KeytarUnavailableError(
          `Failed to delete tokens for keyRef "${tokenKeyRef}": ${this.extractErrorMessage(error)}`,
        );
      }

      throw new TokenManagerError({
        code: "UNKNOWN_ERROR",
        message: `Unexpected error deleting tokens for keyRef "${tokenKeyRef}"`,
        details: this.extractErrorMessage(error),
        retryable: false,
      });
    }
  }

  // ─── refreshAccountTokens ─────────────────────────────────────────────────

  /**
   * Checks if the access token is expired and refreshes it if possible.
   *
   * Flow:
   *   1. Retrieve current tokens from keystore
   *   2. Check if access token is within the expiry buffer
   *   3. If not expired, return current tokens as-is
   *   4. If expired, call the platform's token endpoint with the refresh token
   *   5. Update the keystore entry with the new token data
   *   6. Return the updated SecureTokenData
   *
   * @param tokenKeyRef - The UUID reference for the account's tokens
   * @param platform   - Which platform's OAuth endpoint to call
   * @returns Updated SecureTokenData with fresh access token
   * @throws TokenNotFoundError if no tokens exist for the given keyRef
   * @throws TokenExpiredError if the token is expired and no refresh token exists
   * @throws TokenRefreshFailedError if the platform API returns an error
   * @throws TokenRevokedError if the platform indicates the refresh token was revoked
   * @throws OAuthConfigError if required environment variables are missing
   */
  async refreshAccountTokens(
    tokenKeyRef: string,
    platform: Platform,
  ): Promise<SecureTokenData> {
    // Step 1: Retrieve current tokens
    const currentTokens = await this.getTokens(tokenKeyRef);
    if (currentTokens === null) {
      throw new TokenNotFoundError(tokenKeyRef);
    }

    // Step 2: Check if refresh is actually needed
    if (!this.isTokenExpired(currentTokens)) {
      return currentTokens;
    }

    // Step 3: Dispatch to platform-specific refresh logic
    const config = PLATFORM_OAUTH_CONFIG[platform];
    let newTokens: SecureTokenData;

    switch (platform) {
      case "tiktok":
        newTokens = await this.refreshTikTokToken(tokenKeyRef, currentTokens, config);
        break;
      case "youtube":
        newTokens = await this.refreshYouTubeToken(tokenKeyRef, currentTokens, config);
        break;
      case "instagram":
        newTokens = await this.refreshInstagramToken(tokenKeyRef, currentTokens, config);
        break;
      default: {
        // Exhaustiveness check — TypeScript ensures all Platform values are handled
        const _exhaustive: never = platform;
        throw new TokenManagerError({
          code: "UNKNOWN_ERROR",
          message: `Unsupported platform: ${String(_exhaustive)}`,
          retryable: false,
        });
      }
    }

    // Step 4: Update keystore with the new tokens
    try {
      const serialized = JSON.stringify(newTokens);
      await keytar.setPassword(this.serviceName, tokenKeyRef, serialized);
    } catch (error: unknown) {
      throw new TokenManagerError({
        code: "UNKNOWN_ERROR",
        message: `Token was refreshed successfully but failed to update keystore for keyRef "${tokenKeyRef}"`,
        details: this.extractErrorMessage(error),
        retryable: true, // The refresh succeeded; retrying the save might work
      });
    }

    return newTokens;
  }

  // ─── isTokenExpired ───────────────────────────────────────────────────────

  /**
   * Checks if a token is expired or will expire within the buffer window.
   *
   * @param tokens - The token data to check
   * @returns true if the token is expired or about to expire
   */
  isTokenExpired(tokens: SecureTokenData): boolean {
    const storedAt = new Date(tokens.storedAt).getTime();

    // Parse the expires_in from storedAt. We don't store expiresIn directly
    // in SecureTokenData, so we use a heuristic: if the token was stored
    // more than a typical lifetime ago, it's likely expired.
    // However, a better approach: we store the expiration timestamp
    // implicitly via storedAt. The caller should track the actual
    // tokenExpiresAt from the Account model in the DB.
    //
    // For this method, we rely on the DB's tokenExpiresAt field being
    // checked BEFORE calling refreshAccountTokens. This method provides
    // a secondary safety check based on storedAt.
    //
    // Default token lifetimes by platform (for secondary check):
    const DEFAULT_TOKEN_LIFETIME_SECONDS: Record<Platform, number> = {
      tiktok: 86400,      // 24 hours
      youtube: 3600,       // 1 hour
      instagram: 5184000,  // 60 days (long-lived token)
    };

    // If we can't determine the platform from tokens alone, use a conservative
    // default of 1 hour
    const estimatedLifetime = 3600;
    const elapsedMs = Date.now() - storedAt;
    const elapsedSec = elapsedMs / 1000;

    return elapsedSec >= (estimatedLifetime - EXPIRY_BUFFER_SECONDS);
  }

  // ─── Private: Platform refresh implementations ────────────────────────────

  /**
   * Refresh a TikTok access token using the refresh_token grant.
   *
   * TikTok Content Posting API uses a standard OAuth2 refresh_token flow:
   *   POST https://open.tiktokapis.com/v2/oauth/token/
   *   Body: grant_type=refresh_token&refresh_token=xxx&client_key=xxx&client_secret=xxx
   */
  private async refreshTikTokToken(
    tokenKeyRef: string,
    currentTokens: SecureTokenData,
    config: PlatformOAuthConfig,
  ): Promise<SecureTokenData> {
    if (!currentTokens.refreshToken) {
      throw new TokenExpiredError(tokenKeyRef, "tiktok");
    }

    const clientKey = this.getEnvVar(config.clientIdEnvVar);
    const clientSecret = this.getEnvVar(config.clientSecretEnvVar!);

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: currentTokens.refreshToken,
      client_key: clientKey,
      client_secret: clientSecret,
    });

    const response = await this.executeTokenRequest(
      config.tokenEndpoint,
      body.toString(),
      "tiktok",
      tokenKeyRef,
    );

    // TikTok returns: { access_token, refresh_token, expires_in, token_type, scope }
    const newAccessToken: string = response.access_token;
    const newRefreshToken: string | undefined = response.refresh_token;
    const expiresIn: number = response.expires_in ?? 86400;
    const scope: string | undefined = response.scope;

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken ?? currentTokens.refreshToken,
      tokenType: response.token_type ?? "Bearer",
      scope: scope ?? currentTokens.scope,
      storedAt: new Date().toISOString(),
    };
  }

  /**
   * Refresh a YouTube (Google) access token using the refresh_token grant.
   *
   * Google OAuth2 refresh flow:
   *   POST https://oauth2.googleapis.com/token
   *   Body: grant_type=refresh_token&refresh_token=xxx&client_id=xxx&client_secret=xxx
   */
  private async refreshYouTubeToken(
    tokenKeyRef: string,
    currentTokens: SecureTokenData,
    config: PlatformOAuthConfig,
  ): Promise<SecureTokenData> {
    if (!currentTokens.refreshToken) {
      throw new TokenExpiredError(tokenKeyRef, "youtube");
    }

    const clientId = this.getEnvVar(config.clientIdEnvVar);
    const clientSecret = this.getEnvVar(config.clientSecretEnvVar!);

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: currentTokens.refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await this.executeTokenRequest(
      config.tokenEndpoint,
      body.toString(),
      "youtube",
      tokenKeyRef,
    );

    // Google returns: { access_token, expires_in, token_type, scope }
    // Note: Google does NOT return a new refresh_token on refresh
    const newAccessToken: string = response.access_token;
    const expiresIn: number = response.expires_in ?? 3600;
    const scope: string | undefined = response.scope;

    return {
      accessToken: newAccessToken,
      refreshToken: currentTokens.refreshToken, // Google refresh tokens are reusable
      tokenType: response.token_type ?? "Bearer",
      scope: scope ?? currentTokens.scope,
      storedAt: new Date().toISOString(),
    };
  }

  /**
   * Refresh an Instagram long-lived access token.
   *
   * Instagram does NOT use the standard OAuth2 refresh_token flow.
   * Instead, you refresh a long-lived token by sending a GET request:
   *   GET https://graph.instagram.com/refresh_access_token
   *       ?grant_type=ig_refresh_token&access_token=xxx
   *
   * This can be done up to 90 days before the token expires.
   * Each refresh extends the token by another 60 days.
   */
  private async refreshInstagramToken(
    tokenKeyRef: string,
    currentTokens: SecureTokenData,
    _config: PlatformOAuthConfig,
  ): Promise<SecureTokenData> {
    // Instagram uses GET with the access_token in the query string
    const url = new URL("https://graph.instagram.com/refresh_access_token");
    url.searchParams.set("grant_type", "ig_refresh_token");
    url.searchParams.set("access_token", currentTokens.accessToken);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });
    } catch (error: unknown) {
      throw new TokenRefreshFailedError(
        "instagram",
        0,
        `Network error: ${this.extractErrorMessage(error)}`,
      );
    }

    if (!response.ok) {
      const responseBody = await response.text().catch(() => "<unreadable>");

      // Instagram returns specific error codes for revoked tokens
      if (response.status === 401 || response.status === 403) {
        throw new TokenRevokedError("instagram", tokenKeyRef);
      }

      throw new TokenRefreshFailedError("instagram", response.status, responseBody);
    }

    const data = await response.json() as Record<string, unknown>;
    const newAccessToken: string = data.access_token as string;
    const expiresIn: number = (data.expires_in as number) ?? 5184000; // 60 days default

    return {
      accessToken: newAccessToken,
      // Instagram doesn't have separate refresh tokens; the long-lived token IS the refresh mechanism
      refreshToken: undefined,
      tokenType: "Bearer",
      scope: currentTokens.scope,
      storedAt: new Date().toISOString(),
    };
  }

  // ─── Private: HTTP helper ─────────────────────────────────────────────────

  /**
   * Executes a POST request to an OAuth token endpoint with proper error handling.
   *
   * @param endpoint   - The token endpoint URL
   * @param body       - URL-encoded form body
   * @param platform   - Platform name (for error messages)
   * @param tokenKeyRef - Token key reference (for error messages)
   * @returns Parsed JSON response from the token endpoint
   * @throws TokenRefreshFailedError on HTTP errors
   * @throws TokenRevokedError if the refresh token was revoked
   */
  private async executeTokenRequest(
    endpoint: string,
    body: string,
    platform: Platform,
    tokenKeyRef: string,
  ): Promise<Record<string, unknown>> {
    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        body,
      });
    } catch (error: unknown) {
      throw new TokenRefreshFailedError(
        platform,
        0,
        `Network error: ${this.extractErrorMessage(error)}`,
      );
    }

    if (!response.ok) {
      const responseBody = await response.text().catch(() => "<unreadable>");

      // Detect revoked tokens — most platforms return 400 or 401 for invalid refresh tokens
      if (response.status === 400 || response.status === 401) {
        // Try to parse the error for more specific info
        const isRevoked = this.isRefreshTokenRevoked(platform, responseBody);
        if (isRevoked) {
          throw new TokenRevokedError(platform, tokenKeyRef);
        }
      }

      throw new TokenRefreshFailedError(platform, response.status, responseBody);
    }

    try {
      return await response.json() as Record<string, unknown>;
    } catch (error: unknown) {
      throw new TokenRefreshFailedError(
        platform,
        response.status,
        `Invalid JSON response: ${this.extractErrorMessage(error)}`,
      );
    }
  }

  // ─── Private: Utility methods ─────────────────────────────────────────────

  /**
   * Parses a serialized SecureTokenData string from keytar.
   *
   * @param tokenKeyRef - Reference key (for error messages)
   * @param serialized  - JSON string from keytar
   * @returns Parsed SecureTokenData
   * @throws TokenCorruptError if the JSON is invalid or missing required fields
   */
  private parseSecureTokenData(
    tokenKeyRef: string,
    serialized: string,
  ): SecureTokenData {
    let parsed: unknown;

    try {
      parsed = JSON.parse(serialized);
    } catch (parseError: unknown) {
      throw new TokenCorruptError(tokenKeyRef, this.extractErrorMessage(parseError));
    }

    // Validate that required fields exist
    if (typeof parsed !== "object" || parsed === null) {
      throw new TokenCorruptError(tokenKeyRef, "Parsed value is not an object");
    }

    const record = parsed as Record<string, unknown>;

    if (typeof record.accessToken !== "string") {
      throw new TokenCorruptError(tokenKeyRef, "Missing or invalid 'accessToken' field");
    }

    if (typeof record.tokenType !== "string") {
      throw new TokenCorruptError(tokenKeyRef, "Missing or invalid 'tokenType' field");
    }

    if (typeof record.storedAt !== "string") {
      throw new TokenCorruptError(tokenKeyRef, "Missing or invalid 'storedAt' field");
    }

    // Validate storedAt is a valid ISO date
    if (isNaN(new Date(record.storedAt).getTime())) {
      throw new TokenCorruptError(tokenKeyRef, "Invalid 'storedAt' date format");
    }

    return {
      accessToken: record.accessToken,
      refreshToken: typeof record.refreshToken === "string" ? record.refreshToken : undefined,
      tokenType: record.tokenType,
      scope: typeof record.scope === "string" ? record.scope : undefined,
      storedAt: record.storedAt,
    };
  }

  /**
   * Reads an environment variable and throws OAuthConfigError if it's missing.
   *
   * @param envVarName - Name of the environment variable
   * @returns The value of the environment variable
   * @throws OAuthConfigError if the variable is not set or empty
   */
  private getEnvVar(envVarName: string): string {
    const value = process.env[envVarName];
    if (!value || value.trim().length === 0) {
      throw new OAuthConfigError(
        envVarName.split("_").slice(0, -1).join(" ").toLowerCase(), // Extract platform from var name
        [envVarName],
      );
    }
    return value.trim();
  }

  /**
   * Detects if a token refresh failure is due to the refresh token being revoked.
   *
   * Each platform returns different error formats:
   * - TikTok: { error: "invalid_grant" }
   * - Google: { error: "invalid_grant" } or { error: "token_expired" }
   * - Instagram: { error: { type: "OAuthException", code: 190 } }
   */
  private isRefreshTokenRevoked(platform: Platform, responseBody: string): boolean {
    try {
      const errorData = JSON.parse(responseBody) as Record<string, unknown>;

      if (platform === "tiktok" || platform === "youtube") {
        const errorField = errorData.error as string | undefined;
        return errorField === "invalid_grant" || errorField === "token_expired";
      }

      if (platform === "instagram") {
        const errorObj = errorData.error as Record<string, unknown> | undefined;
        return (
          typeof errorObj?.type === "string" &&
          errorObj.type === "OAuthException"
        );
      }

      return false;
    } catch {
      // Can't parse the response — assume not revoked
      return false;
    }
  }

  /**
   * Detects common keytar access errors that indicate the system keystore
   * is unavailable (e.g., no keychain daemon on Linux).
   */
  private isKeytarAccessError(error: unknown): boolean {
    const message = this.extractErrorMessage(error).toLowerCase();
    return (
      message.includes("keyring") ||
      message.includes("keychain") ||
      message.includes("credential") ||
      message.includes("dbus") ||
      message.includes("gnome-keyring") ||
      message.includes("kwallet") ||
      message.includes("cannot find") ||
      message.includes("access denied")
    );
  }

  /**
   * Extracts a human-readable error message from an unknown error object.
   * Handles Error instances, strings, and unknown types gracefully.
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return String(error);
  }
}
