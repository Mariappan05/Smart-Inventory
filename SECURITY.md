# Security Implementation Guide

## Overview

This document outlines the security features implemented in the Smart Machine Inventory system.

## Security Features Implemented

### 1. Authentication & Authorization
- **JWT-based authentication** with HTTP-only cookies
- **Role-based access control (RBAC)** with 7 distinct roles
- **Session management** with multi-device tracking
- **Remember Me** functionality with extended sessions

### 2. Input Validation & Sanitization
- SQL injection prevention
- XSS attack prevention
- Path traversal protection
- File upload validation
- Email validation
- Password policy enforcement

### 3. Rate Limiting
- Login attempts: 5 attempts per 15 minutes
- API requests: 100 requests per minute
- Critical operations: 10 requests per minute
- Automatic blocking on excessive failed attempts

### 4. Security Headers
- Content Security Policy (CSP)
- X-Frame-Options (Clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- Strict-Transport-Security (HTTPS enforcement)
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

### 5. CSRF Protection
- Token-based CSRF validation
- Secure token generation and verification
- Automatic protection for state-changing operations

### 6. IP Filtering
- IP blacklist management
- IP whitelist support
- Automatic IP blocking on suspicious activity

### 7. Audit Logging
- Login/logout tracking
- Failed authentication attempts
- Access denied events
- Data modification tracking
- Suspicious activity detection

### 8. Data Encryption
- AES-256-GCM encryption for sensitive data
- Password hashing with bcrypt
- Secure session token generation

### 9. Session Security
- Maximum 5 concurrent sessions per user
- Automatic session expiration
- Session cleanup for expired tokens
- Device tracking

## Configuration

### Environment Variables

Required:
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="minimum-32-characters-long"
```

Optional Security:
```env
CSRF_SECRET="your-csrf-secret"
WHITELISTED_IPS="ip1,ip2,ip3"
ENCRYPTION_KEY="your-encryption-key-32-chars"
MAX_FILE_SIZE="5242880"
```

### Password Policy

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Cannot reuse last 5 passwords
- Expires after 90 days

## API Security

### Rate Limits

| Endpoint Type | Window | Max Requests |
|--------------|--------|--------------|
| Login | 15 min | 5 attempts |
| API (General) | 1 min | 100 requests |
| Critical Ops | 1 min | 10 requests |

### Authentication Flow

1. Client sends credentials to `/api/auth/login`
2. Server validates with rate limiting
3. On success, JWT token set as HTTP-only cookie
4. Subsequent requests include cookie automatically
5. Middleware validates token on each request

## File Upload Security

- Maximum file size: 5MB
- Allowed types: Images (JPEG, PNG, GIF, WebP), PDF, Excel
- Filename sanitization
- Path traversal prevention
- MIME type validation

## Best Practices

### For Developers

1. **Always validate input** - Use validation functions in `src/lib/security/validation.ts`
2. **Use parameterized queries** - Prisma ORM handles this automatically
3. **Log security events** - Use `auditLogger` for critical operations
4. **Handle errors securely** - Don't expose sensitive information in error messages
5. **Keep dependencies updated** - Run `npm audit` regularly

### For Administrators

1. **Use strong passwords** - Follow password policy requirements
2. **Enable IP whitelisting** - For production environments
3. **Monitor audit logs** - Check for suspicious activity regularly
4. **Rotate secrets** - Change JWT_SECRET and other secrets periodically
5. **Use HTTPS only** - Never deploy without SSL/TLS in production
6. **Regular backups** - Maintain encrypted database backups

## Security Checklist for Production

- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET (minimum 32 characters)
- [ ] Configure CSRF_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Set up IP whitelisting (if applicable)
- [ ] Configure proper CORS origins
- [ ] Enable audit logging
- [ ] Set up monitoring and alerts
- [ ] Review and restrict file upload permissions
- [ ] Configure database connection limits
- [ ] Set up automated backups
- [ ] Enable rate limiting
- [ ] Review and update security headers
- [ ] Test authentication flow
- [ ] Verify role-based access control

## Incident Response

### Suspected Breach

1. Immediately revoke all active sessions
2. Force password reset for affected users
3. Review audit logs for unauthorized access
4. Check for data exfiltration
5. Update all secrets and credentials
6. Notify relevant stakeholders

### Failed Login Attempts

- After 5 failed attempts: Account locked for 30 minutes
- IP is temporarily blacklisted
- Admin notification (if configured)
- Audit log entry created

## Testing Security

### Manual Testing

```bash
# Test rate limiting
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test","password":"wrong"}' \
  -v

# Test CSRF protection
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}' \
  -v

# Test security headers
curl -I http://localhost:3000
```

### Automated Testing

Run security audit:
```bash
npm audit
npm audit fix
```

## Compliance Considerations

This implementation addresses:
- **OWASP Top 10** security risks
- **Data protection** best practices
- **Access control** requirements
- **Audit trail** requirements

## Support

For security concerns or to report vulnerabilities, contact your system administrator immediately.

**Last Updated:** 2025
