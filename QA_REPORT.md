# QA Report

Date: 2026-03-06
Repository: `/Users/ivan/CS2`

## Repo Map

### Stack and architecture
- Frameworks:
  - Mobile: React Native + Expo (`expo` 54) with React Navigation.
  - Web: Vite + React + React Router in `apps/web`.
- Language:
  - Mobile/shared logic: JavaScript.
  - Web app: TypeScript.
- Backend:
  - Firebase Auth + Firestore + Storage.
  - Firebase Admin scripts in `scripts/`.
  - Firebase Cloud Functions in `functions/index.js` (follower count sync logic).
- State management:
  - React Context providers (`context/*`), including auth, tactics, profile, follow, favorites, drafts, upvotes.
- Testing:
  - Jest + `@testing-library/react-native`.
  - Smoke tests: `__tests__/smoke/criticalFlows.smoke.test.js`.
  - Perf baseline/optimization tests: `__tests__/perf/*`.

### Key folders
- `App.js`, `index.js`: mobile app composition and Expo root registration.
- `navigation/`: mobile auth/app navigation stacks.
- `screens/`: mobile UI flows.
- `context/`: auth/session and app state providers.
- `services/`: Firestore/Storage data access (`lineupService`, `tacticService`, `postService`, `firestoreClient`).
- `apps/web/src/`: web app shell/pages/shims.
- `scripts/`: admin data migration/upload scripts.
- `functions/`: Firebase Cloud Functions backend hooks.
- `__tests__/`: unit/integration/smoke/perf tests.
- `.github/workflows/ci.yml`: CI gates.

### Entry points
- Mobile runtime:
  - `index.js` -> `App.js`.
- Web runtime:
  - `apps/web/src/main.tsx` -> `apps/web/src/App.tsx`.

### Environment variable references
- Mobile Firebase config: `firebaseConfig.js`
  - `EXPO_PUBLIC_FIREBASE_*`.
- Mobile Google sign-in: `screens/LoginScreen.js`
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`.
- Web Firebase config: `apps/web/src/shims/firebaseConfig.web.ts`
  - `VITE_FIREBASE_*`.
- Admin scripts: `scripts/*.js`
  - `TEXTBOOK_UID`, `FIREBASE_SERVICE_ACCOUNT_KEY_PATH`.
- Perf/cache runtime flags:
  - `services/perfMonitor.js` (`NODE_ENV`), `services/dataCache.js` (`DISABLE_PERF_CACHE`).

### Auth + DB read/write map
- Auth flows:
  - `context/AuthContext.js`: signup/login/logout, Google OAuth, auth-state restore (`onAuthStateChanged`).
- Firestore writes:
  - `services/postService.js`: add/update/delete lineups with ownership checks.
  - `context/AuthContext.js` and `context/ProfileContext.js`: user profile creates/updates.
  - `context/TacticsContext.js`: room state create/update/delete.
  - `context/FollowContext.js`: follower records create/delete.
- Firestore reads:
  - `services/lineupService.js`, `services/tacticService.js`, and multiple `screens/*` query lineups/users/tactics/rooms.
- Security rules:
  - `firestore.rules`, `storage.rules`.

## How To Run

### Install
```bash
npm install
npm --prefix apps/web install --legacy-peer-deps
```

### Env setup
```bash
cp .env.example .env
cp scripts/.env.example scripts/.env
```
Fill required values in `.env` and `scripts/.env`.

### Start apps
```bash
npm run start
npm --prefix apps/web run dev
```

### QA gates
```bash
npm run lint
npm run typecheck
npm test
npm run test:smoke
npm run build
```

## Checks Executed (Commands + Results)

| Command | Result | Notes |
|---|---|---|
| `npm run start -- --non-interactive` | Partial pass | Expo starts; flag warning (`--non-interactive` unsupported, use `CI=1`). |
| `npm --prefix apps/web run dev -- --host 127.0.0.1 --port 4173` | Pass after fix | Initially failed due `firebase/auth/react-native` prebundle path; fixed in Vite config; now starts cleanly. |
| `npm run lint` | Pass | 0 errors, 48 warnings (mostly `no-explicit-any`, hook deps in web TS files). |
| `npm run typecheck` | Pass | `tsc -b --pretty false` successful. |
| `npm test -- --runInBand` | Pass | 19 suites, 62 tests passed. |
| `npm run test:smoke` | Pass | 1 suite, 3 critical smoke tests passed. |
| `npm run build` | Pass | Vite production build successful; large chunk warning only. |
| `npm run format` | Fail | Pre-existing formatting drift across many files; config exists but not yet fully normalized repo-wide. |
| `npm audit --audit-level=high` | Blocked | Network restriction (`ENOTFOUND registry.npmjs.org`) in this environment. |

## Bugs Found + Fixes

1. Web dev server startup crash (critical)
- Symptom: Vite dev crashed while pre-bundling shared deps (`Missing "./auth/react-native" specifier in "firebase" package`).
- Root cause: shared mobile `firebaseConfig.js` was being traversed during dependency optimization.
- Fix: updated `apps/web/vite.config.ts` optimize-deps strategy (`noDiscovery` + stable include list) while keeping firebaseConfig web shim alias.
- Outcome: `npm --prefix apps/web run dev` now starts cleanly.

2. Public profile PII persistence risk
- Symptom: user profile docs were storing `email` while `users/*` docs are readable by signed-in users.
- Fixes:
  - Removed `email` persistence on profile creation paths in `context/AuthContext.js`.
  - Removed `email` field from legacy profile bootstrap in `context/ProfileContext.js`.
  - Replaced follower fallback username from raw email to email local-part in `context/FollowContext.js`.
- Outcome: new/updated profile writes no longer persist raw email by default.

3. Prior pass stabilization and release-gate fixes already in branch
- Added smoke suite for auth/ownership regression checks.
- Hardened Firestore ownership rules for `lineups` and `tactics` create/update paths.
- Removed committed service-account JSON key from repo and moved admin script auth to env-based key path.
- Added CI quality/build workflow and root scripts for lint/typecheck/test/build/smoke.

## Security Findings

### What was checked
- Firestore/Storage rule review (`firestore.rules`, `storage.rules`).
- Secret scan patterns (private keys/tokens/service-account references) across tracked files.
- Auth/write ownership checks in app service layer (`services/postService.js`).
- Dependency audit attempt (`npm audit`).

### Fixes made
- Service-account key file removed from repo and ignored (`scripts/serviceAccountKey.json` path).
- Admin scripts now require local env-configured key path and UID.
- Firestore rules enforce creator ownership on create/update for lineups/tactics.
- Profile data writes no longer persist raw email fields for new docs.

### Residual risks / follow-up
- `npm audit` could not run due network restriction in this sandbox; rerun in CI or a network-enabled dev shell.
- Existing historical user docs may still contain `email`; run one-time admin migration to remove legacy email fields from `users` collection.
- Web lint warnings are non-blocking but should be reduced before a strict-lint rollout.

## Test Summary + Coverage Notes

- Full suite:
  - `npm test -- --runInBand` -> 19 passed suites, 62 passed tests.
- Smoke suite (CI-failing regression gate):
  - `npm run test:smoke` -> 3/3 tests pass:
    - unauthenticated create blocked
    - non-owner update blocked
    - non-owner delete blocked
- Coverage:
  - CI stores `coverage/` as artifact (`.github/workflows/ci.yml`).
  - No minimum coverage threshold is currently enforced in config.

## Performance Notes

- Perf harness tests are present and passing:
  - `__tests__/perf/perfBaselineMetrics.test.js`
  - `__tests__/perf/perfOptimizationMetrics.test.js`
- Current metrics in test logs show stable baseline and cache wins on repeat navigation scenarios.
- Clear wins already applied in branch:
  - Firestore call instrumentation and lightweight cache/perf monitor utilities.
  - Follow data refresh moved to one-shot fetch path instead of broad live listeners.

## Build Readiness Summary

Status: **Ready with conditions**

Passes:
- `npm run lint` (no errors)
- `npm run typecheck`
- `npm test`
- `npm run test:smoke`
- `npm run build`

Conditions before production cut:
1. Run `npm audit --audit-level=high` in a network-enabled environment and remediate high/critical findings.
2. Decide formatting policy rollout (`npm run format` currently fails due legacy drift).
3. Execute one-time cleanup migration for any legacy user docs containing `email`.
