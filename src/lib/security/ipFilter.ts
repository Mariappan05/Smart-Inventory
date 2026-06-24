import { NextRequest } from "next/server";

const BLACKLISTED_IPS = new Map<string, number>(); // IP → unblock timestamp (0 = permanent)
const WHITELISTED_IPS = new Set<string>(
  process.env.WHITELISTED_IPS?.split(",").map((ip) => ip.trim()) || []
);

// Track failed login attempts per IP independently from the rate-limit window
const FAILED_LOGIN_COUNTS = new Map<string, { count: number; firstAt: number }>();

const AUTO_BAN_THRESHOLD = 10;       // failed logins before auto-ban
const AUTO_BAN_WINDOW_MS = 15 * 60 * 1000; // 15-minute window
const AUTO_BAN_DURATION_MS = 60 * 60 * 1000; // 1-hour ban

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function isIPBlacklisted(ip: string): boolean {
  const unblockAt = BLACKLISTED_IPS.get(ip);
  if (unblockAt === undefined) return false;
  if (unblockAt === 0) return true; // permanent
  if (Date.now() < unblockAt) return true;
  // Expired — remove
  BLACKLISTED_IPS.delete(ip);
  return false;
}

export function isIPWhitelisted(ip: string): boolean {
  return WHITELISTED_IPS.size === 0 || WHITELISTED_IPS.has(ip);
}

export function blacklistIP(ip: string, durationMs?: number): void {
  BLACKLISTED_IPS.set(ip, durationMs ? Date.now() + durationMs : 0);
}

export function removeFromBlacklist(ip: string): void {
  BLACKLISTED_IPS.delete(ip);
}

/**
 * Record a failed login attempt for an IP. Returns true if the IP was
 * automatically banned as a result of exceeding the threshold.
 */
export function recordFailedLogin(ip: string): boolean {
  const now = Date.now();
  const record = FAILED_LOGIN_COUNTS.get(ip);

  if (!record || now - record.firstAt > AUTO_BAN_WINDOW_MS) {
    // Start a fresh window
    FAILED_LOGIN_COUNTS.set(ip, { count: 1, firstAt: now });
    return false;
  }

  record.count += 1;

  if (record.count >= AUTO_BAN_THRESHOLD) {
    blacklistIP(ip, AUTO_BAN_DURATION_MS);
    FAILED_LOGIN_COUNTS.delete(ip);
    return true; // banned
  }

  return false;
}

/** Clear the failed-login counter after a successful login (prevent stale counts). */
export function clearFailedLogins(ip: string): void {
  FAILED_LOGIN_COUNTS.delete(ip);
}

// Periodic cleanup of expired bans and stale counters
setInterval(() => {
  const now = Date.now();
  for (const [ip, unblockAt] of BLACKLISTED_IPS.entries()) {
    if (unblockAt !== 0 && unblockAt < now) {
      BLACKLISTED_IPS.delete(ip);
    }
  }
  for (const [ip, record] of FAILED_LOGIN_COUNTS.entries()) {
    if (now - record.firstAt > AUTO_BAN_WINDOW_MS) {
      FAILED_LOGIN_COUNTS.delete(ip);
    }
  }
}, 5 * 60 * 1000);
