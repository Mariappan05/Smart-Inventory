// Security Configuration for Smart Machine Inventory

export const securityConfig = {
  // Rate Limiting Configuration
  rateLimit: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5, // 5 login attempts
      blockDuration: 30 * 60 * 1000, // Block for 30 minutes
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
    },
    critical: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute for critical operations
    },
  },

  // Session Configuration
  session: {
    cookieName: "auth-token",
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
    requireSpecialChars: true,
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    preventReuse: 5, // Can't reuse last 5 passwords
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
    allowedOrigins: process.env.NODE_ENV === "production" 
      ? [process.env.NEXT_PUBLIC_APP_URL || ""]
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
    allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Length", "X-Request-ID"],
    credentials: true,
    maxAge: 86400, // 24 hours
  },

  // Content Security Policy
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    },
  },

  // File Upload Security
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
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
    maxInputLength: 10000,
    maxArrayLength: 1000,
    sanitizeHtml: true,
    allowedTags: [], // No HTML tags allowed by default
  },

  // API Security
  api: {
    requireApiKey: false, // Set to true if you want to use API keys
    apiKeyHeader: "X-API-Key",
    requestIdHeader: "X-Request-ID",
    enableLogging: true,
    logSensitiveData: false,
  },

  // Database Security
  database: {
    connectionTimeout: 30000, // 30 seconds
    queryTimeout: 60000, // 60 seconds
    maxConnections: 10,
    enableQueryLogging: process.env.NODE_ENV !== "production",
  },

  // Audit Logging
  audit: {
    enabled: true,
    logSuccessfulLogins: true,
    logFailedLogins: true,
    logDataChanges: true,
    logAccessDenied: true,
    retentionDays: 90,
  },
};

export default securityConfig;
