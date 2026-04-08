# CS2 Tactics

React Native (Expo) app with Firebase Auth/Firestore/Storage, plus a Vite web client in `apps/web`.

## Quickstart

### 1) Install dependencies

```bash
npm install
npm --prefix apps/web install --legacy-peer-deps
```

### 2) Configure environment

1. Copy root env template:
   ```bash
   cp .env.example .env
   ```
2. Fill required Firebase/OAuth values in `.env`.
3. For admin scripts, copy:
   ```bash
   cp scripts/.env.example scripts/.env
   ```
4. Set `TEXTBOOK_UID` and `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` in `scripts/.env`.

### 3) Run apps

Mobile (Expo):
```bash
npm run start
```

Web (Vite):
```bash
npm --prefix apps/web run dev
```

### 4) Run QA checks

```bash
npm run lint
npm run typecheck
npm test
npm run test:smoke
npm run build
```

## Authentication Notes

- Firebase Auth powers email/password and Google sign-in.
- Session persistence uses `getReactNativePersistence(AsyncStorage)` on native.
- Navigation is gated by auth state in `App.js`.

## Security Note

If a service-account key was ever committed, rotate/revoke it in Firebase IAM immediately and replace local keys with a new one referenced only via `scripts/.env`.
