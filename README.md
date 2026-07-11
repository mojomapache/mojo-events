# Gather — events.mojomapache.com

Backend + web app for the gathering planner: shareable guest links, an
editable address with real nearby-places search, RSVP tracking with
auto-labeled free text, and a private (no-login) host dashboard.

Stack: **Next.js 14 (App Router) + Prisma + Postgres**, deployed on **Vercel**.

## How host access works

There are no accounts. Creating a gathering returns two links:

- **Guest link** — `https://events.mojomapache.com/g/<slug>` — safe to share widely.
- **Host link** — `https://events.mojomapache.com/g/<slug>/host?key=<hostKey>` — a long random secret. Anyone with this link can edit the gathering. Treat it like a password; don't post it publicly.

There's no way to recover a lost host link (by design — no accounts, no
email required to create a gathering). If you want recovery later, the
natural upgrade is emailing the host link to the creator's address, which
would need an `email` field on `Gathering` plus a mail provider.

## 1. Local setup

```bash
npm install
cp .env.example .env
# fill in DATABASE_URL at minimum (see below)
npx prisma db push   # creates tables from prisma/schema.prisma
npm run dev
```

Visit `http://localhost:3000` to create a test gathering.

## 2. Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string. |
| `NEXT_PUBLIC_BASE_URL` | Yes | Used to build the shareable links, e.g. `https://events.mojomapache.com`. Use `http://localhost:3000` locally. |
| `GOOGLE_PLACES_API_KEY` | No | Without it, the "More nearby" row (auto-fetched places) stays empty and hosts rely on manually added places only. Geocoding also needs this key — without it, the directions link falls back to a text search instead of a precise pin. |
| `ANTHROPIC_API_KEY` | No | Without it, guest free-text is labeled with a built-in EN/ES keyword matcher instead of Claude. Works fine, just less flexible with phrasing. |

### Getting a Google Places API key
1. Google Cloud Console → create/select a project.
2. Enable **"Places API (New)"** and **"Geocoding API"**.
3. Create an API key, restrict it to those two APIs (and optionally to your Vercel domain via HTTP referrer restrictions for extra safety — note server-side calls from Vercel don't have a browser referrer, so referrer restriction isn't usable here; use API restriction + IP allowlisting instead if you want to lock it down).
4. Billing must be enabled on the project (a card on file). As of March 2025 Google replaced the old flat $200/month credit with **per-SKU free monthly thresholds** instead — Geocoding gets 10,000 free calls/month, and Nearby Search with the fields this app requests (rating, review count, delivery) likely lands in the Pro or Enterprise SKU tier, which gets 5,000 or 1,000 free calls/month respectively. Given the 48h cache in `lib/places.ts`, a small personal-use deployment should stay inside the free threshold, but usage isn't unconditionally free the way it was pre-2025 — worth watching the billing dashboard for the first month.

### Getting an Anthropic API key
1. [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key.
2. This app uses `claude-haiku-4-5-20251001` at $1 / $5 per million input/output tokens — labeling a few hundred RSVPs costs fractions of a cent. New accounts get a one-time $5 free credit, but there's no ongoing free tier for API usage the way there is for Vercel/Neon.

## 3. Database

Easiest path: **Neon Postgres**, provisioned through the **Vercel Marketplace** (this replaced the old standalone "Vercel Postgres" product, which is deprecated — Neon is now the direct integration).

1. In the Vercel project → Storage tab → Create Database → choose the Neon integration.
2. Vercel automatically sets `DATABASE_URL` (and related vars) as environment variables on the project — no manual copy/paste needed.
3. After the first deploy, run `npx prisma db push` once against that database (Vercel's dashboard has a "Connect" button with the exact connection string, or run `vercel env pull` + local `npx prisma db push`).

Neon's free tier (0.5 GB storage, 100 compute-hours/month, scale-to-zero when idle) comfortably covers this app.

## 4. Deploying to Vercel + events.mojomapache.com

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. In Vercel: **New Project** → import the repo. Framework preset: Next.js (auto-detected).
3. Add the environment variables from the table above under **Settings → Environment Variables** (Production, and Preview if you want preview deploys to also work).
4. Deploy.
5. **Custom domain**: Settings → Domains → Add → `events.mojomapache.com`. Vercel will show a CNAME (usually `cname.vercel-dns.com`) — add that as a CNAME record for the `events` subdomain in mojomapache.com's DNS. Propagation is typically minutes, occasionally longer.
6. Once the domain is verified, update `NEXT_PUBLIC_BASE_URL` to `https://events.mojomapache.com` and redeploy so newly created gatherings get the right shareable links.

## What's intentionally simple (v1)

- **No auth for hosts** — a secret link, per your earlier answer. Easy to upgrade to magic-link email later without changing the data model.
- **Places cache refresh window is 48h** — matches the 24–72h window from the original plan doc (`lib/places.ts` / `CACHE_REFRESH_MS`).
- **Label set is a fixed list** in `lib/labels.ts` — editable by changing that file (the RSVP form and host dashboard both read from it), not yet host-editable in the UI.
- **AI labeling degrades gracefully** — no `ANTHROPIC_API_KEY`? It silently uses the keyword matcher instead of failing the RSVP.
- **No place photos yet** — matches where the frontend prototype left off; add an `imageUrl` field to `Place` when ready.

## Project structure

```
app/
  page.tsx                        create-gathering form
  g/[slug]/page.tsx + GuestClient.tsx     guest view
  g/[slug]/host/page.tsx + HostClient.tsx  host dashboard (needs ?key=)
  api/gatherings/route.ts                 POST create
  api/gatherings/[slug]/route.ts          GET / PATCH
  api/gatherings/[slug]/rsvp/route.ts     GET / POST
  api/gatherings/[slug]/places/route.ts   GET (curated + live nearby) / POST
  api/gatherings/[slug]/places/[placeId]/route.ts  PATCH / DELETE
lib/
  db.ts        Prisma client singleton
  auth.ts      host-key check
  slug.ts      slug + host key generation
  labels.ts    label set + keyword fallback
  ai.ts        Claude-based label classification
  places.ts    Google Places (New) geocode + nearby search
  themes.ts    theme palettes (raccoon_bbq / garden_party / fiesta_night)
  i18n.ts      EN/ES strings
components/
  ThemeStyle.tsx   applies theme CSS variables
  PlaceCard.tsx    shared place card (guest + host views)
prisma/schema.prisma
```
