TokTasks: TikTok-like daily tasks with token rewards and Stripe payouts
==============================================================================

Stack
- Next.js 16 (App Router, TypeScript, Tailwind)
- Prisma 6 + SQLite
- Stripe Connect (mocked transfer in dev)

## Getting Started

Getting started
1) Install deps
```bash
npm install
```
2) Create .env
```bash
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
```
3) Generate and migrate
```bash
npm run prisma:generate
npx prisma migrate deploy
```
4) Seed demo data
```bash
npm run seed
```
5) Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

Features
- 10 daily tasks per user reset every 24h (UTC day)
- Completing tasks awards tokens; token ledger and balance endpoints
- Stripe Connect onboarding link and redemption endpoint
- Minimal UI: Home with login, Tasks page, Wallet page

Scripts
- npm run seed           # seeds templates and demo user
- npm run reset:tasks    # generate today’s tasks for all users

API
- POST /api/auth/register { email, username, password }
- POST /api/auth/login { email, password }
- POST /api/auth/logout
- GET  /api/tasks/today
- POST /api/tasks/progress { taskId }
- GET  /api/wallet/balance
- GET  /api/wallet/transactions
- POST /api/stripe/connect
- POST /api/stripe/redeem { tokens }
