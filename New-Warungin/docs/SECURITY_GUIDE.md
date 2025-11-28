# Security Guide

## Overview

This document outlines security measures implemented in the Warungin application.

## Security Headers

### Content Security Policy (CSP)

Strict CSP is configured to prevent XSS attacks:

- `defaultSrc`: Only allow resources from same origin
- `scriptSrc`: Restricted to trusted sources
- `styleSrc`: Allows inline styles (required for Vue)
- `imgSrc`: Allows images from HTTPS and data URIs

### HSTS (HTTP Strict Transport Security)

- Max age: 1 year
- Include subdomains: Yes
- Preload: Enabled

### Other Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`: Restricts browser features

## Authentication & Authorization

### JWT Tokens

- Access tokens: Short-lived (configurable)
- Refresh tokens: Long-lived with rotation
- Secure storage: HttpOnly cookies (optional) or secure localStorage

### Password Security

- Bcrypt hashing (10 rounds)
- Password history (prevents reuse)
- Minimum length: 8 characters
- Must change password on first login

### Two-Factor Authentication (2FA)

- TOTP-based (Time-based One-Time Password)
- Backup codes support
- Required for admin roles

## Rate Limiting

### API Rate Limiting

- 500 requests per 15 minutes per IP
- Stricter limits for auth endpoints (20 requests per 15 minutes)

### Protection Against

- Brute force attacks
- DDoS attacks
- API abuse

## Input Validation & Sanitization

### Backend

- Express-validator for input validation
- DOMPurify for HTML sanitization
- Prisma for SQL injection protection

### Frontend

- Input validation on forms
- XSS protection via Vue's template system
- DOMPurify for user-generated content

## Data Protection

### Encryption

- Passwords: Bcrypt hashed
- JWT secrets: Strong random strings
- Database: Encrypted connections (SSL/TLS)

### Data Access

- Row-level security (RLS) in database
- Tenant isolation
- Role-based access control (RBAC)

## Audit Logging

All critical actions are logged:

- User logins/logouts
- Data modifications
- Permission changes
- Security events

## Security.txt

Security contact information available at:
`/.well-known/security.txt`

## Best Practices

### For Developers

1. Never commit secrets to repository
2. Use environment variables for sensitive data
3. Keep dependencies updated
4. Review security advisories regularly
5. Follow secure coding practices

### For Deployment

1. Use HTTPS only
2. Keep server updated
3. Regular security audits
4. Monitor logs for suspicious activity
5. Backup data regularly

## Reporting Security Issues

Report security vulnerabilities to:
- Email: support@warungin.com
- Include: Description, steps to reproduce, impact

## Compliance

- GDPR: Data protection and user rights
- Data retention policies
- User consent management

