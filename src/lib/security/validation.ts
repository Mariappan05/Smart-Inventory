// Input Validation and Sanitization
import { securityConfig } from "@/config/security";

// SQL Injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|UNION|DECLARE)\b)/gi,
  /(--|\/\*|\*\/|;|'|")/g,
  /(\bOR\b|\bAND\b).*?[=<>]/gi,
  /(\bxp_|\bsp_)/gi,
];

// XSS patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<img[^>]+src[^>]*>/gi,
];

// Path Traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.[\/\\]/g,
  /\.\.[\\\/]/g,
  /%2e%2e[\/\\]/gi,
  /%252e%252e[\/\\]/gi,
];

export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, "");
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > securityConfig.validation.maxInputLength) {
    sanitized = sanitized.substring(0, securityConfig.validation.maxInputLength);
  }
  
  return sanitized;
}

export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeString(email);
  
  // Basic email validation pattern
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailPattern.test(sanitized)) {
    throw new Error("Invalid email format");
  }
  
  return sanitized.toLowerCase();
}

export function sanitizeFileName(filename: string): string {
  let sanitized = sanitizeString(filename);
  
  // Remove path traversal attempts
  PATH_TRAVERSAL_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, "");
  });
  
  // Remove special characters except dot, dash, underscore
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");
  
  // Prevent hidden files
  if (sanitized.startsWith(".")) {
    sanitized = sanitized.substring(1);
  }
  
  return sanitized;
}

export function detectSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

export function detectXSS(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

export function detectPathTraversal(input: string): boolean {
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input));
}

export function validateInput(input: string, fieldName: string = "Input"): void {
  if (!input) {
    throw new Error(`${fieldName} is required`);
  }
  
  const sanitized = sanitizeString(input);
  
  if (detectSQLInjection(sanitized)) {
    throw new Error(`${fieldName} contains potential SQL injection`);
  }
  
  if (detectXSS(sanitized)) {
    throw new Error(`${fieldName} contains potential XSS attack`);
  }
  
  if (detectPathTraversal(sanitized)) {
    throw new Error(`${fieldName} contains potential path traversal`);
  }
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key as keyof T] = sanitizeString(value) as any;
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item => 
        typeof item === "string" ? sanitizeString(item) : item
      ) as any;
    } else if (typeof value === "object" && value !== null) {
      sanitized[key as keyof T] = sanitizeObject(value) as any;
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = securityConfig.password;
  
  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
  }
  
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (config.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const config = securityConfig.upload;
  
  // Check file size
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${config.maxFileSize / (1024 * 1024)}MB`,
    };
  }
  
  // Check MIME type
  if (!config.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: "File type not allowed",
    };
  }
  
  // Check file extension
  const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if (!config.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: "File extension not allowed",
    };
  }
  
  return { valid: true };
}
