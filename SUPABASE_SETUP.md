# Supabase Setup Guide

Step-by-step instructions to connect Uzimatek to a Supabase project.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Choose your organisation, name the project **uzimatek-mvp**, pick the **af-south-1 (Cape Town)** region (closest to Kenya), and set a strong database password.
4. Wait ~2 minutes for provisioning.

---

## 2. Get Your Credentials

Inside the project dashboard:

1. Go to **Settings → API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)
3. Go to **Settings → Database → Connection String**.
4. Select the **URI** tab and copy two strings:
   - **Pooler (Transaction mode)** → `DATABASE_URL` (used by Prisma at runtime via PgBouncer)
   - **Direct** → `DIRECT_URL` (used by `prisma db push` / migrations)

> The pooler URL looks like:
> `postgresql://postgres.[ref]:[password]@aws-0-af-south-1.pooler.supabase.com:6543/postgres`
>
> The direct URL looks like:
> `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`

---

## 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the values obtained above:

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-af-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"
```

---

## 4. Enable Required Extensions

In Supabase dashboard → **SQL Editor**, run:

```sql
-- Enable pgvector for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid-ossp (usually pre-enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 5. Push the Prisma Schema

From the repo root:

```bash
cd packages/db
pnpm dlx prisma db push
```

This creates all tables in Supabase without generating a migration file (ideal for early dev). When you're ready for production migrations use `prisma migrate dev` instead.

---

## 6. Seed Demo Data

From the repo root:

```bash
node seed-now.mjs
```

This creates:
- Demo facility: **AIC Litein Mission Hospital**
- Two demo users: biller (`wanjiku@aiclitein.or.ke`) + manager (`manager@aiclitein.or.ke`)
- Password for both: `Demo@2026!`
- Sample encounters, claims, and denials

---

## 7. Set Up Row-Level Security (RLS)

After pushing the schema, enable RLS on sensitive tables:

```sql
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE denials ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
```

Add facility-scoped policies (adjust to your auth strategy):

```sql
-- Example: users can only see their own facility's claims
CREATE POLICY "facility_claims" ON claims
  USING (facility_id = current_setting('app.current_facility_id')::uuid);
```

---

## 8. Verify Connection

```bash
cd packages/db
pnpm dlx prisma studio
```

Prisma Studio will open at `http://localhost:5555` — you should see all tables populated with seed data.

---

## Notes

- `DATABASE_URL` uses the **pooler** (PgBouncer) connection — required for serverless/edge environments. Append `?pgbouncer=true` to the URL.
- `DIRECT_URL` bypasses PgBouncer — required for `prisma db push`, `prisma migrate`, and `prisma studio`.
- The Supabase `anon` key is safe to expose in the browser because RLS policies control data access.
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` in the browser or commit it to git.
