# Vincent Siauw Portfolio

Implementation of [PRD](./PRD.md), [DESIGN](./DESIGN.md), and [TRD](./TRD.md): a personal portfolio with a built-in CMS.

**Stack:** Next.js 16 (App Router) · Payload CMS 3.89 · PostgreSQL · private S3-compatible storage (MinIO locally). The public site and the admin run in one app. Pages render on the server per request with no shared content cache (TRD §5).

## Local setup

Requirements: Node ≥ 20.9, pnpm, Docker.

```bash
pnpm install
cp .env.example .env            # then set PAYLOAD_SECRET (openssl rand -hex 32)
docker-compose -p vincent-portfolio up -d   # Postgres :5433, MinIO :9100 (console :9101), private buckets
pnpm seed                       # CV content, all drafts (see "Seed content")
ADMIN_BOOTSTRAP_EMAIL=… ADMIN_BOOTSTRAP_PASSWORD=… pnpm create-admin   # one-time, refuses if a user exists
pnpm dev                        # http://localhost:3000 and /admin
```

MinIO images are pulled from `quay.io/minio/*` because the Docker Hub images are no longer published.

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev, production build, production server |
| `pnpm lint` / `pnpm typecheck` | ESLint (Next flat config) and `tsc --noEmit` |
| `pnpm test` | Unit + integration tests against the `portfolio_test` database and `portfolio-media-test` bucket |
| `pnpm seed` | Seeds CV content as drafts. Skips if content exists |
| `pnpm create-admin` | One-time admin bootstrap from `ADMIN_BOOTSTRAP_*` |
| `pnpm generate:types` / `pnpm generate:importmap` | Regenerate Payload types and admin import map after schema changes |
| `pnpm migrate:create <name>` / `pnpm migrate` | Versioned migrations (production does not use schema push) |

A local production build needs `ALLOW_LOCALHOST_ORIGIN=true`, because `SERVER_URL` must not be localhost in production.

## Structure

```text
src/
  app/(public)/          homepage, /projects, /projects/[slug], /about, preview/projects/[id], 404, error, OG images
  app/(payload)/         Payload admin + REST (POST wrapped so version restores are drafts)
  app/api/preview/       authenticated preview entry and exit
  app/media/[id]/        access-checked media delivery
  app/healthz/           app + database health check
  app/sitemap.ts, robots.ts
  collections/           Projects, Experiences, Skills, Education, Media, Users, Redirects
  globals/               Profile, Site Settings
  fields/, access/, hooks/
  components/            public UI (Dropdown, ThemeSelect, sections, case study)
  lib/content/           published-only readers and public DTOs
  lib/auth/              per-request preview authorization
  lib/                   validation, env, storage, preview/request policy, rate limit
  proxy.ts               security headers, no-store, noindex for private routes, rate limits
  styles/globals.css     DESIGN tokens and layout
migrations/              initial schema migration
scripts/                 seed, create-admin
tests/                   unit + integration (TRD §9)
```

## How the TRD rules are enforced

- **Published-only reading.** Editorial collections and globals use `read: publishedOrAdmin`. Public readers call the Local API with `overrideAccess: false`, `depth: 0`, and resolve relations explicitly, so draft skills and media never leak through population. REST behaves the same, including `?draft=true`.
- **Drafts.** Saving a draft never touches the published row, so the public keeps seeing the published version. Publishing validates required fields, `contentReady`, month ranges, slugs, links, and media readiness.
- **Restore (AC-12).** REST restores are forced to `draft=true` (`src/lib/payload-rest.ts`), which covers the admin Restore button too. Local API restores are refused because Payload 3.89 does not forward `draft` there.
- **Preview.** `/api/preview` accepts only allowlisted targets, requires an admin session, then enables Draft Mode. Every preview request re-checks the session, so logout ends preview. Responses are `private, no-store` + `noindex`.
- **Media.** The bucket is private and anonymous `/api/media/*` is denied. `/media/[id]` serves a file only when it is public, marked ready, and referenced by a published snapshot. Otherwise only an admin session gets it. Uploads accept JPEG/PNG/WebP ≤ 8 MB and PDF ≤ 10 MB, with a magic-byte check, double-extension rejection, and opaque object names.
- **Redirects (AC-10).** When a published slug changes, a redirect from the old path to the project is written in the same transaction. It always resolves to the project's current slug, so there are no chains or loops. Historical slugs cannot be taken by another project.
- **Featured projects.** At most three can be published as featured. Without any featured projects, the homepage shows the first three by `sortOrder`, then ID.

## Seed content

`pnpm seed` loads facts from `CV_VincentSiauw_August_26.pdf` as **drafts**. Projects are always drafts with `contentReady = false`, and their internal notes list what is still missing. CV metrics that the PRD marks as ambiguous (Tokopedia 15% / 94%, Offerland figures for case studies) stay in internal fields. The phone number is not stored.

For local review only, non-project content can be published:

```bash
SEED_PUBLISH=profile,settings,experiences,skills,education pnpm seed
```

Values the CV does not state are flagged in `internalSource` for owner confirmation: Jobkred and Tokopedia employment type, and the Offerland freelance role title.

## Decisions and deviations to review

- **Custom dropdown.** The Theme control uses `components/Dropdown.tsx` (WAI-ARIA listbox: button + listbox, arrows/Home/End, Enter/Space, Escape, Tab, typeahead, close on outside click, 44px options) instead of a native `<select>`. It is reusable for other selectors.
- **No route `loading.tsx`.** A route-level loading boundary starts streaming before `notFound()` or `permanentRedirect()` runs, which turns 404s into HTTP 200 and 308 redirects into client redirects. Correct status codes won over the "Loading…" message.
- **Rate limiting** (login, password reset, first-register, uploads) is in memory per instance. Multi-instance hosting needs a shared store.
- **Global restore.** Collection and global REST restores are both forced to draft. The Local API guard applies to collections only, because Payload globals have no `beforeOperation` hook.
- **Email.** Without `SMTP_HOST`, password-reset emails are logged to the console. Production needs SMTP settings.
- **Not done here (launch items, TRD §10):** hosting vendor and domain, production secrets, backups and restore drill, owner review of seed content, a public CV file, and Lighthouse on a representative production host.

## Verification

Results from the local run on 15 September 2026 are recorded below. Re-run after changes.

| Check | Result |
|---|---|
| `pnpm lint`, `pnpm typecheck`, `pnpm build` | Clean; all public routes dynamic (`ƒ`), proxy active |
| `pnpm test` (unit + integration) | 48/48 passed. Covers TRD §9.1–9.7: anonymous access through every REST variant, draft vs published snapshot, unpublish, preview auth, slugs and redirects, publish validation, restore-as-draft, uploads, media delivery, CV |
| Migration on an empty database | `payload migrate` applied `20260915_055858_initial` (44 tables) |
| HTTP smoke test on `next start` | Status codes (200/404/401/403/400), security and `no-store` headers, `noindex` on admin/preview, sitemap/robots, no draft or internal fields over REST |
| Browser checks (Chromium, Playwright) | 280/280 passed: `/`, `/about`, `/projects`, 404 at 320/390/768/1280px in light and dark (no overflow, one h1, controls ≥44px, no console errors); keyboard skip link and focus ring; theme persistence and System mode; custom dropdown (mouse, keyboard, typeahead, outside click, 320px viewport); copy email success and fallback; reduced motion; full draft → preview → publish → draft edit → republish → slug redirect (308) → unpublish → logout ends preview → delete; admin UI dashboard and editor tabs |
| Contrast (DESIGN tokens) | Light: text 14.0, muted 5.8, accent 7.0, control border 3.8. Dark: text 15.7, muted 8.7, accent 10.6, control border 5.3 |
| Initial public JS | ≈140 KB gzip module scripts per route (target ≤150 KB), plus a 38.5 KB `nomodule` polyfill that modern browsers skip |
| Lighthouse 12, mobile, simulated throttling, local `next start` | `/` perf 96–97 over 3 runs (a cold first run scored 87), `/about` 96, `/projects` 97. Accessibility 100, SEO 100, best practices 96 on all three. LCP 2.5–2.7 s locally; a field LCP ≤2.5 s still needs measuring on real hosting |

Not tested: screen reader, real SMTP password reset, and backup/restore.
