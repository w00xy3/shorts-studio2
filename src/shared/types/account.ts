/**
 * Account & authentication type definitions for Shorts Studio.
 *
 * Covers social platform accounts, token metadata, and OAuth flow data.
 * Actual token values are NEVER stored in these types or in the DB —
 * they live exclusively in the encrypted keytar/system keystore.
 */

// ─── Platform ────────────────────────────────────────────────────────────────

/** Supported social media platforms */
export type Platform = "tiktok" | "youtube" | "instagram";

/** Platform-specific scopes for OAuth */
export const PLATFORM_SCOPES: Record<Platform, string[]> = {
  tiktok: ["video.publish", "video.list"],
  youtube: [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
  ],
  instagram: [
    "instagram_basic",
    "instagram_content_publish",
    "pages_read_engagement",
  ],
};

/** Display metadata per platform */
export interface PlatformInfo {
  id: Platform;
  label: string;
  color: string;
  icon: string;
  scopes: string[];
  /** Max video duration in seconds for short-form content */
  maxDuration: number;
  /** Max file size in bytes */
  maxFileSize: number;
  /** Supported video MIME types */
  supportedMimeTypes: string[];
}

// ─── OAuth ───────────────────────────────────────────────────────────────────

/** OAuth flow state stored temporarily during the auth redirect */
export interface OAuthState {
  /** Random state token for CSRF protection */
  state: string;
  platform: Platform;
  /** PKCE code verifier (for platforms that support it) */
  codeVerifier?: string;
  /** Redirect URI used for this flow */
  redirectUri: string;
  /** Timestamp when the flow was initiated */
  initiatedAt: number;
}

/** OAuth token response from a platform */
export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  /** Seconds until expiration */
  expiresIn: number;
  /** Scopes actually granted by the user */
  scope?: string;
  /** Token type, usually "Bearer" */
  tokenType: string;
}

// ─── Account ─────────────────────────────────────────────────────────────────

/** Connection status of an account */
export type AccountStatus = "active" | "expired" | "revoked" | "error";

/** A connected social media account (metadata only — tokens in keytar) */
export interface Account {
  id: string;
  platform: Platform;
  platformUserId: string;
  displayName: string;
  avatarUrl: string | null;
  /** Reference key for looking up access token in secure storage */
  tokenKeyRef: string;
  /** Reference key for looking up refresh token in secure storage */
  refreshTokenKeyRef: string | null;
  /** When the access token expires (null if unknown/refreshable) */
  tokenExpiresAt: Date | null;
  status: AccountStatus;
  connectedAt: Date;
  updatedAt: Date;
}

/** Payload for initiating account connection (OAuth) */
export interface ConnectAccountPayload {
  platform: Platform;
}

/** Payload for disconnecting an account */
export interface DisconnectAccountPayload {
  accountId: string;
  /** Whether to also revoke the token on the platform side */
  revokeToken?: boolean;
}

/** Payload for refreshing an account token */
export interface RefreshTokenPayload {
  accountId: string;
}

/** Result of a token refresh operation */
export interface TokenRefreshResult {
  accountId: string;
  success: boolean;
  /** New expiration time, if successful */
  newExpiresAt: Date | null;
  error?: string;
}

// ─── Token Manager ───────────────────────────────────────────────────────────

/** Encrypted token data stored in the system keystore via keytar */
export interface SecureTokenData {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  scope?: string;
  /** ISO timestamp of when the token was stored/refreshed */
  storedAt: string;
}

/** Token validation result before an API call */
export interface TokenValidation {
  accountId: string;
  isValid: boolean;
  /** If the token needs refresh */
  needsRefresh: boolean;
  /** Seconds until expiration (negative if expired) */
  expiresIn: number;
}

// ─── Account List Filters ────────────────────────────────────────────────────

/** Filter parameters for listing accounts */
export interface AccountListFilter {
  platform?: Platform;
  status?: AccountStatus;
}
