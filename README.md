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
- **Status tracking** — Applied → Interview → Offer → Rejected, with notes on every entry
- **Browser Extension** — coming soon
- **Gmail Add-on** — coming soon

---

## Screenshots

> Coming soon

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Query |
| Backend | Django 4, Django REST Framework, SimpleJWT, Celery, Argon2 |
| Database | Neon PostgreSQL |
| Cache / Queue | Upstash Redis |
| Hosting | Vercel (frontend) · Fly.io (backend) |
| CI | GitHub Actions |

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
```

---

## Browser Extension & Gmail Add-on

> Coming soon

---

## Deployment

| Component | Platform | Command |
|-----------|----------|---------|
| Backend | Fly.io | `fly deploy` from `trackjobapplications-backend/` |
| Frontend | Vercel | Auto-deploys on push to `master` |

---

## License

MIT © [yigitcankzl](https://github.com/yigitcankzl)
