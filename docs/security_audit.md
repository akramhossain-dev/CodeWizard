# 🛡️ CodeWizard Security & Hardening Reference

This document outlines the security mechanisms implemented to harden CodeWizard for a production environment. 

---

## 🔑 1. Credential Guard & Startup Protections
To prevent insecure configurations or leaked repository placeholders from reaching a live server, the backend executes a fail-fast startup check:
- **Entropy Enforcement:** Keys (`JWT_SECRET`, `ENCRYPTION_SECRET`, `ADMIN_SECRET_KEY`, `CRYPTO_PEPPER`) must be at least **128 characters long** when `NODE_ENV=production`.
- **Known-Weak Pattern Block:** Startup will abort immediately if any credential contains default strings (e.g. `change_this`, `placeholder`, `your_secret`).
- **Production Host Verification:** If `NODE_ENV=production` is active and the `CLIENT_URL` contains `localhost` or uses insecure `http://`, the server will log an error and call `process.exit(1)`.

---

## 🐳 2. Sandboxed Code Execution
User-submitted code is highly untrusted and could contain malicious commands (e.g. infinite loops, fork bombs, disk scrapers, or network scans). The worker enforces isolation boundaries:
- **Non-Root Execution:** Containers run under a low-privilege `USER appuser`.
- **Network Isolation:** `--network none` blocks internet access entirely inside the container.
- **Read-Only Roots:** Filesystems are mounted read-only (`--read-only`) to prevent code from writing malware or system files.
- **Binary Block in `/tmp`:** Mounted with `--tmpfs /tmp:rw,noexec,nosuid,size=10m` to prevent executing dynamically compiled binaries or script files inside `/tmp`.
- **Resource Caps:** CPU execution time and memory (RAM limit: 256MB) are capped. Memory overflow triggers immediate SIGKILL, returning a standard `Runtime Error (OOM)`.

---

## 🍪 3. Cookie Hardening & Session Security
JWTs are stored using secure cookie configurations across all local, Google, and GitHub login flows:
- **`httpOnly`:** Prevents cross-site scripting (XSS) scripts from accessing the session token.
- **`secure: true`:** Restricts cookies to HTTPS-only transmissions.
- **`sameSite: strict`:** Protects against Cross-Site Request Forgery (CSRF) attacks by ensuring cookies are only sent for requests originating from the site's own domain.

---

## 🚦 4. Distributed Rate Limiting
To defend against brute-force attacks and denial-of-service attempts, rate limiters are configured using `redis-store` to maintain state consistency across multiple instances:
- **Global Rate Limiter:** 200 requests per 15 minutes per IP.
- **Submissions Limiters:** Capped to **20 judge submissions/min** and **30 test runs/min** to protect server CPU.
- **Admin Authentication Limiters:** **5 signup attempts/15 min** and **10 signin attempts/15 min** to block dictionary attacks.

---

## 🪵 5. Observability & PII Redaction
The logging system uses `pino` to write structured JSON outputs:
- **Redaction:** Sensitive keys (such as `password`, `token`, `newPassword`, and `creditCard`) are automatically redacted from logs.
- **Error Sanitization:** Production errors are caught globally. Stack traces are suppressed from client responses and logged internally to prevent exposing server file paths or database structure.
