# Technical Details

## Quick Start

**Requirements:** Docker + Docker Compose · Node 20+

```bash
git clone https://github.com/yigitcankzl/trackjobapplications.git
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

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, i18next |
| Backend | Django 4, Django REST Framework, SimpleJWT, Celery, Argon2 |
| Database | Neon PostgreSQL |
| Cache / Queue | Upstash Redis |
| Auth | SimpleJWT (httpOnly cookies), python-social-auth (Google, GitHub) |
| Hosting | Vercel (frontend) · Render (backend) |
| Extension | Chrome / Firefox, Manifest V3, AES-GCM encrypted token storage |
| Gmail Add-on | Google Apps Script |
| CI | GitHub Actions |

---

## Project Structure

```
trackjobapplications/
├── trackjobapplications-backend/     # Django REST API
│   ├── config/                       #   Settings, URLs, OAuth strategy
│   ├── users/                        #   Auth, profiles, social login
│   └── applications/                 #   Job tracking, emails, filters
├── trackjobapplications-frontend/    # React SPA
│   └── src/
│       ├── pages/                    #   Dashboard, Analytics, Calendar, ...
│       ├── components/               #   UI components
│       ├── services/                 #   API & auth services
│       └── locales/                  #   i18n translations (EN, TR)
├── trackjobapplications-extension/   # Browser extension (MV3)
│   ├── background/                   #   Service worker
│   ├── content/                      #   LinkedIn, Indeed, Gmail scrapers
│   └── popup/                        #   Extension popup UI
├── trackjobapplications-gmail-addon/ # Google Apps Script add-on
│   ├── Code.gs                       #   Entry points & action handlers
│   ├── Auth.gs                       #   Backend authentication
│   ├── Cards.gs                      #   Gmail sidebar UI cards
│   ├── Extract.gs                    #   Email metadata extraction
│   └── Config.gs                     #   Configuration
├── docker-compose.yml                # Local dev orchestration
└── render.yaml                       # Render deployment config
```

---

## Authentication

- **Web frontend:** JWT tokens in httpOnly cookies (access + refresh)
- **Browser extension:** Bearer token with AES-GCM encryption at rest
- **OAuth:** Google and GitHub via python-social-auth with auth code exchange pattern
  - Backend stores UUID code in Django cache (5min TTL)
  - Frontend exchanges code for JWT cookies via credentialed XHR

---

## Deployment

| Component | Platform | Details |
|-----------|----------|---------|
| Backend | Render | Auto-deploys via `render.yaml` |
| Frontend | Vercel | Auto-deploys on push to `master` |
| Extension | Chrome Web Store / Firefox Add-ons | Manual publish |
| Gmail Add-on | Google Workspace Marketplace | Manual publish |

---

## Browser Extension

Captures job listings with one click from supported sites:

- **LinkedIn** — extracts job title, company, location, and description
- **Indeed** — captures job details from listing and detail pages
- **Gmail** — detects job-related emails and extracts application data

### Install (dev mode)

**Chrome:** `chrome://extensions` → enable Developer mode → "Load unpacked" → select `trackjobapplications-extension/`

**Firefox:** `about:debugging` → "Load Temporary Add-on" → select `manifest.json`

---

## Gmail Add-on

A Google Apps Script add-on that adds a sidebar to Gmail for tracking job applications.

- Extracts company, position, and metadata from job emails
- Links emails to existing applications or creates new ones
- Suggests status updates based on email content

### Setup

1. Open [Google Apps Script](https://script.google.com)
2. Create a new project and copy the `.gs` files from `trackjobapplications-gmail-addon/`
3. Deploy as a Gmail Add-on (test deployment)

---

## Running Tests

```bash
# Backend
docker compose exec backend pytest -v

# Frontend
cd trackjobapplications-frontend && npm ci && npm test
```

---

## Environment Variables

Copy `.env.example` and configure:

```bash
cp trackjobapplications-backend/.env.example trackjobapplications-backend/.env
```

Required: `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`

Optional: `GOOGLE_OAUTH2_KEY`, `GOOGLE_OAUTH2_SECRET`, `GITHUB_KEY`, `GITHUB_SECRET`
