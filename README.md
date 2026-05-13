# Uzimatek Health Kenya — MVP

> AI-powered SHA/SHIF Revenue Cycle Management for Kenyan healthcare providers

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui |
| State | Zustand · TanStack Query |
| Backend | Fastify · TypeScript · Node.js 20 |
| Database | PostgreSQL 16 + pgvector (Supabase in prod) |
| ORM | Prisma 5 |
| AI | Claude Sonnet 4.6 (coding) · Claude Haiku 4.5 (tasks) |
| Auth | JWT + bcrypt · OTP via Africa's Talking |
| Jobs | BullMQ + Redis |
| Payments | Daraja API (M-Pesa) · Flutterwave |
| Email | Resend |
| CI/CD | GitHub Actions |

## Quick Start (Demo Mode)

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)
- Docker Desktop (for Postgres + Redis)

### 1. Start infrastructure
```bash
docker compose up -d
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Set up environment
```bash
cp .env .env.local
# Add your ANTHROPIC_API_KEY to .env.local
```

### 4. Initialize database
```bash
pnpm db:push
pnpm db:seed
```

### 5. Run development servers
```bash
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001
- DB Studio: `pnpm db:studio`

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Biller | wanjiku@aiclitein.or.ke | Demo@2026! |
| Manager | manager@aiclitein.or.ke | Demo@2026! |
| Super Admin | admin@uzimatek.co.ke | Demo@2026! |

## Architecture

```
uzimatek/
├── apps/
│   ├── web/          → Next.js 15 frontend (port 3000)
│   └── api/          → Fastify backend (port 3001)
├── packages/
│   ├── db/           → Prisma schema + migrations
│   ├── shared-types/ → Zod schemas, shared TypeScript types
│   ├── ai/           → AI coding pipeline (Claude API)
│   └── ui/           → shadcn component library
├── services/
│   ├── sha-submit/   → SHA Portal API integration
│   ├── status-sync/  → Background claim status polling
│   └── billing/      → M-Pesa + invoicing
├── docker-compose.yml
└── .env.example
```

## Modules

| # | Module | Status |
|---|--------|--------|
| M1 | Authentication & RBAC | ✅ Complete |
| M2 | Facility & Provider Setup | ✅ Complete |
| M3 | Encounter Ingestion (manual + CSV) | ✅ Complete |
| M4 | AI Coding Engine (Claude + ICD-10) | ✅ Complete |
| M5 | Claims Workbench | ✅ Complete |
| M6 | SHA Portal Integration (mock/API) | ✅ Mock ready |
| M7 | Denial Management + Appeal Letters | ✅ Complete |
| M8 | Dashboards & Reporting | ✅ Complete |
| M9 | Audit Trail (hash chain) | ✅ Complete |
| M10 | Billing & M-Pesa | ✅ Complete |

## API Endpoints

```
POST   /v1/auth/login
POST   /v1/auth/refresh
GET    /v1/facilities/me
GET    /v1/encounters
POST   /v1/encounters
POST   /v1/encounters/:id/code       ← AI coding trigger
POST   /v1/encounters/bulk
GET    /v1/claims
GET    /v1/claims/:id
PATCH  /v1/claims/:id
POST   /v1/claims/:id/submit
POST   /v1/claims/bulk-submit
POST   /v1/claims/:id/resubmit
GET    /v1/denials
POST   /v1/denials/:id/appeal-letter ← LLM appeal letter
GET    /v1/dashboards/executive
GET    /v1/dashboards/operational
GET    /v1/dashboards/denials
GET    /v1/billing/usage
POST   /v1/billing/mpesa/callback
GET    /v1/audit
```

## Production Deployment

### Supabase Setup
1. Create project at supabase.com
2. Enable pgvector extension
3. Set DATABASE_URL and DIRECT_URL in Railway/Render env vars

### Railway Deployment
```bash
railway login
railway init
railway up
```

### Environment Variables (Production)
- `ANTHROPIC_API_KEY` — Claude API key
- `DATABASE_URL` — Supabase connection string
- `JWT_SECRET` — Strong random string (32+ chars)
- `AFRICASTALKING_API_KEY` — SMS/OTP
- `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` — M-Pesa Daraja

## Security
- bcrypt cost ≥ 12 for passwords
- JWT access tokens: 30min TTL
- Row-level security enforced at DB layer
- Tamper-evident audit log (SHA-256 hash chain)
- TLS 1.3 in transit, AES-256 at rest
- OWASP Top 10 mitigations implemented
- Data Protection Act 2019 compliant design

## License
Confidential — Uzimatek Health Kenya Ltd © 2026
