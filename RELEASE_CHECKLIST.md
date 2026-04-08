# Release Checklist

Date: 2026-03-06
Repo: `/Users/ivan/CS2`

## 1. Preflight
- [ ] Working tree reviewed (`git status`) and intended changes only.
- [ ] Branch rebased/merged with latest `main`.
- [ ] Node/npm versions match CI/runtime expectations.

## 2. Environment Verification
- [ ] Root `.env` created from `.env.example` and all required vars set:
  - [ ] `EXPO_PUBLIC_FIREBASE_API_KEY`
  - [ ] `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - [ ] `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
  - [ ] `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - [ ] `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `EXPO_PUBLIC_FIREBASE_APP_ID`
  - [ ] `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
  - [ ] `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
  - [ ] `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- [ ] Web env (`VITE_FIREBASE_*`) set for deployment target.
- [ ] `scripts/.env` created from `scripts/.env.example` (if admin scripts used):
  - [ ] `TEXTBOOK_UID`
  - [ ] `FIREBASE_SERVICE_ACCOUNT_KEY_PATH`
- [ ] No secrets committed (`git ls-files` + secret scan).
- [ ] If any service-account key was previously exposed, key rotation completed.

## 3. Install + Baseline Run
- [ ] `npm ci`
- [ ] `npm --prefix apps/web ci --legacy-peer-deps`
- [ ] Mobile baseline startup validated (`npm run start`)
- [ ] Web baseline startup validated (`npm --prefix apps/web run dev`)

## 4. Quality Gates (Must Pass)
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test -- --runInBand`
- [ ] `npm run test:smoke`
- [ ] `npm run build`

## 5. Security / Permissions
- [ ] Firestore rules deployed and verified against expected access model.
- [ ] Storage rules deployed and verified.
- [ ] Ownership checks validated for lineup/tactic create/update/delete.
- [ ] `npm audit --audit-level=high` executed in network-enabled environment and high/critical findings triaged/fixed.
- [ ] Legacy user profile docs reviewed for stale `email` fields and scrubbed if present.

## 6. Mobile Release Readiness (Expo/EAS)
- [ ] `app.json` identifiers correct:
  - [ ] iOS bundle id
  - [ ] Android package id
- [ ] Version/build numbers bumped for this release.
- [ ] Required permissions reviewed (no unnecessary permissions added).
- [ ] Icons/splash assets validated.
- [ ] Signing credentials / EAS secrets available and correct.

## 7. CI Verification
- [ ] PR CI passed (`lint`, `typecheck`, `test`, `test:smoke`).
- [ ] Main branch build verification passed.
- [ ] Coverage artifact uploaded.
- [ ] Web build artifact uploaded (`apps/web/dist`).

## 8. Smoke Test Scenarios (Manual)
- [ ] Auth: login (email), session restore, logout.
- [ ] Auth: Google sign-in flow on target platform(s).
- [ ] Core path: app start -> landing/home -> lineup browse.
- [ ] Core write path: create lineup as authenticated user.
- [ ] Ownership guard: non-owner cannot edit/delete another user lineup.
- [ ] Room flow: create/join room and verify sync.

## 9. Rollback Plan
- [ ] Tag the release commit before deploy.
- [ ] Keep previous production artifact available for fast rollback.
- [ ] If incident occurs:
  - [ ] Revert deploy to previous stable artifact.
  - [ ] Revert release commit(s) on `main`.
  - [ ] Validate smoke suite and critical auth flow on rollback build.
  - [ ] Post incident summary with root cause and corrective actions.
