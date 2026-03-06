# Desktop Web Refurbishment Plan (Stage 0)

## Branch and Baseline
- Branch: `codex/web-desktop-refurbish`
- Base status: `main` is synchronized with `origin/main` (`0 ahead / 0 behind` before branching).
- Scope: rebuild `apps/web` desktop UI from scratch while preserving mobile-aligned product capabilities and shared backend/service logic.

## Current Surface Inventory

### Existing Web Implementation (`apps/web/src`)
- `App.tsx` route shell with shared providers.
- Pages: Home, Hot, Lineups, Lineup Detail, Tactics, Tactic Detail, Post, Profile, User Profile, Room, Auth.
- Existing web shell/components are React Native Web styled and will be replaced completely.

### Mobile Functionality To Preserve (Parity Targets)
1. Authentication
- Email/password sign-in and sign-up.
- Google sign-in.
- Profile bootstrap and auth-gated navigation.

2. Discovery and Feed
- Home experience for lineup discovery.
- Hot/trending feed with ranking intent.
- Map-based lineup browsing.
- Search + filters by side/site/nade type.

3. Lineup Lifecycle
- View lineup details (images + metadata + throw instructions).
- Upvote and favorite interactions.
- Creator profile navigation + follow/unfollow.
- Create lineup flow with media upload and metadata.

4. Tactics
- Explore map/side tactics.
- View tactic details and linked lineups.
- Save tactics to personal library.
- Build personal tactic from selected lineups.

5. Profiles and Social
- Own profile with own lineups.
- Public user profiles.
- Follow graph interactions.
- Player search by username/player ID.

6. Team/Room Workflows
- Room entry point and current room-state visibility.
- Desktop adaptations for realtime lobby/draft controls where feasible.

## Desktop Rebuild Page Map
1. `/` Command Center (home dashboard)
2. `/lineups/:mapId` Map Intel board
3. `/lineups/:mapId/:lineupId` Lineup Operations detail
4. `/hot` Trending feed
5. `/tactics` Tactical Planner hub
6. `/tactics/:tacticId` Tactical dossier
7. `/post` Create/Edit lineup workflow
8. `/profile` My command profile
9. `/users/:userId` Operator profile
10. `/players` Player lookup (desktop addition for parity)
11. `/room` Team room console (phased support on desktop)
12. `/login`, `/signup` Auth routes

## New Web Architecture (Target)

### App-level
- `src/app/` for app bootstrap, routing, providers.
- `src/layout/` for desktop shell, nav, workspace regions.
- `src/theme/` for design tokens, global CSS variables, state tokens.

### Feature modules (web-only UI)
- `src/features/home/`
- `src/features/lineups/`
- `src/features/tactics/`
- `src/features/post/`
- `src/features/profile/`
- `src/features/auth/`
- `src/features/room/`
- `src/features/players/`

### Shared foundations inside web app
- `src/components/ui/` low-level composable primitives (panel, button, field, badge, data-state blocks).
- `src/lib/` web utilities (formatting, router helpers, desktop keyboard helpers).

## Shared vs Web-Only Boundaries

### Keep shared (reuse from mobile/root)
- `context/*` for auth, follows, upvotes, favorites, tactics room state, tactic library, drafts.
- `services/*` for Firestore and storage interactions.
- `data/maps.js` for map metadata.

### Web-only (new)
- All page/view composition.
- Design system implementation and CSS.
- Desktop layout primitives and interaction patterns.
- Web-specific adapters/helpers that avoid mobile UI coupling.

### Remove/replace
- Entire existing `apps/web/src` page/component implementation.
- Legacy web styles/tokens/components tied to current layout.
- Any dead web route/components no longer referenced.

## Design System Direction (CS2 Tactical Desktop)
- Core surfaces: dark tactical grays with layered panel depths.
- Accent palette: restrained utility orange + steel/cyan signal accents.
- Motifs: subtle grid lines, map-room overlays, HUD separators, compact telemetry chips.
- Typography: non-default expressive stack (desktop-first, high readability for dense control panels).
- Interaction: explicit hover/focus/active states, keyboard-visible focus rings.
- Layout: side navigation + top command strip + multi-panel content regions for wide viewports.

## Stage Risks and Mitigations
1. Shared context compatibility with web build
- Mitigation: keep shims/aliases in Vite and verify typecheck/build after each stage.

2. Feature parity regressions while rewriting UI
- Mitigation: maintain a parity checklist and validate route-by-route during Stage 3 and Stage 5.

3. Realtime room complexity on desktop
- Mitigation: deliver stable room console subset first, then expand controls during parity stage.

4. Overcoupling web UI to mobile components
- Mitigation: no shared UI imports; web UI lives only in `apps/web/src`.

5. Visual over-stylization hurting usability
- Mitigation: enforce readability/contrast checks during Stage 4 polish QA.

## Stage 0 QA Checklist (Completed)
- [x] Branch created (`codex/web-desktop-refurbish`)
- [x] Rebuild strategy documented (this plan)
- [x] Desktop page/functionality inventory completed
