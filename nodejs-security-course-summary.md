# Node.js Security in Production & Deployment — Full Course 2026

**Tags:** #NodeJS #BackendDevelopment #WebSecurity #JWT #CSRF

## One-line summary

A full, hands-on course that takes a starter Node.js/Express + React app and hardens it for production: proper auth with access/refresh tokens in httpOnly cookies, CSRF and CORS protection, RBAC/ownership checks, rate limiting, NoSQL-injection prevention, request validation, Express/HTTP hardening, safe env/config handling, and finally deploying the whole stack to a VPS with Docker.

## Chapter breakdown

### Introduction
Overview of what the course covers and why security is treated as a first-class concern rather than an afterthought — auth, cookies, CSRF, CORS, validation, rate limiting, RBAC, NoSQL injection, Express hardening, env safety, and full VPS deployment.

### Cookies, Tokens & JWT (concepts)
Core auth-token theory before implementation:
- **Access token vs refresh token** — access token is short-lived (small blast radius if stolen); refresh token is long-lived and used only to mint new access tokens, so it must be handled carefully.
- Analogy used: access token = temporary pass, refresh token = the card kept in your desk that you use to issue a new pass.
- **Cookies vs JS-readable storage** — plain JS can read a token if it's stored in localStorage/regular cookies.
- **`httpOnly` cookies** — prevents JS from reading the cookie, which mitigates token theft via **XSS**.
- **`secure`** — cookie is only sent over HTTPS (required for real production apps).
- **`sameSite`** — set to `strict`/`lax` to control cross-site sending of cookies.

### CSRF (concepts)
- Explains the CSRF threat model: because browsers attach cookies automatically, a malicious site can trigger the victim's browser to send a request to your app **even though your frontend never initiated it**.
- **XSS vs CSRF** distinction: XSS = attacker runs their JS *on* your site; CSRF = attacker abuses the browser's *trust* from another site.
- Walks through an Excalidraw sequence diagram of the token refresh/logout flow between **User Browser** and **Server**:
  - `POST /auth/refresh` → server verifies refresh token → issues new access-token cookie
  - `POST /auth/logout` → server clears cookies
  - Ongoing requests are protected by verifying the access token per request.

### CORS (concepts)
- **CORS = browser-enforced origin policy** — the browser blocks disallowed cross-origin frontend calls (this is a browser-side protection, not a server-side one).
- Bridges into the auth design: registration hashes passwords with **bcrypt/argon2**; login looks up the user **by email only**.

### Implementing Cookies, Tokens, JWT, CSRF, CORS
Live implementation of everything above in the Express backend and React frontend: issuing JWT access/refresh tokens, setting them as httpOnly/secure/sameSite cookies, wiring up CSRF-safe request patterns, and configuring CORS correctly between the Vite client and the Express API.

### RBAC and ownership concepts
- **Authentication** → "do you have a valid access token?"
- **Authorization** → "what role is this user — regular user or admin?"
- **Ownership** → does this specific user own the resource being accessed, or are they an admin who can override ownership checks? (illustrated with an example admin vs. a regular named user).

### Implementing RBAC, routes and frontend integration of auth flow
Builds RBAC middleware and protected routes on the backend, and integrates the full auth flow (login/register/refresh/logout, protected pages, role-based UI) into the React frontend, using the `Login.tsx` / `Register.tsx` / `Home.tsx` pages seen in the project structure.

### Rate limiting, NoSQL injection, request validation, Express hardening, env & config concepts
Dense concepts chapter covering several hardening topics:
- **Rate limiting** — framed as anti-spam / anti-abuse-speed control. Covers brute-force login attempts, refresh-token hammering, and general API abuse. Distinguishes **IP-level rate limiting** (slows repeated requests from one client IP) from **account-level locking** (locks a specific known account).
- **NoSQL injection prevention** — validate the *shape* of input first; build the database filter yourself server-side rather than trusting client-supplied filter objects; only allow an explicit allow-list of fields through (relevant for facet-style filters).
- **HTTP/Express hardening** — using `helmet` for secure HTTP headers, disabling the `X-Powered-By` header, and limiting request body size.
- **Env & config safety** — avoid weak fallback secrets; missing required env vars should fail loudly rather than silently breaking things; load env vars once and validate them once at startup (using **Zod** for schema validation).

### Implementing Rate Limiting, schema validation and env management
Hands-on implementation of the above: adding a rate-limiting middleware, Zod-based request/env schema validation, and centralized, validated env/config loading in the Express app.

### Complete VPS deployment via terminal
Final deployment walkthrough: connecting to the VPS terminal, using `docker-compose.yml` to bring up the `client` and `server` containers (`node server`, `node client` scripts visible in the terminal), and verifying the app runs correctly in production (MongoDB connecting, "Server running on port 5000" in the logs).

## Key takeaways / cheat sheet

| Concern | Approach used in the course |
|---|---|
| Token storage | httpOnly, secure, sameSite cookies — never localStorage |
| Token lifecycle | Short-lived access token + long-lived refresh token, refreshed via `/auth/refresh` |
| XSS mitigation | httpOnly cookies (JS can't read tokens) |
| CSRF mitigation | sameSite cookies + explicit refresh/logout flow design |
| CORS | Browser-enforced origin allow-listing between client and API |
| Password storage | bcrypt or argon2 hashing |
| Login lookup | By email only |
| Authorization model | Authentication (valid token) → Authorization (role) → Ownership (resource-level check) |
| Abuse prevention | IP-level + account-level rate limiting |
| NoSQL injection | Validate input shape, build filters server-side, allow-list fields |
| HTTP hardening | helmet, disable X-Powered-By, limit body size |
| Config safety | No weak fallback secrets, fail fast on missing env vars, Zod-validated env/config loaded once |
| Deployment | Docker Compose (client + server containers) on a Hostinger VPS |
