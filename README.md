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
