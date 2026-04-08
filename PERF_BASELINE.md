# Performance Baseline

## Scope
- App: React Native + Firebase (Firestore/Auth/Storage)
- Date: 2026-03-06
- Phase: 0-1 (loading algorithm mapping + instrumentation only, no optimizations yet)

## Loading Algorithm (Current)

### Fetch & Subscription Points
| Source | Start condition | Stop condition | Used by |
|---|---|---|---|
| `onAuthStateChanged(auth, ...)` in `AuthContext` | `AuthProvider` mount | `AuthProvider` unmount | App auth gate (`App.js`) |
| `onSnapshot(users/{uid}/followers)` in `FollowContext` | Any authenticated user, provider mount/user change | Provider cleanup or user change | Home, Profile, UserProfile follow/follower surfaces |
| `onSnapshot(rooms/{roomCode})` in `TacticsContext` | `roomCode` becomes non-empty (create/join room) | `roomCode` reset/leave room or provider cleanup | Room flow (`RoomScreen`) |
| Firestore `getDocs/getDoc` one-shot reads | Screen mount/tab change/focus/refresh actions | Promise resolution | Home/Hot/Profile/LineupGrid/Room/TacticsHub/UserProfile/LineupDetail/Search/PlayerSearch/etc |
| Firebase Storage + Firestore writes | User action (post/edit profile/create tactic) | Promise resolution | PreviewPost/EditProfile/CreateTacticFromFavorites |

### Screen Dependency Table
| Screen | Required data | Optional data | Fetch type (one-shot vs live) | Current cache? | Suspected issue |
|---|---|---|---|---|---|
| `LoginScreen` | none for initial render | Google auth response | one-shot auth flow | Firebase auth persistence | none on mount |
| `SignupScreen` | none for initial render | none | one-shot auth+profile write on submit | none | none on mount |
| `HomeScreen` | local maps + follow list from context | following feed lineups (when tab active) | one-shot `getDocs` batches | follow/follower cached in AsyncStorage; feed not cached | repeated refetch when toggling back to Following |
| `HotScreen` | public lineups list | none | one-shot `getDocs` | no | full list fetch each mount/refresh |
| `LineupGridScreen` | `route.params.map` + map lineups | none | one-shot `getDocs` | no | reloads every mount/back navigation |
| `LineupDetailScreen` | lineup doc by ID | creator profile + follow state | one-shot `getDoc/getDocs` | no | multiple creator fallback queries |
| `UserProfileScreen` | user profile by `userId` | fallback lineup query by `creatorPlayerId` | one-shot `getDocs` (+ focus-triggered reload) | no | duplicate fetch on mount + focus |
| `PlayerSearchScreen` | user-entered query | username prefix results | one-shot `getDocs` (2 queries per search) | in-memory search cache (`Map`) | no TTL/invalidation for cache |
| `ProfileScreen` | auth/profile context + selected tab data | favorites/upvote aggregates | one-shot `getDocs` by tab | drafts/favorites/upvotes/follow cached in AsyncStorage | tab switches refetch without TTL |
| `SearchLineupsScreen` | favorite IDs | none | one-shot batched `getDocs` | favorite IDs cached in context | refetch on each open/refresh |
| `PostScreen` | local form state + media permission/photos | loaded draft/edit lineup params | local permission + media library reads | auto-save drafts in AsyncStorage | large photo grid render cost on first open |
| `PreviewPostScreen` | `route.params.postData` | none | no mount fetch; write on submit | none | upload/write can block perceived responsiveness |
| `EditProfileScreen` | profile context | profile image upload URL | one-shot upload/write on submit | profile context persisted via Firestore+local context | image upload done inline on save |
| `RoomScreen` | room state from `TacticsContext` listener | map lineups + map tactics | live room listener + one-shot lineups/tactics | no explicit cache | lineups/tactics refetch when map/side changes |
| `TacticsMapSelectScreen` | static map list | none | none | N/A | none |
| `TacticsHubScreen` | selected map + side + tactics lists | saved tactics from library | one-shot `getFilteredLineups` + tactic fetches | saved tactics in AsyncStorage; remote not cached | repeated reads on map/side/tab churn |
| `TacticDetailScreen` | tactic route payload | creator profile, tactic lineups | one-shot reads | no | lineups fetched again if not passed in |
| `CreateTacticFromFavoritesScreen` | `mapId/side` route params + favorites/currentUser | own lineups for map/side | one-shot reads + create write | favorites/saved tactics cached in context | multiple serial reads per open |
| `MapSelectionScreen` (legacy) | public lineups list | following filter subset | one-shot `getDocs` | no | full list fetch on mount |
| `SideSelectionScreen` | static values | none | none | N/A | none |
| `SiteSelectionScreen` | static values | none | none | N/A | none |

## Hot Paths
1. App launch -> auth resolved -> `HomeScreen`.
2. Home -> `LineupGridScreen` (core lineup browsing path).
3. Room tab -> create/join room -> map/tactic vote flow (`RoomScreen`).
4. List-heavy screens: `Home` (following), `Hot`, `LineupGrid`, `Profile`, `UserProfile`, `TacticsHub`.

## Phase 1 Instrumentation Added
- Dev/test perf monitor: [`services/perfMonitor.js`](/Users/ivan/CS2/services/perfMonitor.js)
  - screen timing markers (`mount -> first content`, `mount -> data ready`)
  - render counters by component/screen
  - DB call counters + listener active/max counters
- Firestore wrapper with counters: [`services/firestoreClient.js`](/Users/ivan/CS2/services/firestoreClient.js)
  - wrapped `getDoc`, `getDocs`, `addDoc`, `setDoc`, `updateDoc`, `deleteDoc`, `runTransaction`, `onSnapshot`
- Screen perf hooks:
  - [`hooks/useScreenPerf.js`](/Users/ivan/CS2/hooks/useScreenPerf.js)
  - [`hooks/useRenderCount.js`](/Users/ivan/CS2/hooks/useRenderCount.js)
- Instrumented key surfaces:
  - `HomeScreen`, `LineupGridScreen`, `RoomScreen`, `TacticsHubScreen`, `ProfileScreen`, `HotScreen`
  - `LineupCard`, `TacticCard`
- Baseline test harness:
  - [`__tests__/perf/perfBaselineMetrics.test.js`](/Users/ivan/CS2/__tests__/perf/perfBaselineMetrics.test.js)

## Before Metrics (Baseline)
Method: `npm test -- __tests__/perf/perfBaselineMetrics.test.js` (mocked data, deterministic baseline harness).

| Transition | Mount -> first content | Mount -> data ready | Render count (screen) | DB calls/session | Max active listeners |
|---|---:|---:|---:|---:|---:|
| App launch -> Home | 0.00 ms | 0.00 ms | 1 | 0 | 0 |
| Home -> LineupGrid | 0.00 ms | 4.00 ms | 2 | 1 | 0 |
| Lobby/join flow -> Room | 0.00 ms | 0.00 ms | 4 | 1 | 0 |

Notes:
- These are baseline harness metrics (Jest + mocked network), intended for **before/after relative comparison** in CI, not absolute device timings.
- Device-level profiling (Flipper/React Profiler/Firebase Perf) should be used as a second validation pass on real hardware.

## After Metrics (Post-Optimization)
Method:
- Core transitions: `npm test -- __tests__/perf/perfBaselineMetrics.test.js`
- Cache effectiveness (repeat navigation): `npm test -- __tests__/perf/perfOptimizationMetrics.test.js`

### Core transitions (same harness)
| Transition | Mount -> first content | Mount -> data ready | Render count (screen) | DB calls/session | Max active listeners |
|---|---:|---:|---:|---:|---:|
| App launch -> Home | 0.00 ms | 0.00 ms | 1 | 0 | 0 |
| Home -> LineupGrid | 0.00 ms | 4.00 ms | 2 | 1 | 0 |
| Lobby/join flow -> Room | 0.00 ms | 0.00 ms | 4 | 1 | 0 |

### Repeat navigation (measurable cache wins)
| Transition scenario | Before (cache disabled) | After (cache enabled) | Change |
|---|---:|---:|---:|
| `LineupGrid` opened twice quickly - DB calls | 2 | 1 | -50% |
| `LineupGrid` second visit data ready | 2 ms | 1 ms | -50% |
| `Hot` opened twice quickly - DB calls | 2 | 1 | -50% |
| `Hot` second visit data ready | 4 ms | 3 ms | -25% |

### Listener posture change
| Area | Before | After |
|---|---|---|
| Followers sync | global live `onSnapshot` listener for all authenticated sessions | one-shot fetch (`refreshFollowers`) on demand/focus |
| Room sync | single room listener per active room | unchanged single room listener, now explicitly controlled from `RoomScreen` focus API |
