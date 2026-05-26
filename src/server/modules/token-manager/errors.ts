/**
 * TokenManager custom error classes.
 *
 * Each error maps directly to an IpcErrorCode from the shared type system,
 * so IPC handlers can catch and propagate structured errors without
 * ad-hoc string matching.
 *
 * Usage in IPC handler:
 *   try {
 *     const tokens = await tokenManager.getTokens(ref);
 *   } catch (err) {
 *     if (err instanceof TokenNotFoundError) {
 *       return { ok: false, error: { code: "NOT_FOUND", ... } };
 *     }
 *   }
 */

import type { IpcErrorCode } from "@/shared/types/ipc";

// ─── Base class ──────────────────────────────────────────────────────────────

/**
 * Base error for all TokenManager operations.
 * Carries the IpcErrorCode for direct mapping in IPC handlers.
 */
export class TokenManagerError extends Error {
  public readonly code: IpcErrorCode;
  public readonly details?: string;
  public readonly retryable: boolean;

  constructor(params: {
    code: IpcErrorCode;
    message: string;
    details?: string;
    retryable?: boolean;
  }) {
    super(params.message);
    this.name = "TokenManagerError";
    this.code = params.code;
    this.details = params.details;
    this.retryable = params.retryable ?? false;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Specific errors ─────────────────────────────────────────────────────────

/** Thrown when keytar is unavailable (e.g. no keychain daemon on Linux) */
export class KeytarUnavailableError extends TokenManagerError {
  constructor(reason: string) {
    super({
      code: "PERMISSION_DENIED",
      message: `System keystore unavailable: ${reason}`,
      details:
        "keytar could not connect to the system keychain. " +
        "On Linux, ensure gnome-keyring or kwallet is installed and running.",
      retryable: false,
    });
    this.name = "KeytarUnavailableError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when tokens are not found for the given tokenKeyRef */
export class TokenNotFoundError extends TokenManagerError {
  constructor(tokenKeyRef: string) {
    super({
      code: "NOT_FOUND",
      message: `No tokens found for keyRef "${tokenKeyRef}"`,
      details:
        "The token reference exists in the database, but the corresponding " +
        "entry was not found in the system keystore. This can happen if the " +
        "keystore was cleared externally or the account was disconnected.",
      retryable: false,
    });
    this.name = "TokenNotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the stored token data is corrupt or cannot be parsed */
export class TokenCorruptError extends TokenManagerError {
  constructor(tokenKeyRef: string, parseError: string) {
    super({
      code: "UNKNOWN_ERROR",
      message: `Corrupt token data for keyRef "${tokenKeyRef}"`,
      details: `JSON parse error: ${parseError}`,
      retryable: false,
    });
    this.name = "TokenCorruptError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the access token has expired and no refresh token is available */
export class TokenExpiredError extends TokenManagerError {
  constructor(tokenKeyRef: string, platform: string) {
    super({
      code: "TOKEN_EXPIRED",
      message: `Access token expired for ${platform} account (keyRef: "${tokenKeyRef}")`,
      details:
        "The access token has expired and no refresh token was stored. " +
        "The user must re-authenticate to obtain new tokens.",
      retryable: false,
    });
    this.name = "TokenExpiredError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the OAuth refresh request fails (network or API error) */
export class TokenRefreshFailedError extends TokenManagerError {
  constructor(platform: string, statusCode: number, responseBody: string) {
    super({
      code: "TOKEN_REFRESH_FAILED",
      message: `Failed to refresh ${platform} token (HTTP ${statusCode})`,
      details: `Response: ${responseBody.slice(0, 500)}`,
      retryable: statusCode >= 500 || statusCode === 429, // Retry on server errors or rate limits
    });
    this.name = "TokenRefreshFailedError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the refresh token has been revoked by the platform */
export class TokenRevokedError extends TokenManagerError {
  constructor(platform: string, tokenKeyRef: string) {
    super({
      code: "TOKEN_REVOKED",
      message: `${platform} refresh token has been revoked (keyRef: "${tokenKeyRef}")`,
      details:
        "The platform has revoked the refresh token. This can happen if the user " +
        "revoked access from their account settings, or if the token was inactive for too long. " +
        "The user must re-authenticate.",
      retryable: false,
    });
    this.name = "TokenRevokedError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when OAuth client credentials are missing from the environment */
export class OAuthConfigError extends TokenManagerError {
  constructor(platform: string, missingVars: string[]) {
    super({
      code: "OAUTH_FAILED",
      message: `Missing OAuth configuration for ${platform}`,
      details: `Required environment variables not set: ${missingVars.join(", ")}`,
      retryable: false,
    });
    this.name = "OAuthConfigError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
