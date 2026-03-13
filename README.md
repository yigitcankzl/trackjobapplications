<div align="center">

# TrackJobApplications

**Never lose track of a job application again.**

[![CI](https://github.com/yigitcankzl/trackjobapplications/actions/workflows/ci.yml/badge.svg)](https://github.com/yigitcankzl/trackjobapplications/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![Django 4](https://img.shields.io/badge/Django-4-092E20?logo=django&logoColor=white)](https://djangoproject.com)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)

[**Try It Now**](https://trackjobapplications.com) · [API Docs](https://trackjobapplications-backend.onrender.com/api/v1/schema/swagger-ui/) · [Report Bug](https://github.com/yigitcankzl/trackjobapplications/issues)

</div>

---

## What is this?

TrackJobApplications is a full-stack job application tracker with a browser extension and Gmail add-on that auto-captures job listings from LinkedIn, Indeed, and Gmail — so you can focus on applying, not on spreadsheets.

- **Web Dashboard** — add, edit, filter, and manage your application pipeline
- **Status Tracking** — Applied → Interview → Offer → Rejected, with notes and timelines
- **Analytics** — visualize your job search with charts and statistics
- **Calendar** — track interviews and important dates
- **Cover Letters** — manage and organize cover letters
- **Offer Comparison** — compare job offers side by side
- **Browser Extension** — one-click capture from LinkedIn, Indeed, and Gmail
- **Gmail Add-on** — track applications directly from your inbox sidebar
- **OAuth Login** — sign in with Google or GitHub
- **i18n** — multi-language support

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
│       └── locales/                  #   i18n translations
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

### Run tests

```bash
# Backend
docker compose exec backend pytest -v

# Frontend
cd trackjobapplications-frontend && npm ci && npm test
```

---

## Browser Extension

The extension captures job listings with one click from supported sites:

- **LinkedIn** — extracts job title, company, location, and description from job pages
- **Indeed** — captures job details from listing and detail pages
- **Gmail** — detects job-related emails and extracts application data

### Install (dev mode)

1. `chrome://extensions` → enable Developer mode
2. "Load unpacked" → select `trackjobapplications-extension/`

For Firefox: `about:debugging` → "Load Temporary Add-on" → select `manifest.json`

---

## Gmail Add-on

A Google Apps Script add-on that adds a sidebar to Gmail for tracking job applications directly from your inbox.

- Automatically extracts company, position, and metadata from job emails
- Links emails to existing applications or creates new ones
- Suggests status updates based on email content (interview invite, offer, rejection)

### Setup

1. Open [Google Apps Script](https://script.google.com)
2. Create a new project and copy the `.gs` files from `trackjobapplications-gmail-addon/`
3. Deploy as a Gmail Add-on (test deployment)

---

## Deployment

| Component | Platform | Details |
|-----------|----------|---------|
| Backend | Render | Auto-deploys via `render.yaml` |
| Frontend | Vercel | Auto-deploys on push to `master` |
| Extension | Chrome Web Store / Firefox Add-ons | Manual publish |
| Gmail Add-on | Google Workspace Marketplace | Manual publish |

---

## License

MIT © [yigitcankzl](https://github.com/yigitcankzl)
