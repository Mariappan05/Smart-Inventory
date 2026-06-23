import crypto from "crypto";

interface Session {
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
}

const activeSessions = new Map<string, Session>();
const userSessions = new Map<string, Set<string>>();
const MAX_SESSIONS_PER_USER = 5;

export function createSession(userId: string, ipAddress: string, userAgent: string, maxAge: number): string {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  
  const session: Session = {
    userId,
    token,
    ipAddress,
    userAgent,
    createdAt: now,
    lastActivity: now,
    expiresAt: now + maxAge,
  };

  activeSessions.set(token, session);

  if (!userSessions.has(userId)) {
    userSessions.set(userId, new Set());
  }
  
  const sessions = userSessions.get(userId)!;
  sessions.add(token);

  if (sessions.size > MAX_SESSIONS_PER_USER) {
    const oldestToken = Array.from(sessions)[0];
    removeSession(oldestToken);
  }

  return token;
}

export function getSession(token: string): Session | null {
  const session = activeSessions.get(token);
  
  if (!session) return null;
  
  if (Date.now() > session.expiresAt) {
    removeSession(token);
    return null;
  }

  session.lastActivity = Date.now();
  return session;
}

export function removeSession(token: string): void {
  const session = activeSessions.get(token);
  
  if (session) {
    activeSessions.delete(token);
    userSessions.get(session.userId)?.delete(token);
  }
}

export function removeAllUserSessions(userId: string): void {
  const sessions = userSessions.get(userId);
  
  if (sessions) {
    sessions.forEach(token => activeSessions.delete(token));
    sessions.clear();
  }
}

export function getUserActiveSessions(userId: string): Session[] {
  const tokens = userSessions.get(userId);
  if (!tokens) return [];
  
  return Array.from(tokens)
    .map(token => activeSessions.get(token))
    .filter((session): session is Session => session !== undefined);
}

setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now > session.expiresAt) {
      removeSession(token);
    }
  }
}, 60000);
