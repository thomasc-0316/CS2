# Integration Test Report — Simulated E2E

**Date:** 2026-04-07
**Branch:** `codex/web-desktop-refurbish`
**Source of truth for the green flag:** `npm test` → 24 suites / 105 tests passing.

This report walks through every user-facing feature of the app and shows
what would happen end-to-end after the QA fixes. Each scenario is grounded
in (a) the deterministic mock-driven jest harness in
`__tests__/integration/featureCoverage.test.js` and (b) the per-feature unit
suites in `__tests__/`. Where the simulation mocks Firebase, that is called
out explicitly so you know what is verified vs. what would still need a
real device run.

---

## How "simulated E2E" works here

| Layer | What's covered | What's mocked |
| --- | --- | --- |
| Auth | `AuthContext` signup / login / logout / bootstrap / Google ID-token | `firebase/auth`, `firebase/firestore` |
| Profile | `getUserProfile`, `updateUserProfile` | Firestore single-doc reads |
| Follow | follow / unfollow / `isFollowing` / `getFollowing` / generation-token race guard | Firestore subcollection + AsyncStorage |
| Upvote | toggle, count math, AsyncStorage persistence, memoized identity | AsyncStorage |
| Lineups | every read path (`byMap`, `filtered`, `hot`, `byCreator`, `byId`, `recent`, paged variants) | Firestore queries |
| Cloud functions | follower-count clamp + `cleanupRooms` paging logic | Pure logic mirror of `functions/index.js` |
| Error boundary | Catches a thrown render and recovers via reset | n/a — synchronous |
| Filter panel | Visibility, chip selection, apply / reset / close callbacks | n/a |

**Smoke flows** (`__tests__/smoke/criticalFlows.smoke.test.js`) and **screen-level
tests** (`__tests__/screens/*`) provide the second layer of coverage on top
of the integration harness.

---

## Feature-by-feature walkthrough

### 1. Authentication

**Scenario.** New user lands on the app, signs up with email + password,
logs out, logs back in, then closes the app.

| Step | Expected | Verified by |
| --- | --- | --- |
| App boots → `onAuthStateChanged(null)` fires | Auth UI renders, no stale user | `AuthContext.test.js`, `featureCoverage.test.js` §1 |
| `signup(email, pw, username, displayName)` | `createUserWithEmailAndPassword` called, Firestore profile doc seeded | `AuthContext.test.js` "signs up and creates a profile document" |
| `login(email, pw)` | `signInWithEmailAndPassword` called with the right args | `AuthContext.test.js` "logs in with email and password" |
| `logout()` | `signOut` called, `currentUser` cleared synchronously | `AuthContext.test.js` "logs out and clears current user" |
| Sign-out mid-bootstrap (race) | `isMountedRef` guard skips the stale `setCurrentUser`, no React warning | New code path in `context/AuthContext.js`; behaviorally exercised by the bootstrap test |

**Result.** ✅ Passes in CI.

### 2. Profile

**Scenario.** Authenticated user opens their profile, edits username, sees
the new name everywhere immediately.

| Step | Expected | Verified by |
| --- | --- | --- |
| `getUserProfile(uid)` | Returns the Firestore doc | `featureCoverage.test.js` §2 |
| `updateUserProfile({ username })` | Writes `usernameLower`, refreshes Auth display name, refreshes local profile | `AuthContext.test.js` "updates user profile and refreshes current user" |
| Update without authenticated user | Throws `No authenticated user` | `AuthContext.test.js` "throws when updating profile without authenticated user" |

**Result.** ✅ Passes in CI.

### 3. Follow / unfollow

**Scenario.** Alice follows Bob, sees the follow button flip, then
unfollows. The cloud function (logic-mirrored) clamps the counter at zero.

| Step | Expected | Verified by |
| --- | --- | --- |
| `followUser('user-2', 'bob', null, null)` | `isFollowing` returns true for that id, `getFollowing` length grows | `featureCoverage.test.js` §3 |
| `unfollowUser('user-2', null, 'bob')` | `isFollowing` returns false, length shrinks | same |
| Logout → login as another user mid-fetch | Generation token drops the in-flight load; no stale follower set | `context/FollowContext.js` change + `FollowContext.test.js` regression test |
| `onFollowerRemoved` retry on a zero counter | Counter clamped at 0 instead of going negative | `cloudFunctions.logic.test.js` "clamps decrements at zero" |

**Result.** ✅ Passes in CI.

### 4. Upvotes

**Scenario.** User taps the heart on a lineup card; the count increments
locally and persists to AsyncStorage. Tapping again undoes it.

| Step | Expected | Verified by |
| --- | --- | --- |
| `toggleUpvote('lineup-1')` | Set updates, `getUpvoteCount` adds 1 | `featureCoverage.test.js` §4, `UpvoteContext.test.js` |
| `getUpvoteCount({ id, upvotes: 5 })` after toggle | 6 | same |
| Toggle off | Returns to base count | same |
| Empty lineup object | `getUpvoteCount({})` returns 0 (no NaN) | `UpvoteContext.test.js` |
| Identity stability for sort comparators | `getUpvoteCount` stays referentially stable across renders | `UpvoteContext.test.js` |

**Result.** ✅ Passes in CI.

### 5. Lineups (every read path)

**Scenario.** User explores lineups for a map, applies filters, switches to
the Hot tab, opens a lineup detail page, scrolls to load the next page.

| Step | Expected | Verified by |
| --- | --- | --- |
| `getLineupsByMap('dust2')` | Always limited to `DEFAULT_PAGE_SIZE` | `lineupService.test.js`, `featureCoverage.test.js` §5 |
| `getFilteredLineups('dust2', { side, site, nadeType })` | Limit + every filter passed to Firestore | `lineupService.test.js` |
| `getHotLineups()` | Always limited | `lineupService.test.js` |
| `getLineupsByCreator(uid)` | Always limited | `lineupService.test.js` |
| `getCreatorLineupsByMapAndSide` with no creatorId | Returns `[]`, no Firestore call | `lineupService.test.js` "returns [] when creatorId missing" |
| `getRecentLineups()` | Always limited | `lineupService.test.js` |
| `getLineupById(id)` (not found) | Returns `null` instead of throwing | `lineupService.test.js` |
| `getLineupsByMapPaged({ pageSize, lastDoc })` (page 2) | Calls `startAfter(cursor)` + `limit(pageSize)`; returns `{ lineups, lastDoc, hasMore }` | `lineupService.test.js`, `featureCoverage.test.js` §5b |
| `getLineupsByCreatorPaged({ pageSize })` | Same shape | same |

**Result.** ✅ Passes in CI. Regression guard against C6.

### 6. Following feed (HomeScreen N+1 fix)

**Scenario.** Alice follows 24 creators (some by uid, some by playerId).
HomeScreen fetches her feed.

| Step | Expected | Verified by |
| --- | --- | --- |
| Fetch fans out into ⌈24/10⌉ + ⌈playerCount/10⌉ Firestore queries | One `Promise.allSettled` wave instead of two sequential waves | `screens/HomeScreen.js` change |
| One of the batches throws | The remaining batches still populate the feed (allSettled) | `screens/HomeScreen.js` change |
| All batches succeed | Results deduped via `Map.set(id)`, sorted desc by `uploadedAt` | same |
| The same fetch keys hit twice in a row | `fetchDeduped` short-circuits the second call | `dataCache.test.js` |

**Result.** ✅ Behavior verified through code inspection + dataCache tests. A
true device run is needed to see the wall-clock improvement; the unit
suite cannot measure that.

### 7. Tactics room (real-time)

**Scenario.** A user opens a tactics room, joins, IGL advances phases,
user leaves the room mid-update.

| Step | Expected | Verified by |
| --- | --- | --- |
| `createRoom` | Generates 6-digit code, writes the doc with the user as IGL | `TacticsContext.test.js` |
| `joinRoom` | Transactional, dedupes self, errors on full room | `TacticsContext.test.js`, `RoomScreen.test.js` |
| Room snapshot listener | Backfills `playerIds` once per subscription, never on stale subscriptions | New `roomBackfillRef` + `cancelled` flag in `TacticsContext.js` |
| Snapshot listener cleanup mid-async | Cancellation flag drops the in-flight backfill, no setState on dead tree | New code path in `TacticsContext.js` |
| `leaveRoom` empties the room | Doc deleted via transaction | `TacticsContext.test.js` |
| `leaveRoom` reassigns IGL | Next player in array becomes IGL | `TacticsContext.test.js` |
| Room delete from non-creator | **Refused** by `firestore.rules` (`isCreator()`) | rules unit test recommended; rules updated in `firestore.rules` |

**Result.** ✅ Logic verified by existing TacticsContext + Room tests; the
rules-side guarantee for non-creator delete needs an emulator-backed rules
test (recommended next step).

### 8. Lineup posting

**Scenario.** User opens PostScreen, fills the form, previews, and posts a
lineup. They lose network mid-upload.

| Step | Expected | Verified by |
| --- | --- | --- |
| Auto-save fires after debounce | Draft persisted to AsyncStorage | `useAutoSave.test.js` |
| Auto-save debounce now configurable via options | New `options.debounceMs` arg honored | `hooks/useAutoSave.js` change |
| Draft load → form population → reset → return to home | Form clears completely, no orphaned slot state | `PostScreen.js` (existing) |
| Preview → Post (success) | Success Alert offered, draft deleted | `PreviewPostScreen.js` (existing try/catch) |
| Preview → Post (network failure) | Failure Alert with the error message | same |
| Post under edit mode | Update path used, cache busted | `postService.test.js` |

**Result.** ✅ Existing tests cover happy and error paths; the H6 audit
finding turned out to be already-handled in `PreviewPostScreen.js`.

### 9. Filter panel (HomeScreen Following tab)

**Scenario.** User taps the funnel, picks a side, type, and map, applies.

| Step | Expected | Verified by |
| --- | --- | --- |
| Panel renders all chip categories | One label per filter row | `FilterPanel.test.js` |
| Tap a chip | `setTempFilters` called with an updater that mutates the right key | `FilterPanel.test.js` |
| Apply | `onApply` callback fired, panel slides closed | `FilterPanel.test.js` |
| Reset | `onReset` callback fired | `FilterPanel.test.js` |
| Panel hidden when `visible={false}` | `toJSON()` returns `null` | `FilterPanel.test.js` |
| Memoization | `React.memo`'d wrapper prevents re-renders when props are referentially stable (HomeScreen now uses `useCallback` for the handlers) | `screens/HomeScreen.js` change |

**Result.** ✅ Passes in CI; H9 closed.

### 10. Error boundary

**Scenario.** A misbehaving context provider throws on first render.

| Step | Expected | Verified by |
| --- | --- | --- |
| Boundary catches the throw | Fallback UI rendered (`error-boundary-fallback`) | `ErrorBoundary.test.js`, `featureCoverage.test.js` §7 |
| `onError` reporter fires | Reporter receives the error + componentStack | `ErrorBoundary.test.js` |
| Custom fallback prop | Renders the user-supplied component | `ErrorBoundary.test.js` |
| Reset button | Clears the error state, children re-render | `ErrorBoundary.test.js` |
| Whole-app crash before fix | Would have white-screened — now contained | `App.js` wraps `<AuthProvider>` in `<ErrorBoundary>` |

**Result.** ✅ Passes in CI; M8 closed.

### 11. Cloud functions

**Scenario.** Same user is unfollowed twice in rapid succession; daily
cron deletes 1 200 stale rooms.

| Step | Expected | Verified by |
| --- | --- | --- |
| `onFollowerAdded` retry | Single increment via transaction (no double-count) | `functions/index.js` rewrite |
| `onFollowerRemoved` retry on a zero counter | Counter stays at 0 instead of going negative | `cloudFunctions.logic.test.js` |
| `cleanupRooms` with 1 200 stale rooms | Pages into 3 batches (≤450 each), all delete cleanly | `cloudFunctions.logic.test.js`, `featureCoverage.test.js` §6 |
| Empty cleanup run | Logs "0 rooms" and exits | `functions/index.js` rewrite |

**Result.** ✅ Logic mirror passes; deploy-side verification still requires
the firebase-functions emulator (recommended).

### 12. Migration scripts

**Scenario.** Operator runs `node scripts/migrateLineups.js` against the
prod project — by mistake, twice.

| Step | Expected |
| --- | --- |
| Missing `FIREBASE_*` env var | Hard exit with a list of which vars are missing |
| Run with `--dry-run` | Logs every doc that would be written, never opens a Firestore session |
| Run without `--dry-run` | Interactive `yes/no` confirmation citing the project ID and lineup count |
| Operator types `no` | Exits cleanly without writing |
| `serviceAccountKey.json` not in `.gitignore` | Both `uploadLineupsWithImages.js` and `setLineupId.js` refuse to start |

**Result.** ✅ All four guards landed in `scripts/migrateLineups.js`,
`scripts/uploadLineupsWithImages.js`, `scripts/setLineupId.js`. `.gitignore`
already covers `scripts/serviceAccountKey.json` and `scripts/.env`.

### 13. Security rules

**Scenario.** A signed-in user tries to delete somebody else's room and
read another user's lineup draft via the Storage API directly.

| Step | Expected |
| --- | --- |
| Non-creator `delete /rooms/{id}` | Denied — `isCreator()` check |
| Owner `delete /rooms/{id}` | Allowed |
| Any auth user `read /lineups/{otherUid}/private/{file}` | Denied — owner-only path |
| Any auth user `read /lineups/{otherUid}/{file}` | Allowed (intentional public read; lineup images are inherently shared content) |
| Any user `read /users/{otherUid}/private/{doc}` | Denied — owner-only subcollection |
| Self-promotion to admin via `update /users/{me}` | Denied — `role` immutable in update rule |

**Result.** ✅ Rules updated; emulator-backed `@firebase/rules-unit-testing`
suite is the recommended follow-up to lock these in CI.

---

## Test execution summary (this run)

```
$ npm test
Test Suites: 24 passed, 24 total
Tests:       105 passed, 105 total
Snapshots:   0 total
Time:        2.271 s

$ npm run typecheck
(clean)

$ npm run lint
0 errors, 48 pre-existing warnings (all @typescript-eslint/no-explicit-any
in the apps/web shims; not introduced by this audit)

$ npm run build
✓ built in 1.94s
dist/index.html                   0.45 kB
dist/assets/index-Bisz_OrO.css    0.59 kB
dist/assets/index-BiFkd7qJ.js   969.28 kB │ gzip: 303.54 kB
```

## Coverage delta (audit + this pass)

| Suite | Before | After |
| --- | --- | --- |
| Test files | 19 | 24 |
| Tests | 62 | 105 |
| New tests added | — | `lineupService`, `ErrorBoundary`, `FilterPanel`, `UpvoteContext`, `cloudFunctions.logic`, `featureCoverage` integration |

## Known follow-ups (intentionally out of scope this round)

1. **Rules emulator suite** — `@firebase/rules-unit-testing` to validate the
   rules updates against a real emulator. Recommended next sprint.
2. **Web bundle code-splitting** — `dist/assets/index-BiFkd7qJ.js` is still
   969 kB (M4); needs `React.lazy` + `manualChunks` configuration.
3. **DataCache wiring on the cold-read screens** — `LineupDetail`,
   `UserProfile`, `Search*`, `TacticDetail` still bypass the SWR cache (M6).
4. **AsyncStorage → Firestore mirror** for upvotes / favorites / comments
   so users don't lose state on reinstall (M7).
5. **`perfMonitor` external sink** — currently logs locally; needs Firebase
   Performance or Sentry pipe (L9).

## What changed in this commit graph

- `firestore.rules`, `storage.rules` — least-privilege pass + private subpaths
- `firebaseConfig.js` — env-only config, no committed defaults
- `context/AuthContext.js` — `isMountedRef` guard around async bootstrap
- `context/TacticsContext.js` — cancellable snapshot listener with backfill ref
- `context/FollowContext.js` — generation-token race guard + dedup
- `context/UpvoteContext.js` — memoized callbacks + safer `getUpvoteCount`
- `services/lineupService.js` — limit() everywhere + cursor-paginated variants
- `screens/HomeScreen.js` — N+1 collapsed into one `Promise.allSettled` wave + extracted `<FilterPanel />`
- `screens/LineupDetailScreen.js` — `screenAliveRef` for cross-effect mount tracking
- `components/ErrorBoundary.js`, `components/FilterPanel.js` — new
- `App.js` — top-level `<ErrorBoundary>`
- `functions/index.js` — transactional follower counts + paged room cleanup
- `scripts/*.js` — `--dry-run` + interactive confirmation + gitignore preflight
- `firestore.indexes.json` — composite indexes for the lineup query patterns
- `package.json` — removed `firebase-admin` from runtime deps
- `apps/web/tsconfig.app.json` — explicit `strictNullChecks` etc.
- `hooks/useAutoSave.js` — debounce now configurable via options
- Deleted: `screens/MapSelectionScreen.js`, `screens/SideSelectionScreen.js`,
  `screens/SiteSelectionScreen.js`, `__tests__/screens/MapSelectionScreen.test.js`,
  `temp.txt`
