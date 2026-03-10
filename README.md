# TrackJobApplications

A full-stack job application tracker with a Django REST backend, React frontend, and a Chrome/Firefox browser extension that auto-fills applications from LinkedIn, Indeed, and Gmail.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser Extension (MV3)                                │
│  content/linkedin.js · content/indeed.js · content/     │
│  gmail.js → background/service-worker.js (AES-256-GCM) │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTPS / JWT cookie
┌───────────────────▼─────────────────────────────────────┐
│  React + Vite Frontend  (Vercel)                        │
│  Axios · React Query · React Router                     │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTPS + CSRF token
┌───────────────────▼─────────────────────────────────────┐
│  Django 4 + DRF Backend  (Fly.io)                       │
│  SimpleJWT · Celery · django-axes · Argon2              │
├───────────────┬─────────────────────────────────────────┤
│  Neon         │  Upstash Redis                          │
│  PostgreSQL   │  (Celery broker + Django cache)         │
└───────────────┴─────────────────────────────────────────┘
```

## Quick Start (local dev)

### Prerequisites
- Docker + Docker Compose
- Node 20+

### 1. Clone and configure

```bash
git clone <repo-url>
cd trackjobapplications
cp trackjobapplications-backend/.env.example trackjobapplications-backend/.env
# Edit .env — set SECRET_KEY, POSTGRES_PASSWORD, REDIS_PASSWORD at minimum
```

### 2. Start all services

```bash
docker compose up --build
```

| Service   | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost:3003       |
| Backend   | http://localhost:8000       |
| API docs  | http://localhost:8000/api/v1/schema/swagger-ui/ |

### 3. Run backend tests

```bash
docker compose exec backend pytest -v
```

### 4. Run frontend tests

```bash
cd trackjobapplications-frontend
npm ci && npm test
```

### 5. Run extension tests

```bash
cd trackjobapplications-extension
npm ci && npm test
```

## Browser Extension — Manual Installation

1. Open `chrome://extensions` (or `about:debugging` in Firefox)
2. Enable **Developer mode**
3. Click **Load unpacked** → select `trackjobapplications-extension/`
4. Navigate to a LinkedIn or Indeed job listing — buttons appear automatically

The extension stores your JWT token encrypted with **AES-256-GCM**. The key is derived via HKDF from `chrome.runtime.id` so it is unique per installation and never leaves the device.

## Security Model

| Concern | Mitigation |
|---------|-----------|
| Authentication | httpOnly JWT cookies (access 15 min, refresh 7 days) + rotation |
| CSRF | Double-submit cookie (`X-CSRFToken`) on all mutating requests |
| Brute force | `django-axes` lockout + `ScopedRateThrottle` per endpoint |
| Password storage | Argon2id via Django's password hasher |
| Extension token storage | AES-256-GCM, key via HKDF from `chrome.runtime.id` |
| Content script isolation | `sender.id` check on all `onMessage` listeners |
| CSP | Strict MV3 extension CSP + nginx CSP headers on frontend |
| CSV injection | Formula-prefix sanitisation + whitespace bypass protection |
| Email enumeration | Constant-time responses + timing padding on reset path |

## Environment Variables (backend)

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `False` in production |
| `ALLOWED_HOSTS` | Comma-separated hostnames |
| `POSTGRES_*` | Database connection |
| `REDIS_PASSWORD` | Redis auth password |
| `CELERY_BROKER_URL` | Redis URL for Celery |
| `FRONTEND_URL` | Used in password reset / verification emails |
| `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | SMTP settings |

## Production Deployment

- **Backend:** Fly.io (`fly deploy` from `trackjobapplications-backend/`)
- **Frontend:** Vercel (auto-deploys on push to `master`)
- **Extension:** Submit `trackjobapplications-extension/` as a zip to the Chrome Web Store / Firefox Add-ons

## CI

GitHub Actions runs on every push and pull request:
- Backend: `pytest` with PostgreSQL + Redis services
- Frontend: TypeScript type check → ESLint → `npm audit` → Vitest → Vite build
- Extension: Vitest unit tests (via Dependabot PRs)
