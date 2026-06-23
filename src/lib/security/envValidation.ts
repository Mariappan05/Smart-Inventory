const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
] as const;

const recommendedEnvVars = [
  "DIRECT_URL",
  "NEXT_PUBLIC_APP_NAME",
] as const;

export function validateEnvironment(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  for (const varName of recommendedEnvVars) {
    if (!process.env[varName]) {
      warnings.push(`Missing recommended environment variable: ${varName}`);
    }
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters long");
  }

  if (process.env.JWT_SECRET === "replace-with-secure-secret") {
    errors.push("JWT_SECRET is using default value - please change it");
  }

  if (process.env.NODE_ENV === "production" && !process.env.DIRECT_URL) {
    warnings.push("DIRECT_URL not set - may impact database migrations in production");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

if (process.env.NODE_ENV !== "test") {
  const { valid, errors, warnings } = validateEnvironment();
  
  if (!valid) {
    console.error("❌ Environment validation failed:");
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.warn("⚠️  Environment validation warnings:");
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
}
