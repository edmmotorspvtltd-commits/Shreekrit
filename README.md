# Shreekrit

An online gallery and shop for hand-painted Mithila (Madhubani) folk art from Bihar, India. Visitors browse paintings and artist profiles, view artworks in detail with zoom, request custom commissions, apply to join as an artist, and place orders in several currencies.

Live site: https://www.shreekrit.in

## What's in it

- **Gallery and artist pages.** Filter by style, theme, artist and price. Every painting and artist has its own URL (`/painting/<id>/<slug>`, `/artist/<id>/<slug>`) with its own page title, description and canonical tag. Opening a painting or artist from the site shows it as a modal; opening the URL directly or refreshing loads the same view.
- **Checkout.** Cart, shipping form, multi-currency prices (INR, USD, EUR, GBP, JPY) with live exchange rates, framing options and print editions.
- **Orders.** Confirmation emails, a "My Orders" page for signed-in customers, and guest order tracking.
- **Forms.** Custom commission requests, artist applications and a newsletter signup, all sent by email.
- **Languages.** English, Hindi and Maithili.
- **Sitemap.** `/sitemap.xml` is generated from the database and lists every painting and artist.

## Stack

| Part | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Motion |
| API | Vercel Edge Functions in `api/` |
| Catalogue and orders database | Neon (Postgres) |
| Customer accounts and guest order lookup | Supabase |
| Email | Resend |
| Payments | Razorpay (see "Payments status" below) |
| Hosting | Vercel |

There is no router library. Routing lives in `src/utils/router.ts` and `src/utils/routes.ts`.

## Run it locally

You need Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

`npm run dev` serves only the frontend. The `/api/*` endpoints are not available there, so the site falls back to the built-in paintings and artists in `src/data/` and the forms, checkout and sitemap will not work. To run the API routes as well, use the Vercel CLI:

```bash
npx vercel dev
```

Other scripts:

| Command | What it does |
|---|---|
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Type check (`tsc --noEmit`) |
| `npm run db:migrate` | Create the Neon tables from `db/schema.sql` |
| `npm run db:seed` | Load the paintings and artists from `src/data/` into Neon |
| `npm run clean` | Delete `dist/` |

## Environment variables

Copy `.env.example` to `.env.local` for local work, and set the same names in Vercel under Settings, Environment Variables.

| Variable | Used for | Where it runs |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection string | API, `db:migrate`, `db:seed` |
| `RESEND_API_KEY` | Sending emails | API |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay (test keys start with `rzp_test_`) | API |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Sign-in and guest order tracking in the browser | Frontend, read at build time |
| `SUPABASE_SERVICE_ROLE_KEY` | Creating pre-verified accounts in `api/signup.ts` | API only. Never prefix it with `VITE_`. |
| `SUPABASE_URL` | Optional. Server-side Supabase URL; falls back to `VITE_SUPABASE_URL` | API |
| `DISABLE_HMR` | Set to `true` to turn off hot reload and file watching in `npm run dev` | Dev server |

`VITE_` variables are baked into the frontend at build time, so changing one in Vercel needs a redeploy.

## Database setup

1. Create a Neon project and put its connection string in `DATABASE_URL`.
2. Run `npm run db:migrate` once to create the tables (artists, paintings, orders, order items, artist applications).
3. Run `npm run db:seed` to load the paintings and artists. It uses upsert, so running it again updates rows by id and does not delete anything.
4. For accounts and guest order tracking, create a Supabase project and run `supabase/schema.sql` in its SQL editor.

The gallery reads paintings and artists from Neon through `/api/paintings` and `/api/artists`. The files in `src/data/` are used as the first render and as a fallback if the API is unreachable. The browser caches the last response in localStorage; bump `CACHE_SCHEMA_VERSION` in `src/utils/dataCache.ts` whenever the `Painting` or `Artist` shape changes so visitors' caches reset.

## Adding a painting

1. Put the images in `public/paintings/`.
2. Add the artist to `src/data/artists.ts` (if new), with a photo in `public/artists/`.
3. Add the painting to `src/data/paintings.ts`: id, titles, price, size, style, theme, story and image paths. Set `isPlaceholder: true` only for stand-in content.
4. Run `npm run db:seed`, or insert the row into Neon directly.
5. Redeploy so the image files go live.

The sitemap and the page titles pick the new painting up automatically.

## Pouches

Hand-painted fabric pouches are a second category, sold by quantity (a design may have several pieces). They live in their own `pouches` table, served by `/api/pouches`, with pages at `/pouches` and `/pouch/:id`.

1. Apply `db/migrations/002_pouches.sql` to a Neon branch first and check it, then to production. It is idempotent, and its header has a rollback note.
2. `NEON_BRANCH_CONFIRMED=yes npm run db:seed:pouches` (branch only) loads the demo pouches from `src/data/pouches.ts`. Demo rows have `is_placeholder = true`: the API hides them and `/api/orders/create` refuses to sell them when `VERCEL_ENV` is `production`. The Pouches nav link only shows once the API returns at least one pouch.
3. Add real pouches with photos in `public/pouches/` (3 to 4 images each, referenced as `/pouches/<file>.jpg`).
4. `NEON_BRANCH_CONFIRMED=yes DATABASE_URL=<branch url> npm run test:stock` runs the stock-safety tests (last-piece race, restore on failed checkout, duplicate cart lines, quantity limits). It writes to the database, so never point it at production.

Pouch-only orders pay a flat shipping rate, `POUCH_SHIPPING_COST_INR` in `src/data/paintings.ts` (placeholder, to be confirmed with a courier quote). Orders containing a painting use the painting rule.

## Deploying

The project deploys to Vercel as a Vite app.

1. Import the GitHub repository into Vercel.
2. Add every variable from the table above to the Production environment, and to Preview if you want preview deployments to work fully. Variables are set per environment, and a variable that is only ticked for Production will be missing on previews.
3. Push to `main` to deploy to production. Every other branch gets a preview URL.

`vercel.json` does three things: sends every path that isn't an asset or `/api` to `index.html` (so deep links like `/painting/...` work), rewrites `/sitemap.xml` to the `api/sitemap` function, and sets the `X-Robots-Tag: noindex` header (see below).

## Maintenance mode

`middleware.ts` can put the whole site, including `/api/*`, behind a "back soon" page. While it is on, every request gets an HTTP 503 with `Retry-After: 86400` and `Cache-Control: no-store`, so search engines treat it as temporary.

**Turn it on**

1. In Vercel, open the project, then Settings, then Environment Variables.
2. Add `MAINTENANCE_MODE` with the value `true` (exactly that) for the environment you want to close: Production, Preview, or both.
3. Optional: add `MAINTENANCE_BYPASS_KEY` with a long random string so you can still see the real site.
4. Redeploy. Environment variable changes only apply to new deployments (Deployments, the three dots on the latest one, Redeploy).

**Turn it off**

Delete `MAINTENANCE_MODE` (or set it to anything other than `true`) and redeploy. Requests then pass through unchanged.

**View the real site while it is on**

Open `https://<your-domain>/?bypass=<MAINTENANCE_BYPASS_KEY>` once. That sets a 30-day `preview_access` cookie and redirects to the same page without the key in the URL. Use that browser as normal; everyone else still sees the maintenance page. Clearing cookies ends your access.

**Test it on a preview first**

Scope the variables to the Preview environment (or to the branch you are testing) so production is untouched, redeploy that branch, then check three things: the preview URL shows the maintenance page, `/api/paintings` returns 503, and the `?bypass=` link lets you in. Remove the variables when you are done.

## Before launch

Search engines are currently blocked in three places, and all three must be removed to allow indexing:

- the `<meta name="robots" content="noindex, nofollow">` tag in `index.html`
- `Disallow: /` in `public/robots.txt`
- the `X-Robots-Tag: noindex` header in `vercel.json`

Also review:

- **Abandoned-order stock (blocker).** Stock reserved by `/api/orders/create` (originals and pouches) is only released when that request itself fails. Once real Razorpay payments are on, a buyer who starts checkout and never pays keeps the item reserved indefinitely. Add expiry for `pending` orders (release stock after N minutes, and on payment failure) before launch. There is a TODO in `api/orders/create.ts`. The same gap covers crashes between taking stock and saving the order: the Neon HTTP driver has no transaction here, so expiry/reconciliation must also release stock for orders that never got saved.
- **Payments status.** `api/orders/create.ts` forces test mode: orders are saved and confirmation emails are sent, but no payment is taken. The Razorpay checkout in `src/utils/razorpay.ts` and the `/api/orders/verify` endpoint exist but are not connected to the checkout form yet. Orders placed today are not paid orders.
- **Placeholder content.** Items flagged `isPlaceholder` in `src/data/` (demo paintings, artists and blog posts) still need replacing or removing, and the Blog link in the navbar is hidden until `hasRealBlogContent` in `src/components/Navbar.tsx` is set to `true`.
- **Canonical host.** Canonical tags and the sitemap use `https://www.shreekrit.in` (`SITE_ORIGIN` in `src/utils/routes.ts`). The domain should redirect to the same host.

## Project layout

```
api/            Edge Functions: paintings, artists, orders, commissions, artist
                applications, newsletter, signup, fx rates, sitemap
api/_lib/       Database client and email templates
db/             schema.sql, migrate.ts, seed.ts (Neon)
supabase/       schema.sql for accounts and guest order lookup
public/         Static files, painting and artist images
src/components/ UI components
src/data/       Built-in paintings, artists and blog posts
src/i18n/       English, Hindi and Maithili text
src/utils/      Routing, SEO tags, currency, cache helpers
```
