<div align="center">

# TrackJobApplications

**Never lose track of a job application again.**

[![CI](https://github.com/yigitcankzl/trackjobapplications/actions/workflows/ci.yml/badge.svg)](https://github.com/yigitcankzl/trackjobapplications/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![Django 4](https://img.shields.io/badge/Django-4-092E20?logo=django&logoColor=white)](https://djangoproject.com)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)

[**Live Demo**](https://trackjobapplications-eight.vercel.app) · [API Docs](https://trackjobapplications-backend.fly.dev/api/v1/schema/swagger-ui/) · [Report Bug](https://github.com/yigitcankzl/trackjobapplications/issues)

</div>

---

## What is this?

TrackJobApplications is a full-stack job application tracker with a browser extension that auto-captures job listings from LinkedIn and Indeed — so you can focus on applying, not on spreadsheets.

- **Web dashboard** — add, edit, filter, and export your pipeline
- **One-click capture** — browser extension detects LinkedIn/Indeed listings and saves them instantly
- **Status tracking** — Applied → Interview → Offer → Rejected, with notes on every entry
- **Gmail integration** — add-on surfaces relevant emails alongside each application

---

## Screenshots

> _Add your dashboard and extension screenshots here_

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Query |
| Backend | Django 4, Django REST Framework, SimpleJWT, Celery, Argon2 |
| Database | Neon PostgreSQL |
| Cache / Queue | Upstash Redis |
| Extension | Chrome/Firefox MV3, AES-256-GCM token storage |
| Hosting | Vercel (frontend) · Fly.io (backend) |
| CI | GitHub Actions |

---

## Architecture

```
  ┌──────────────────────────────────────┐
  │  Browser Extension  (MV3)            │
  │  LinkedIn · Indeed · Gmail scripts   │
  │  AES-256-GCM encrypted token storage │
  └────────────────┬─────────────────────┘
                   │  HTTPS + JWT cookie
  ┌────────────────▼─────────────────────┐
  │  React + Vite  ──  Vercel            │
  └────────────────┬─────────────────────┘
                   │  HTTPS + CSRF token
  ┌────────────────▼─────────────────────┐
  │  Django + DRF  ──  Fly.io            │
  ├──────────────┬───────────────────────┤
  │  Neon        │  Upstash Redis        │
  │  PostgreSQL  │  (broker + cache)     │
  └──────────────┴───────────────────────┘
```

---

## Quick Start

**Requirements:** Docker + Docker Compose · Node 20+

```bash
git clone <repo-url>
cd trackjobapplications
cp trackjobapplications-backend/.env.example trackjobapplications-backend/.env
# set SECRET_KEY, POSTGRES_PASSWORD, REDIS_PASSWORD in .env
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3003 |
| Backend | http://localhost:8000 |
| Swagger | http://localhost:8000/api/v1/schema/swagger-ui/ |

### Run tests

```bash
# Backend
docker compose exec backend pytest -v

# Frontend
cd trackjobapplications-frontend && npm ci && npm test

# Extension
cd trackjobapplications-extension && npm ci && npm test
```

---

## Browser Extension

1. Go to `chrome://extensions` (or `about:debugging` in Firefox)
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `trackjobapplications-extension/` folder
4. Open any LinkedIn or Indeed job page — the save button appears automatically

> Tokens are encrypted with **AES-256-GCM**. The key is derived via HKDF from `chrome.runtime.id` and never leaves your device.

---

## Security

| Concern | Mitigation |
|---------|-----------|
| Authentication | httpOnly JWT cookies · 15 min access / 7 day refresh + rotation |
| CSRF | Double-submit cookie (`X-CSRFToken`) on all mutating requests |
| Brute force | `django-axes` lockout + `ScopedRateThrottle` per endpoint |
| Passwords | Argon2id |
| Extension tokens | AES-256-GCM, HKDF key per installation |
| Content scripts | `sender.id` verified on every `onMessage` listener |
| CSV injection | Formula-prefix sanitisation + whitespace bypass protection |
| Email enumeration | Constant-time responses + timing padding on reset path |

---

## Environment Variables

<details>
<summary>Backend <code>.env</code> reference</summary>

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `False` in production |
| `ALLOWED_HOSTS` | Comma-separated hostnames |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Database connection |
| `REDIS_PASSWORD` | Redis auth password |
| `CELERY_BROKER_URL` | Redis URL for Celery |
| `FRONTEND_URL` | Used in password-reset and verification emails |
| `EMAIL_HOST` / `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` | SMTP settings |

</details>

---

## Deployment

| Component | Platform | Command |
|-----------|----------|---------|
| Backend | Fly.io | `fly deploy` from `trackjobapplications-backend/` |
| Frontend | Vercel | Auto-deploys on push to `master` |
| Extension | Chrome Web Store / Firefox Add-ons | Zip `trackjobapplications-extension/` and submit |

---

## CI

GitHub Actions runs on every push and pull request:

- **Backend** — pytest with live PostgreSQL + Redis services
- **Frontend** — TypeScript → ESLint → `npm audit` → Vitest → Vite build
- **Extension** — Vitest unit tests

---

## License

MIT © [yigitcankzl](https://github.com/yigitcankzl)
