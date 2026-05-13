# Uzimatek Deployment Guide

## Stack
| Service    | Platform  | Free Tier |
|------------|-----------|-----------|
| Frontend   | Vercel    | ✅         |
| API        | Railway   | ✅ $5/mo  |
| Database   | Supabase  | ✅ 500MB  |
| Redis      | Upstash   | ✅ 10K/day|

---

## Step 1 — Supabase (Database)

1. Create account at **supabase.com**
2. New project → note your **Project URL** and **anon key** (Settings → API)
3. Get the **connection string** (Settings → Database → Connection string → URI)
   - Use the **Transaction pooler** URL (port 6543) for the API
   - Use the **Direct connection** URL (port 5432) for migrations
4. Push schema:
   ```bash
   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" \
   DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
   node node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js db push \
     --schema=packages/db/prisma/schema.prisma
   ```
5. Seed demo data:
   ```bash
   DATABASE_URL="<your-direct-url>" node seed-now.mjs
   ```

---

## Step 2 — Railway (API)

1. Create account at **railway.app**
2. New Project → Deploy from GitHub repo
3. Select the repo → Railway auto-detects `railway.toml`
4. Add environment variables in Railway dashboard:
   ```
   DATABASE_URL=<supabase-transaction-pooler-url>
   DIRECT_URL=<supabase-direct-url>
   JWT_SECRET=<generate-32-char-random-string>
   JWT_REFRESH_SECRET=<generate-32-char-random-string>
   ANTHROPIC_API_KEY=<your-anthropic-key>
   REDIS_URL=<upstash-redis-url>
   NODE_ENV=production
   API_PORT=3001
   API_HOST=0.0.0.0
   ```
5. Deploy → note the **Railway public URL** (e.g. `https://api-xxx.up.railway.app`)

---

## Step 3 — Vercel (Frontend)

1. Create account at **vercel.com**
2. New Project → Import GitHub repo
3. Vercel detects Next.js automatically (uses `vercel.json`)
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api-xxx.up.railway.app
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
5. Deploy → your app is live at `https://your-app.vercel.app`

---

## Step 4 — Upstash Redis (Optional, for BullMQ jobs)

1. Create account at **upstash.com**
2. New Redis database → copy **REDIS_URL**
3. Add to Railway env vars

---

## Quick secrets generator
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Demo Credentials
- **Biller:** wanjiku@aiclitein.or.ke / Demo@2026!
- **Manager:** manager@aiclitein.or.ke / Demo@2026!
- **Admin:** admin@uzimatek.co.ke / Demo@2026!
