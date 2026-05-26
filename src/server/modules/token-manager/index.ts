/**
 * TokenManager module — public API.
 *
 * Re-exports the TokenManager class and all related error types
 * so consumers can import from a single entry point:
 *
 *   import { TokenManager, TokenNotFoundError } from "@/server/modules/token-manager";
 */

export { TokenManager } from "./TokenManager";
export {
  TokenManagerError,
  KeytarUnavailableError,
  TokenNotFoundError,
  TokenCorruptError,
  TokenExpiredError,
  TokenRefreshFailedError,
  TokenRevokedError,
  OAuthConfigError,
} from "./errors";
