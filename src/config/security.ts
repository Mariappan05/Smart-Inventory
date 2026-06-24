// Security Configuration for Smart Machine Inventory

export const securityConfig = {
  // Rate Limiting Configuration
  rateLimit: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5,            // 5 login attempts per window
      blockDuration: 30 * 60 * 1000, // Block for 30 minutes on rate-limit hit
    },
    api: {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 100,      // 100 requests per minute per IP
    },
    critical: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20,      // 20 req/min for write operations (users, products, etc.)
    },
    upload: {
      windowMs: 60 * 1000,
      maxRequests: 10,      // 10 uploads per minute
    },
  },

  // Session / Cookie Configuration
  session: {
    cookieName: "smi_session",
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },

  // Password Policy
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false, // relaxed — many users struggle with special chars
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    preventReuse: 5,
  },

  // JWT Configuration
  jwt: {
    expiresIn: "8h",
    algorithm: "HS256" as const,
    issuer: "smart-machine-inventory",
    audience: "smart-machine-inventory-users",
  },

  // CORS Configuration
  cors: {
    allowedOrigins:
      process.env.NODE_ENV === "production"
        ? [process.env.NEXT_PUBLIC_APP_URL || ""]
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
    allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposedHeaders: ["Content-Length", "X-Request-ID"],
    credentials: true,
    maxAge: 86400, // 24 hours
  },

  // Content Security Policy
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      // Next.js requires 'unsafe-inline' for styles; 'unsafe-eval' for dev HMR
      scriptSrc:
        process.env.NODE_ENV === "production"
          ? ["'self'", "'unsafe-inline'"]
          : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "wss:", "ws:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    } as Record<string, string[] | null>,
  },

  // File Upload Security
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".xls", ".xlsx"],
    uploadDir: process.env.UPLOAD_DIR || "./uploads",
  },

  // Input Validation
  validation: {
    maxInputLength: 10_000,
    maxArrayLength: 1_000,
    sanitizeHtml: true,
    allowedTags: [],
  },

  // API Security
  api: {
    requireApiKey: false,
    apiKeyHeader: "X-API-Key",
    requestIdHeader: "X-Request-ID",
    enableLogging: true,
    logSensitiveData: false,
  },

  // Database Security
  database: {
    connectionTimeout: 30_000,
    queryTimeout: 60_000,
    maxConnections: 10,
    enableQueryLogging: process.env.NODE_ENV !== "production",
  },

  // Audit Logging
  audit: {
    enabled: true,
    logSuccessfulLogins: true,
    logFailedLogins: true,
    logDataChanges: false, // keep DB writes low — only log auth & security events by default
    logAccessDenied: true,
    retentionDays: 90,
  },
};

export default securityConfig;
