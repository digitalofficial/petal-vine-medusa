# Petal & Vine — Commerce Backend

[Medusa v2](https://medusajs.com) backend powering the Petal & Vine florist shop:
product catalogue, cart, Stripe checkout, inventory, and a built-in admin
dashboard with a custom analytics page.

## Architecture

| Piece | Repo | Hosting |
|-------|------|---------|
| **Storefront** (Next.js 14) | `petal-and-vine-v3` (sibling repo) | Vercel |
| **Backend** (Medusa 2.16) | this repo | Railway |
| **Database** | PostgreSQL | Railway |
| **Payments** | Stripe | — |

The storefront fetches the store API client-side (see `Shop.tsx` in the
storefront repo) using a Medusa **publishable key**, and completes checkout via
the Stripe payment provider (`pp_stripe_stripe`).

- **API base:** `https://petal-vine-medusa-production.up.railway.app`
- **Admin dashboard:** `/app`

## Local development

```bash
yarn install
cp .env.template .env          # then fill in DATABASE_URL, STRIPE_API_KEY, etc.
yarn medusa db:migrate         # run migrations
yarn dev                       # starts Medusa in watch mode
```

The admin dashboard is served at `http://localhost:9000/app`. Create an admin
user with:

```bash
npx medusa user -e you@example.com -p your-password
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `STORE_CORS` / `ADMIN_CORS` / `AUTH_CORS` | allowed origins (include the Vercel storefront domain in `STORE_CORS`) |
| `JWT_SECRET` / `COOKIE_SECRET` | auth secrets |
| `STRIPE_API_KEY` | Stripe **secret** key (`sk_…`). The config also accepts `STRIPE_SECRET_KEY`. |
| `MEDUSA_BACKEND_URL` | public backend URL, so the admin dashboard targets the right API |

> The Stripe payment provider is only registered when a key is present, so a
> missing key disables card payments instead of crashing the server on boot.

## Deployment (Railway)

- **Build:** none set — Nixpacks auto-runs `npm run build` (= `medusa build`),
  which builds both the server and the admin dashboard.
- **Start command:** `cd .medusa/server && npx medusa start`
  - ⚠️ Must run from `.medusa/server`, not the project root — otherwise the
    admin build (`public/admin/index.html`) isn't found and the server crashes.

A push to `master` triggers a redeploy. Run one-off scripts against production
from **Railway → Console**.

## Scripts

Run with `npx medusa exec ./src/scripts/<file>.ts`:

| Script | What it does |
|--------|--------------|
| `seed.ts` | Base Medusa seed (region, sales channel, stock location, demo products) |
| `seed-flowers.ts` | Seeds the 6 Petal & Vine flower products (run after `seed.ts`) |
| `enable-flower-inventory.ts` | Turns on stock tracking for flower variants and sets starting quantities (idempotent) |
| `rm-demo-all.ts` | Removes Medusa demo products **and** their orphaned inventory items |
| `rename-store.ts` | Renames the store to "Petal & Vine" |

## Admin customizations

- **Analytics page** — `src/admin/routes/analytics/page.tsx` adds an *Analytics*
  item to the sidebar, backed by the `src/api/admin/analytics/route.ts`
  endpoint. Shows revenue, order count, AOV, items sold, a 14-day revenue
  chart, top products, and a low-stock list.

## Tech

Medusa 2.16 · Node ≥ 20 · PostgreSQL · Stripe · React Admin SDK
