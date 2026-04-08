# Full Repo QA Audit

**Date:** 2026-04-07
**Branch:** `codex/web-desktop-refurbish`
**Scope:** Entire `/Users/ivan/CS2` workspace — Expo/React Native app, `apps/web` (Vite/React), `functions/` (Cloud Functions), `scripts/`, Firebase rules, CI, and test infrastructure.
**Method:** Three parallel codebase scans (RN screens/contexts/services; web + rules + functions + scripts; tests + CI + perf infra). Critical findings spot-verified by reading the cited files.

This report **complements** the existing `QA_REPORT.md`, `PERF_PLAN.md`, `PERF_BASELINE.md`, and `RELEASE_CHECKLIST.md` — items they already cover are explicitly excluded in §7.

---

## 1. Executive Summary

The codebase has solid foundations: a clean services layer (`firestoreClient`, `dataCache`, `perfMonitor`), an in-progress perf instrumentation effort, and a basic CI pipeline. The biggest exposure is in the **security surface** (Firestore/Storage rules and committed defaults) and in **data hygiene** (unbounded queries, N+1 follow-feed reads, listener leaks under churn). Test coverage of screens/components is also low (~33% of screens have any test).

### Top 5 Quick Wins
1. Tighten `users` and `lineups` storage read rules — both currently leak across users (C1, C2).
2. Add `limit()` + cursor pagination to `lineupService` queries — they currently scan unbounded collections (C6).
3. Add `isMounted` guards to `AuthContext` and `LineupDetailScreen` async paths to stop "setState after unmount" leaks (C4, H7).
4. Extract the duplicated filter panel JSX in `HomeScreen.js` into a memoized `<FilterPanel />` component (H9).
5. Add `--dry-run` + confirmation prompts to the migration scripts so they can't silently rewrite production data (H4).

---

## 2. Critical Findings (must-fix before next release)

| # | Area | File:Line | Issue | Suggested Fix |
|---|---|---|---|---|
| **C1** | Security | `firestore.rules:10` | `users` collection read is `if isSignedIn()` — any authenticated user can read **every** profile document, including any private fields (email, settings, internal IDs). Verified. | Split public vs private fields into a `users/{uid}/private/*` subcollection, or restrict at field level via a separate `publicProfiles` collection. |
| **C2** | Security | `storage.rules:13` | `lineups/{userId}/{fileName}` read is `if request.auth != null` — any authenticated user can read every other user's lineup images, including draft uploads. Verified. | `allow read: if request.auth != null && (request.auth.uid == userId || resource.metadata.isPublic == 'true')`, or mirror Firestore's `isPublic` check via custom claims. |
| **C3** | Security | `firebaseConfig.js:16-22`, `scripts/migrateLineups.js:8-16` | Firebase API key + project IDs hardcoded as fallbacks. Verified. While Firebase web keys are not strictly secret, committing the production project ID + key as a default makes rotation impossible without code changes and removes the env-based safety net. | Remove fallbacks; require `EXPO_PUBLIC_FIREBASE_*` env vars and fail loudly if missing. Document rotation in `RELEASE_CHECKLIST.md`. |
| **C4** | Memory leak / race | `context/AuthContext.js:243-278` | `onAuthStateChanged` callback awaits `getUserProfile` / `createUserProfileDocument` then calls `setCurrentUser`. If the user signs out (or component unmounts) during the await, setState fires on a torn-down tree. | Capture an `isMounted` ref in the effect; guard every setState before applying it. |
| **C5** | Memory leak | `context/TacticsContext.js:83-111` | The room `onSnapshot` listener performs an `updateDoc()` for player-id backfill from inside the snapshot handler, with no error propagation and no cancellation if the room changes mid-write. Cleanup races the in-flight write. | Make `unsubscribe` synchronous in the cleanup; wrap the backfill in a try/catch that surfaces to `setError`; cancel via a token if `roomCode` changes. |
| **C6** | Cost / perf | `services/lineupService.js:15-35,73-94,97-116` | Several `getDocs` queries (`getLineupsByMap`, `getRecentLineups`, `getLineupsByCreator`) lack `limit()`. As collections grow, every call becomes a full scan billed per document. | Add `.limit(50)` defaults plus cursor pagination via `startAfter(lastDoc)`. Expose `pageSize` arg. |
| **C7** | Perf / cost | `screens/HomeScreen.js:115-171` | The follow-feed builds `where('creatorId','in',batch)` and `where('creatorPlayerId','in',batch)` queries in 10-id chunks → 2× ceil(N/10) queries per render. With `orderBy('uploadedAt')` it also forces composite indexes. | Denormalize: store a single `creatorRef` per lineup and query it once. Or precompute a "feed" subcollection populated by a Cloud Function on follow/post. |

---

## 3. High-Severity Findings

| # | Area | File:Line | Issue | Suggested Fix |
|---|---|---|---|---|
| H1 | Security | `firestore.rules:84-85` | `rooms` allows `delete: if isMember()` — any participant can delete the room out from under others. | `allow delete: if isSignedIn() && request.auth.uid == resource.data.iglId` (creator field is `iglId` in this codebase — verified line 82). |
| H2 | Cloud Function | `functions/index.js:62-86` | `onFollowerRemoved` blindly applies `FieldValue.increment(-1)`. On retry of a failed delete event, the count goes negative; if the user doc was already deleted, the merge re-creates a partial doc. | Wrap in `db.runTransaction(...)`; only decrement if `count > 0`; bail out if user doc no longer exists. |
| H3 | Cloud Function | `functions/index.js:42-59` | `cleanupRooms` collects all stale rooms into a single `db.batch()`. Firestore batches are capped at 500 writes; >500 stale rooms will throw and silently lose the rest of the cleanup. | Page the snapshot in chunks of ≤450, commit per-chunk, log totals. |
| H4 | Data integrity | `scripts/migrateLineups.js:238`, `scripts/uploadLineupsWithImages.js:303` | Migration scripts commit directly to prod with no `--dry-run`, no confirmation prompt, and no row-count summary. One accidental `node scripts/migrateLineups.js` rewrites production. | Add `inquirer`/`readline` confirm + a `--dry-run` flag that logs intended writes without committing. |
| H5 | Service-account hygiene | `scripts/uploadLineupsWithImages.js:7-17`, `scripts/setLineupId.js:5-14` | Scripts `require('./serviceAccountKey.json')` with no preflight that the file is gitignored. One `git add scripts/` mistake commits a privileged key. | Add a startup check that errors if `serviceAccountKey.json` is not in `.gitignore`; document in `scripts/README.md`. |
| H6 | Error handling | `screens/PostScreen.js` | Async upload + publish flow lacks user-visible error UI; failures are console-logged and the user sees a stuck spinner. | Wrap publish in try/catch; show `Alert.alert` or inline error; reset loading state in `finally`. |
| H7 | Race condition | `screens/LineupDetailScreen.js:69-93` | `setLineup` can fire after navigation pop because `isMounted` is checked only in the `finally` block, not before each setState. | Move guards before every setState. |
| H8 | Race condition | `context/FollowContext.js:91-95` | `refreshFollowers` doesn't track in-flight requests across login/logout transitions; stale follower lists from a previous user can land in the next user's session. | Add `isMounted` ref + a per-call generation token; ignore writes from stale generations. |
| H9 | Re-render storm | `screens/HomeScreen.js:391-692` | The filter panel JSX is duplicated verbatim ~140 lines × 2 (lines 391-530 and 553-692). Every state change re-renders both copies. | Extract `<FilterPanel />` and render once. Memoize with `React.memo`. |
| H10 | Test coverage | `screens/*.js` | 14/21 screens have **zero tests** — including Home, Post, Profile, LineupGrid, LineupDetail, EditProfile, UserProfile, TacticDetail, Search, PlayerSearch. Critical user flows are unverified. | Add integration tests covering: data fetch happy path, error path, unmount-during-fetch, focus lifecycle. Start with Home → LineupGrid → LineupDetail. |
| H11 | Test coverage | `components/*` | 9 components untested, including memoized `LineupCard`, `TacticCard`. Memo equality is silently fragile. | Snapshot/shallow render tests + explicit memo equality assertions to catch prop-shape regressions. |

---

## 4. Medium-Severity Findings

| # | Area | File:Line | Issue | Suggested Fix |
|---|---|---|---|---|
| M1 | Indexes | `firestore.indexes.json` | Indexes exist for `tactics` but none for `lineups (creatorId, isPublic, uploadedAt)` — used by HomeScreen. Firestore auto-creates on first query but with cold-start latency. | Define explicitly and deploy. |
| M2 | Storage | `storage.rules:18-24` | `mapBackground` and `mapIcons` are world-readable (`if true`) with no versioned paths; assets are immutable-cached forever. Updating an asset becomes very awkward. | Restrict to `request.auth != null` (defense-in-depth), and use versioned paths like `mapIcons/v2/{name}`. |
| M3 | Bundle | `package.json:41` | `firebase-admin@13.6.0` is in root deps. It will be required by Metro/Expo at bundle time even if never imported, fattening the RN bundle and risking accidental imports. | Move to `functions/package.json` only. |
| M4 | Web bundle | `apps/web/vite.config.ts` | The web build emits a single ~960 KB bundle; no `React.lazy` on routes, no `manualChunks`. | Split by route with `lazy()` + `<Suspense>`; configure `build.rollupOptions.output.manualChunks` for vendor (firebase, react, lodash). |
| M5 | ~~Rules bug~~ | `firestore.rules:65-78` | Initially flagged as a missing null check. **Verified false positive** — `isJoining()` correctly guards via `!hasPlayerIds(resource.data)` on line 70. Leaving here as a note. | No action. |
| M6 | Cache coverage | `services/dataCache.js` | Used by only 5/21 screens. `LineupDetailScreen`, `UserProfileScreen`, `SearchLineupsScreen`, `PlayerSearchScreen`, `TacticDetailScreen` and others all bypass it and re-fetch on every focus. | Wire SWR-style cached reads through these screens; the helper already handles TTL + dedup. |
| M7 | Data persistence | `context/UpvoteContext.js`, `context/CommentsContext.js`, `context/FavoritesContext.js` | Upvotes, favorites, and comments live **only** in `AsyncStorage`. Reinstall = data loss. New device = data loss. Multi-device users see divergent state. | Mirror to `users/{uid}/upvotes` etc. subcollections; treat AsyncStorage as a write-through cache. |
| M8 | Reliability | `App.js` | No top-level error boundary. Any throw inside a context provider or screen crashes the whole app to a white screen. | Add an `<ErrorBoundary>` wrapper with a recovery UI. |
| M9 | Re-render | `context/TacticsContext.js:40-656` | God-context: ~600 lines, 15+ actions, room/user/loading/error all in one provider. Any state change re-renders every consumer. | Split into `RoomStateContext`, `RoomActionsContext`, `RoomUserContext`, or migrate to `useReducer` with selector hooks. |
| M10 | Image perf | `screens/LineupDetailScreen.js:355,418,441` | Full-resolution remote images loaded without explicit dimensions, no `expo-image` cache hint. | Switch to `expo-image` with `cachePolicy="memory-disk"` and explicit `width`/`height`. Ideally resize on upload via a Cloud Function. |
| M11 | CI/CD | `.github/workflows/ci.yml` | No coverage threshold gate. No perf regression gate (despite `__tests__/perf/perfOptimizationMetrics.test.js` existing). Build job runs only on main, not on PRs. | Add `--coverageThreshold` to jest invocation; gate the perf test in CI; replicate the build job for PRs. |
| M12 | TS strictness | `apps/web/tsconfig.app.json` | Has `strict: true` but `strictNullChecks` not explicit. Implicit through `strict`, but several flags can be unintentionally relaxed by future edits. | Make `strictNullChecks`, `noImplicitAny`, `noUncheckedIndexedAccess` explicit. |
| M13 | ESLint | `apps/web/eslint.config.js` | No `eslint-plugin-import` rules: no `import/no-cycle`, no `import/no-unresolved`, no DOM safety rules. | Enable `eslint-plugin-import` + `import/no-cycle: 'error'`. |
| M14 | Dedup | `context/FollowContext.js:26-49,67-88` | Two parallel loaders: `loadFollowData` reads AsyncStorage, `refreshFollowers` reads Firestore. Both run in `useEffect` (line 95) without deduplication. | Treat Firestore as the source of truth; AsyncStorage = optional cache. Single `loadAndRefresh()` path. |

---

## 5. Low-Severity / Polish

- **L1** `hooks/useAutoSave.js:101,148` — debounce hardcoded to 2000 ms; not configurable.
- **L2** Mixed `keyExtractor={item => item.id.toString()}` vs direct id across FlatLists. Pick one.
- **L3** `getUpvoteCount` is called inside the sort comparator on every Home render and is not memoized.
- **L4** `react-native-image-viewing` in deps but no imports — verify and prune.
- **L5** No security headers in `apps/web/vite.config.ts` (CSP/HSTS) for the dev server.
- **L6** `functions/package.json` deploy script skips lint/test.
- **L7** `apps/web/vite.config.ts` redirects to `apps/web/src/shims/firebaseConfig.web.ts` — file exists per `git status` but build will silently fail if it ever goes missing; add an explicit assertion in CI.
- **L8** `scripts/migrateLineups.js` references `TEXTBOOK_UID` but never validates it exists in Firebase Auth.
- **L9** `services/perfMonitor.js` collects rich metrics but never exports them — no Firebase Performance, no Sentry. Instrumentation without observability.

---

## 6. Architecture & Layout Advice

### Monorepo / packaging
- Root `package.json` mixes Expo + Vite + Functions deps. Consider npm/yarn workspaces with a `packages/shared` for code that RN and web both consume. Today, sharing happens via Vite path aliases — works, but brittle and hides cycles.
- Pull `firebase-admin` out of root entirely.
- Replace the single `firebaseConfig.js` (with hardcoded fallbacks) with `dev`/`prod` configs injected by CI; never commit defaults.

### Context / state
- **AuthContext** is doing too much: session + profile creation + ID generation + profile mutation. Split into a thin `AuthContext` (session only) and a `UserService`.
- **TacticsContext** is a god-provider — split room state, room actions, and per-user state. Will materially reduce re-renders without refactoring callers.
- The three offline contexts (`Upvote`, `Favorites`, `Comments`) each reimplement AsyncStorage CRUD. Extract a single `LocalSyncStore` utility, and back it with Firestore so users don't lose state on reinstall (M7).

### Data layer
- Add a small `pagination` helper (cursor + `lastDoc` tracking). Today nothing paginates.
- Add a `queryBatcher` so screens stop hand-rolling 10-id chunked `in` queries. The Home N+1 (C7) is the canonical instance.
- Treat `dataCache` as the **default** read path. Currently 16/21 screens bypass it (M6).

### Screens / navigation
- 21 screens. Three look deprecated: `MapSelectionScreen`, `SideSelectionScreen`, `SiteSelectionScreen`. Confirm and delete or document.
- The hot path is **Home → LineupGrid → LineupDetail**. Prioritize this path for: cache wiring (M6), image optimization (M10), render-count alerts, and integration tests (H10).
- The web app has no responsive layout tests. If web is shipping, add a small Playwright suite for breakpoints.

### Security
- Firestore rules need a least-privilege pass on `users`, `lineups`, and `rooms`.
- Server-trusted invariants (vote counts, follower counts) must be enforced via Cloud Function transactions, not client-side increments.
- There are **zero** rules tests. Add a `firebase-rules` test suite using `@firebase/rules-unit-testing`. This is the highest-leverage testing investment available.

### Observability
- `perfMonitor` is wired but its metrics never leave the device. Pipe `getPerfMetrics()` to Firebase Performance Monitoring (or Sentry's perf product) so the existing instrumentation actually catches regressions.
- Add a `__DEV__`-only render-count overlay so excessive re-renders show up during local development.

---

## 7. Out of Scope (Already Covered Elsewhere)

These items are intentionally **not** re-discussed here — see existing docs:
- Lint / typecheck / smoke test suite scaffolding → `QA_REPORT.md`
- Removal of follower live listener and gating of room listener → `PERF_PLAN.md`
- `LineupCard` / `TacticCard` memoization → `PERF_PLAN.md`
- Existing email-PII and service-account hardening → `QA_REPORT.md`
- Baseline screen-by-screen perf metrics → `PERF_BASELINE.md`
- Release sign-off checklist → `RELEASE_CHECKLIST.md`

---

## 8. Verification

Before acting on any individual finding, confirm it still applies on the working branch (`codex/web-desktop-refurbish` has uncommitted changes that may have already addressed some of these):

1. **Spot-check the citation**: open the cited `file:line` and confirm the issue is still present.
2. **Security findings**: exercise via the Firebase emulator with `@firebase/rules-unit-testing`. There are currently no rules tests, so this also bootstraps that suite.
3. **Perf findings**: capture a `perfMonitor.getPerfMetrics()` snapshot for Home → LineupGrid → LineupDetail before and after each change.
4. **Regression sanity**: `npm test` and `npm test -- __tests__/perf/perfOptimizationMetrics.test.js` should both still pass — this report changes no code.

---

*Generated 2026-04-07. This is a static audit; treat findings as starting points for investigation, not prescriptions. Severity reflects impact × likelihood, not effort.*
