@echo off
cd /d "C:\Users\eadri\OneDrive\Desktop\UzimatekMVP\packages\db"
set DATABASE_URL=postgresql://postgres.cgqmlnsmnelxvhovhswi:Bestintheworld821*@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
set DIRECT_URL=postgresql://postgres.cgqmlnsmnelxvhovhswi:Bestintheworld821*@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
npx prisma@5.22.0 db push
pause
