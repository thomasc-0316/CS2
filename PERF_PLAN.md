# Performance Plan And Change Log

## What Changed

### 1) Instrumentation foundation
- Added perf monitor: [`services/perfMonitor.js`](/Users/ivan/CS2/services/perfMonitor.js)
  - screen timings (`mount -> first content`, `mount -> data ready`)
  - render counters
  - Firestore call/listener counters
- Added Firestore wrapper: [`services/firestoreClient.js`](/Users/ivan/CS2/services/firestoreClient.js)
  - wrapped reads/writes and listener lifecycle accounting
- Added perf hooks:
  - [`hooks/useScreenPerf.js`](/Users/ivan/CS2/hooks/useScreenPerf.js)
  - [`hooks/useRenderCount.js`](/Users/ivan/CS2/hooks/useRenderCount.js)
- Wired key screens/components:
  - `HomeScreen`, `LineupGridScreen`, `HotScreen`, `RoomScreen`, `TacticsHubScreen`, `ProfileScreen`
  - `LineupCard`, `TacticCard`

Why it helps:
- Gives objective before/after numbers instead of anecdotal speed claims.

Tradeoffs:
- Small dev/test-only overhead in instrumented builds.

Rollback:
- Revert imports of `useScreenPerf`/`useRenderCount` and replace `firestoreClient` imports with `firebase/firestore`.

### 2) Listener lifecycle tightening
- Removed always-on followers realtime listener from [`context/FollowContext.js`](/Users/ivan/CS2/context/FollowContext.js).
- Replaced with one-shot refresh (`refreshFollowers`) + profile focus refresh.
- Added room realtime toggle plumbing in [`context/TacticsContext.js`](/Users/ivan/CS2/context/TacticsContext.js) and wired focus lifecycle in [`screens/RoomScreen.js`](/Users/ivan/CS2/screens/RoomScreen.js).

Why it helps:
- Cuts passive background listener cost outside active need.
- Aligns with “one live listener per active room” guideline.

Tradeoffs:
- Follower list is no longer globally live-updating in every screen; it refreshes on-demand/focus instead.

Rollback:
- Restore `onSnapshot` follower listener logic in `FollowContext`.
- Remove `setRoomRealtimeEnabled` focus wiring and revert listener gating in `TacticsContext`.

### 3) TTL cache + stale-while-revalidate data flow
- Added cache layer: [`services/dataCache.js`](/Users/ivan/CS2/services/dataCache.js)
  - in-memory TTL cache
  - optional AsyncStorage-backed persistent cache
  - in-flight request deduping
- Added timestamp normalization helper: [`services/timeUtils.js`](/Users/ivan/CS2/services/timeUtils.js)
- Applied SWR-style cache usage in:
  - [`screens/LineupGridScreen.js`](/Users/ivan/CS2/screens/LineupGridScreen.js) (memory + persistent cache)
  - [`screens/HotScreen.js`](/Users/ivan/CS2/screens/HotScreen.js) (memory + persistent cache)
  - [`screens/HomeScreen.js`](/Users/ivan/CS2/screens/HomeScreen.js) (following feed memory cache + parallel batch fetch)
  - [`screens/RoomScreen.js`](/Users/ivan/CS2/screens/RoomScreen.js) (map lineups/tactics memory cache)
  - [`screens/TacticsHubScreen.js`](/Users/ivan/CS2/screens/TacticsHubScreen.js) (lineups/tactics memory cache)

Why it helps:
- Avoids duplicate fetches on quick back-and-forth navigation.
- Improves second-visit readiness and reduces DB chatter.
- Dedupes simultaneous requests for same key.

Tradeoffs:
- Slightly more code complexity around cache invalidation/TTL.
- Very short windows may show stale data until background refresh completes.

Rollback:
- Revert cache reads/writes in affected screens.
- Keep direct network fetch paths only (existing logic is still straightforward to restore).

### 4) Render + JS thread smoothing
- Memoized heavy cards:
  - [`components/LineupCard.js`](/Users/ivan/CS2/components/LineupCard.js)
  - [`components/TacticCard.js`](/Users/ivan/CS2/components/TacticCard.js)
- Stabilized heavy list render callbacks and memoized derived filters/sorts in list screens.
- Reduced timer update frequency in Room draft countdown from 500ms -> 1000ms.
- Added lightweight grid skeleton placeholder:
  - [`components/LineupGridSkeleton.js`](/Users/ivan/CS2/components/LineupGridSkeleton.js)
  - used in `LineupGridScreen` and `HotScreen`.

Why it helps:
- Fewer wasted renders in list-heavy UIs.
- Less churn on JS thread during countdown phase.
- Better perceived smoothness during initial list load.

Tradeoffs:
- Memo comparison logic must stay aligned with prop shape assumptions.

Rollback:
- Remove `React.memo` wrappers and callback memoization.
- Restore spinner-only loading UIs and old timer interval.

## Validation
- Baseline + optimization metrics:
  - [`__tests__/perf/perfBaselineMetrics.test.js`](/Users/ivan/CS2/__tests__/perf/perfBaselineMetrics.test.js)
  - [`__tests__/perf/perfOptimizationMetrics.test.js`](/Users/ivan/CS2/__tests__/perf/perfOptimizationMetrics.test.js)
- Regression checks added:
  - cache TTL/dedup tests: [`__tests__/services/dataCache.test.js`](/Users/ivan/CS2/__tests__/services/dataCache.test.js)
  - listener/network instrumentation tests: [`__tests__/services/firestoreClient.test.js`](/Users/ivan/CS2/__tests__/services/firestoreClient.test.js)
- Full test suite status: `npm test` passing.

## Rollback Strategy (Fast)
1. Disable caching behavior by setting `DISABLE_PERF_CACHE=1` (supported in `dataCache.js`).
2. Revert listener gating by restoring `FollowContext` snapshot listener and removing `setRoomRealtimeEnabled` wiring.
3. Revert memo/skeleton-only UI changes if any visual regressions are reported.
4. Keep instrumentation files in place even if optimizations are rolled back, so regression deltas remain measurable.
