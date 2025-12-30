# CS2 Tactics

## Authentication
- Firebase Auth powers email/password and Google sign-in using the single app initialized in `firebaseConfig.js` (no extra `initializeApp` calls).
- Sessions persist with `getReactNativePersistence(AsyncStorage)`, so users stay signed in across restarts.
- Navigation is gated by auth state in `App.js`: unauthenticated users see the auth stack, authenticated users see the main app.

## Setup
1) In Firebase Console, enable **Email/Password** and **Google** providers under Authentication.
2) Create Google OAuth client IDs (Expo Go, Android, iOS, Web) and paste them into `googleClientIds` in `screens/LoginScreen.js`.
3) For native builds, set a custom URL scheme in `app.json` (e.g., `"scheme": "cslineupsapp"`) and ensure your Android package name, iOS bundle ID, and SHA-1/256 fingerprints match the OAuth clients.
4) Run `npm start` (or `expo start`) to develop. The Profile screen includes Logout, which calls `signOut` and returns to the auth stack.

## Web (Vite + react-native-web)
- Install: `cd web && npm install --legacy-peer-deps` (uses the same React 19 line as mobile; peer warning is bypassed intentionally).
- Run dev server: `cd web && npm run dev` (routes are powered by React Router; use clean URLs like `/tactics`, `/lineups/de_mirage`, `/users/123`).
- Styling: Tailwind + NativeWind with `className` support on React Native components.
- Shared code: Screens/components/contexts are imported directly from the root (see `web/vite.config.js` aliases and `tailwind.config.js` content paths).
- Shims: Web fallbacks exist for Expo-native APIs (image picker, media library, auth session, WebBrowser, AsyncStorage). These are no-ops on web to keep iOS behavior unchanged.
