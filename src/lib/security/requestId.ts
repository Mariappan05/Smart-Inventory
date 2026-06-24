import crypto from "crypto";

/**
 * Generates a unique request ID for log correlation.
 * Format: req_<16 hex bytes>
 */
export function generateRequestId(): string {
  return `req_${crypto.randomBytes(16).toString("hex")}`;
}

/**
 * Extracts the request ID from an incoming request header,
 * or generates a new one if not present.
 */
export function getOrCreateRequestId(headers: Headers): string {
  return headers.get("x-request-id") || generateRequestId();
}
