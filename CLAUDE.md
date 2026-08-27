# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

La Voce — a health/condition tracking app for voice professionals (classical singers, announcers, voice actors, pop/musical performers). Next.js 14 App Router, plain JavaScript (no TypeScript), Supabase for auth + database, Stripe wired but dormant, an Anthropic-backed advice endpoint, a LINE reminder bot, a PWA manifest/service worker, and a Capacitor shell for the iOS build. UI text is Japanese-first and translated into 9 languages.

## Commands

```bash
npm install
npm run dev            # http://localhost:3000
npm run build
npm run lint           # next lint (.eslintrc.json: next/core-web-vitals + no-undef)

node components/tests/entry-roundtrip.test.js          # 単体で実行できる
for f in components/tests/*.test.js; do node "$f"; done  # 全部
```

`components/tests/*.test.js` are standalone Node scripts with their own assertion helpers — there is no test runner dependency. They fall into two kinds:

- **Reads `components/VocalTracker.jsx` at runtime** (`entry-roundtrip`, `entry-defaults`, `points-rule`, `profession-visibility`, `other-profession`) — extracts named functions/consts by brace-matching and `new Function`s them. Consequence: if `entryToRow` / `rowToEntry` / the migration helpers start calling a *new* top-level helper, **add that helper's name to the `loadFunctions([...])` list at the bottom of the test** or it fails with `ReferenceError`. That exact omission broke `entry-roundtrip` once (`deriveLegacyVoiceFieldsFromEntries`); it is not a regression in the mapper.
- **Imports a `lib/` module directly**, usually via `data:text/javascript;base64` dynamic import so the source is read fresh (`display-gates`, `share-scope`, `field-groups`, `feature-flags`, `export-data`, `delete-account`, `cycle-periods`).

Several tests are **drift detectors, not unit tests**: they read the SQL migrations and `VocalTracker.jsx` as text and assert structural facts — that `get_student_entries` never touches `cycle_periods`, that `cycle_periods` has exactly one RLS policy and no `SECURITY DEFINER`, that no phase vocabulary (卵形期/黄体期/排卵) appears in the code, that no day counts are stored, that all three cron routes authenticate before their first query.

**Any forbidden-word check must run on comment-stripped source**, via `components/tests/_source.js`:

```js
const { stripComments, readCode, readRaw } = require("./_source");
```

Specs are quoted in comments and rules are written as "never write X" — so an unstripped scan fails on its own documentation. This trap was hit twice (the cycle phase vocabulary, then 「データ不足」 in the boost card) before the helper existed, and eight tests each carried their own slightly different copy of the stripping. Use `readCode`/`stripComments` for forbidden-word checks and `readRaw` when asserting structure or ordering, where comments still count as position.

`npm run lint` is worth running: `no-undef` was added after a runtime-only crash (`optionalFields is not defined`) that both `next build` and the tests passed, because JSX referenced a state variable whose `useState` line had never been written.

No `.env.local.example` is checked in despite the README referencing it. Env vars actually read by the code: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `REQUIRE_SUBSCRIPTION`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`, `FEEDBACK_FROM_EMAIL`.

## Stale duplicate files — check before editing

Repo history is a series of "Add files via upload" commits from the GitHub web UI, which left unimported copies of several files. Only the paths reachable via `@/` imports are live:

| Live | Stale copy, not imported anywhere |
|---|---|
| `components/VocalTracker.jsx` | `VocalTracker.jsx` (repo root) |
| `app/api/feedback/route.js` | `feedback_route.js` (repo root) |
| `components/HealthInfo.jsx` | `lib/HealthInfo.jsx` |
| `lib/healthInfoContent.js` | `lib/lib/healthInfoContent.js` |

Editing a root-level copy has no effect on the app. Several files also open with a comment like "このファイルは app/… として配置してください" — a leftover of that upload workflow, not an instruction to move anything.

Code comments cite spec documents (`lavoce-記録項目の再設計v2.md`, `lavoce-指標設計図.md`, `lavoce-作業計画v2-構造変更の分離.md`, …). Those live in `docs/` at the repo root (tracked as of commit `1cbb9ea`; the directory was previously named `docs:` with a trailing colon and sat outside git).

**`docs/lavoce-02-統合実行ルート-v4.md` is the single source of truth for priority and work order.** Read it, and especially its §4 (conflict resolution) and §7 (replacement table), before starting work: about 36 spec documents exist and several are deliberately superseded, so implementing from an older one will "fix" correct code back into a bug. Progress is reported one line per numbered item in Japanese, and work stops at every gate listed in its §9 until the owner confirms.

## Architecture

### Auth and the three Supabase clients

- `middleware.js` runs `supabase.auth.getUser()` on nearly every request purely to refresh the session cookie.
- `lib/supabase/client.js` — browser (`createBrowserClient`), anon key, RLS enforced.
- `lib/supabase/server.js` — Server Components / Route Handlers, cookie-backed, anon key, RLS enforced. Its `set`/`remove` swallow errors on purpose (Server Components can't write cookies; middleware handles it).
- `lib/supabase/admin.js` — service-role key, **bypasses RLS**. Only for Route Handlers / webhooks / cron (`api/stripe/webhook`, `api/feedback`, `api/line-webhook`, `api/cron/line-reminder`, `app/admin/page.js`). Never import it into a client component.

`app/admin/page.js` gates on the caller's own `profiles.is_admin` (flipped by hand in the Supabase Table Editor — there is deliberately no in-app promotion UI) before using the admin client to list all users.

### Access gating

`app/dashboard/layout.js` redirects anonymous users to `/login`, and *only if* `REQUIRE_SUBSCRIPTION === "true"` requires a `trialing`/`active` row in `subscriptions`. The app currently runs free; all Stripe plumbing (`/billing`, `api/stripe/*`, the `subscriptions` table) stays in place so the flag alone re-enables paid mode.

`lib/isNativeApp.js` detects the Capacitor WebView by the `LaVoceNativeApp` User-Agent token and is used by `app/page.js`, `app/signup/page.js` and `app/billing/page.js` to hide signup and payment entry points inside the iOS app (App Store Guideline 3.1.3(b) reader-style exception). **The token must stay in sync with `appendUserAgent` in `capacitor.config.json`.**

### VocalTracker — the whole app

`components/VocalTracker.jsx` (~13.4k lines) is a single client component rendered by `app/dashboard/page.js` with `userId`/`userEmail` props. It holds all in-app state (no store, no data-fetching library); everything above the default export at line ~3544 is top-level pure helpers — option lists, statistics (ridge regression, Pearson/Spearman, Benjamini–Hochberg FDR, Hedges' g), date/score utilities, and the row↔entry mappers. Sub-views live in `components/CharacterHome.jsx` and `components/HealthInfo.jsx`. Top-level tabs: `home / today / analysis / garden / notes / more`.

### The entry data model (the thing to be careful with)

`public.entries` holds **one row per `(user_id, date)`**; every write is `upsert(..., { onConflict: "user_id,date" })`. `rowToEntry` / `entryToRow` are the only boundary between DB columns (snake_case) and in-app entry objects (camelCase).

The schema has been through two structural migrations that were done *without dropping the old columns*:

- On read, `migrateLegacyToActivities(row)` synthesizes `activities[]` + `recovery` from the legacy `activity_type` / `activity_duration` / `repertoire` scalars, and `migrateLegacyToVoiceEntries(row)` synthesizes `voiceEntries[]` from `throat_condition` / `voice_quality` / `resonance_score` / `voice_checkins` / `wake_note` / etc.
- On write, `entryToRow` goes the other direction: it *derives* the legacy scalar columns back out of the new structures (`derivePrimaryActivityLegacy`, `deriveLegacyVoiceFieldsFromEntries`, joined repertoire names, the first 本番 block's `performanceQuality`).

The reason is that dozens of analysis features still read the legacy columns. So: **adding or changing a recorded field means touching `rowToEntry`, `entryToRow`, and the roundtrip test together**, and if the field has a legacy counterpart, keeping the derivation consistent in both directions.

`runQueryWithAuthRetry(supabase, queryFn, label)` wraps reads that can hit an expired JWT: on `PGRST303`/401/"jwt" errors it refreshes the session and retries exactly once. Pass a *function* that rebuilds the query, not a query object.

Writes to `profiles` use `.update(...).eq("id", userId)`, never `upsert` — the RLS policy set grants UPDATE but not INSERT, and upsert was returning 403. The row already exists (created by the `handle_new_user` trigger).

### One decision, one module (the pattern to follow)

The recurring defect in this repo is **the same decision living in two places**, where one copy is later changed and the other is not. A display gate that also existed inline; a permission check that gated rendering while the query still fetched every column; a profession label computed by a ternary chain next to a list of the same professions. Each fix consolidated the decision into a single `lib/` module with a test that fails when a caller drifts away from it.

| Module | The single decision it owns |
|---|---|
| `lib/displayGates.js` | Whether a statistic may be stated at all (n, effect size, FDR) — §6 of the route doc |
| `lib/analysisCardVisibility.js` | Which analysis cards appear |
| `lib/shareScope.js` | Which of the 58 `entries` columns map to which of the 9 share scopes — and the **11 columns never shared with a teacher** (`medication_tags, cycle_start, location, temperature, humidity, weather, environment_tags, ambient_noise_db, noisy_environment, flight_hours, jetlag_hours`) |
| `lib/fieldGroups.js` | Which fields belong to かんたん記録 vs しっかり記録, and to which profession |
| `lib/featureFlags.js` | What is hidden from non-admins (teacher/classroom/lesson mode) |
| `lib/accountDeletion.js` | The list of user-owned tables, the 30-day grace period, and the purge order |
| `lib/exportData.js` | The list of tables in a data export |
| `lib/cyclePeriods.js` | Every day count derived from cycle start dates |

`shareScope` / `accountDeletion` / `exportData` overlap deliberately and must be kept **deliberately inconsistent**: a column can be excluded from teacher sharing while still being required in the owner's own export and deletion. "We don't share it" and "the owner can't retrieve it" are different statements.

### RLS is row-level — it cannot hide a column

`canViewHealth()` and friends gate *rendering*; a `select("*")` behind them still ships every column to the browser, where the network tab shows it. Where a teacher may see some columns of a student's row but not others, the filtering has to happen server-side: `supabase/migration_teacher_student_entries_rpc.sql` defines `get_student_entries(p_student_id, p_limit)` as `SECURITY DEFINER returning setof jsonb`, building each object from `shareScope`'s allowed columns only. It authorizes **solely** via `teacher_student_links` — never via org roles, which would let an org owner read students they don't teach.

The cycle tables go one step further: `cycle_periods` has exactly one RLS policy (`auth.uid() = user_id`), no teacher policy and no `SECURITY DEFINER` function at all, because the goal is that no code path to another user's rows exists to be misconfigured later.

### Cron routes must fail closed

`app/api/cron/*` authenticate with `Bearer ${CRON_SECRET}`. If the env var is unset, `authHeader !== "Bearer undefined"` is false for a caller who literally sends `Bearer undefined` — so an unset secret made the route world-callable. Both routes now return **503 when `CRON_SECRET` is missing**, and only then compare.

### Database schema is not fully checked in

`supabase/schema.sql` defines only `profiles`, `subscriptions`, `entries` plus the `handle_new_user` trigger and RLS policies. The application code queries roughly twenty tables — `questionnaire_responses`, `repertoire_tessitura`, `role_master`, `project_master`, `character_inventory`, `chapter_state`, `article_progress`, `article_notes`, `feedback`, `events`, `lessons`, `entry_comments`, `organizations`, `memberships`, `enrollments`, `assignments`, `org_invitations`, `teacher_invitations`, `teacher_student_links`, `teacher_notes` — and `profiles` has ~35 columns beyond the ones in the file (`display_name`, `vocal_profession`, `character_equipped`, `garden_theme`, `folded_groups`, `practice_reviews`, `line_user_id`, `day_record_boundary_hour`, `teacher_beta_access`, …). Those were applied by hand in the Supabase SQL Editor; Migrations are written out as files for the owner to paste into the SQL Editor: `components/migration_activity_detail.sql`, and in `supabase/` — `migration_record_mode.sql`, `migration_profile_health_fields.sql`, `migration_teacher_student_entries_rpc.sql`, `migration_account_soft_delete.sql`, `migration_cycle_periods.sql`. Each is written to be safe to run repeatedly (`if not exists`, `on conflict do nothing`, policy creation wrapped in a `do $$` existence check). **Do not treat `schema.sql` as the source of truth** — read the live schema in Supabase, and when adding a table/column write the SQL out for the user to run rather than assuming a migration pipeline exists.

### i18n

`lib/translations.js` is a flat `TRANSLATIONS[key][langCode]` map over 9 languages (`ja en zh it de fr es ko ru`); `createTranslator(language)` returns `t(key)` which falls back to `ja` then the key itself. In-app language is persisted to `localStorage["la-voce-language"]`. `app/page.js` (landing) and the four `/*-theory` pages each carry their **own** local `LANGS`/`T` tables and read a `?lang=` query param instead — they are server-rendered and don't share the translator. The `/legal` pages are Japanese-only. Adding user-facing copy means adding all 9 languages in the right table. Data modules carry their own `i18n:` sub-objects (`lib/foodPresets.js`, `lib/healthInfoContent.js`).

### Styling

Colors come from `lib/tokens.js` (`C` palette, `LEVEL_COLORS`, `LEVEL_DYNAMICS`) applied as **inline styles**; Tailwind is used only for layout/spacing/typography utilities, and `tailwind.config.js` extends nothing. Fonts are loaded via `next/font/google` in `app/layout.js` and exposed as `.ff-display` / `.ff-mono` classes in `app/globals.css`, which also contains iOS-specific rules (safe-area padding, ≥16px inputs to stop focus zoom).

### Content and gamification modules

`lib/foodPresets.js` (nutrition lookup, ~2000 lines), `lib/learnContent.js` (articles for the 学ぶ screen — adding an article means appending to the array, no code changes), `lib/healthInfoContent.js` (health explainer copy), `lib/character.js` (the sheep-raising loop: points are awarded for *recording*, never for good numbers; `computeEntryPoints`, `SHOP_ITEMS`, `PLACEMENT_LIMITS`, `computeBalance`).

### Integrations

- `app/api/advice/route.js` — summarizes the last two weeks of entries into a text digest, sends it through `lib/anthropic.js` (raw `fetch` to the Messages API, model `claude-sonnet-5`) under a system prompt that forbids diagnosis and medication advice. The UI is gated off by the `AI_ADVICE_ENABLED = false` constant near the top of `VocalTracker.jsx`.
- `app/api/line-webhook/route.js` — HMAC-SHA256 signature verification against `LINE_CHANNEL_SECRET`, links a LINE user ID to a profile via a code the user generates in-app.
- `app/api/cron/line-reminder/route.js` — invoked by the Vercel cron in `vercel.json` (22:00 UTC daily), authenticated by `Bearer ${CRON_SECRET}`; skips users who already recorded today (dates computed in JST).
- `app/api/stripe/webhook/route.js` — reads the raw body via `request.text()` for signature verification and maps `subscription.metadata.supabase_user_id` back to the `subscriptions` row.
- `app/api/feedback/route.js` — stores to the `feedback` table first, then best-effort emails via Resend; email failure is not an error.
