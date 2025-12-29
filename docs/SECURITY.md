# Security Hardening

This document outlines the security measures implemented to protect the platform.

## 1. Network & Protocol
- **CORS**: Restricted to trusted origins (Local development and Netlify production).
- **Helmet**: Implements security headers (XSS protection, Clickjacking defense, HSTS).
- **Rate Limiting**: Globally applied (100 requests per 15 mins) to prevent DDoS and brute-force.

## 2. Data Protection
- **XSS Sanitization**: All user-provided text (exam titles, questions, etc.) is sanitized using the `xss` library before being stored.
- **NoSQL Injection**: `express-mongo-sanitize` strips malicious MongoDB operators from incoming requests.
- **JWT Verification**: Strict verification of tokens on every protected route.

## 3. Content Security
- **Projections**: Correct answers are filtered out at the database level for participants.
- **Passwords**: Never stored in plain text; hashed with high-cost salt.
- **API Versioning**: versioned routes (`/api/v1`) allow for secure updates without breaking older clients.

