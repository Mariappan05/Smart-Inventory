import { NextRequest } from "next/server";

const BLACKLISTED_IPS = new Set<string>();
const WHITELISTED_IPS = new Set<string>(
  process.env.WHITELISTED_IPS?.split(",").map(ip => ip.trim()) || []
);

export function getClientIP(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
         request.headers.get("x-real-ip") ||
         "unknown";
}

export function isIPBlacklisted(ip: string): boolean {
  return BLACKLISTED_IPS.has(ip);
}

export function isIPWhitelisted(ip: string): boolean {
  return WHITELISTED_IPS.size === 0 || WHITELISTED_IPS.has(ip);
}

export function blacklistIP(ip: string, duration?: number): void {
  BLACKLISTED_IPS.add(ip);
  
  if (duration) {
    setTimeout(() => BLACKLISTED_IPS.delete(ip), duration);
  }
}

export function removeFromBlacklist(ip: string): void {
  BLACKLISTED_IPS.delete(ip);
}
