import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomeScreen from '../../screens/HomeScreen';
import HotScreen from '../../screens/HotScreen';
import TacticsHubScreen from '../../screens/TacticsHubScreen';
import TacticDetailScreen from '../../screens/TacticDetailScreen';
import TacticsMapSelectScreen from '../../screens/TacticsMapSelectScreen';
import LineupGridScreen from '../../screens/LineupGridScreen';
import LineupDetailScreen from '../../screens/LineupDetailScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import UserProfileScreen from '../../screens/UserProfileScreen';
import LoginScreen from '../../screens/LoginScreen';
import SignupScreen from '../../screens/SignupScreen';
import SearchLineupsScreen from '../../screens/SearchLineupsScreen';
import PlayerSearchScreen from '../../screens/PlayerSearchScreen';
import PostScreen from '../../screens/PostScreen';
import PreviewPostScreen from '../../screens/PreviewPostScreen';
import RoomScreen from '../../screens/RoomScreen';
import MapSelectionScreen from '../../screens/MapSelectionScreen';
import CreateTacticFromFavoritesScreen from '../../screens/CreateTacticFromFavoritesScreen';
import { MAPS } from '../../data/maps';
import { createWebScreen } from './navigationShim';
import RequireAuth from './RequireAuth';
import FriendsScreen from './FriendsScreen';

const defaultMap = MAPS[0] || { id: 'default', name: 'Map' };

const HomeRoute = createWebScreen(HomeScreen, 'HomeMain', ({ stateParams }) => ({
  ...(stateParams || {}),
}));

const HotRoute = createWebScreen(HotScreen, 'Hot', ({ stateParams }) => ({
  ...(stateParams || {}),
}));

const TacticsRoute = createWebScreen(TacticsHubScreen, 'TacticsMain', ({ stateParams }) => ({
  ...(stateParams || {}),
}));

const TacticDetailRoute = createWebScreen(
  TacticDetailScreen,
  'TacticDetail',
  ({ params, stateParams }) => ({
    ...(stateParams || {}),
    tacticId: params.tacticId,
  }),
);

const TacticsMapSelectRoute = createWebScreen(
  TacticsMapSelectScreen,
  'TacticsMapSelect',
  ({ stateParams }) => stateParams || {},
);

const CreateTacticFromFavoritesRoute = createWebScreen(
  CreateTacticFromFavoritesScreen,
  'CreateTacticFromFavorites',
  ({ stateParams }) => stateParams || {},
);

const LineupGridRoute = createWebScreen(
  LineupGridScreen,
  'LineupGrid',
  ({ params, stateParams }) => {
    const mapId =
      stateParams?.map?.id ||
      stateParams?.mapId ||
      params.mapId ||
      defaultMap.id;
    const map = MAPS.find((item) => item.id === mapId) || defaultMap;
    return { ...(stateParams || {}), map, mapId };
  },
);

const LineupDetailRoute = createWebScreen(
  LineupDetailScreen,
  'LineupDetail',
  ({ params, stateParams }) => ({
    ...(stateParams || {}),
    lineupId: params.lineupId || stateParams?.lineupId,
    mapId: params.mapId || stateParams?.mapId,
  }),
);

const ProfileRoute = createWebScreen(ProfileScreen, 'ProfileMain', ({ stateParams }) => stateParams || {});
const UserProfileRoute = createWebScreen(
  UserProfileScreen,
  'UserProfile',
  ({ params, stateParams }) => ({
    ...(stateParams || {}),
    userId: params.userId || stateParams?.userId,
  }),
);
const LoginRoute = createWebScreen(LoginScreen, 'Login', ({ stateParams }) => stateParams || {});
const SignupRoute = createWebScreen(SignupScreen, 'Signup', ({ stateParams }) => stateParams || {});
const SearchRoute = createWebScreen(SearchLineupsScreen, 'SearchLineups', ({ stateParams }) => stateParams || {});
const PlayerSearchRoute = createWebScreen(
  PlayerSearchScreen,
  'PlayerSearch',
  ({ stateParams }) => stateParams || {},
);
const RoomRoute = createWebScreen(RoomScreen, 'RoomMain', ({ stateParams }) => stateParams || {});
const PostRoute = createWebScreen(PostScreen, 'PostMain', ({ stateParams }) => stateParams || {});
const PreviewPostRoute = createWebScreen(
  PreviewPostScreen,
  'PreviewPost',
  ({ stateParams }) => stateParams || {},
);
const MapSelectionRoute = createWebScreen(
  MapSelectionScreen,
  'MapSelection',
  ({ stateParams }) => stateParams || {},
);
const FriendsRoute = createWebScreen(FriendsScreen, 'Friends', ({ stateParams }) => stateParams || {});

export default function WebRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/hot" element={<HotRoute />} />
      <Route path="/tactics" element={<TacticsRoute />} />
      <Route path="/tactics/:tacticId" element={<TacticDetailRoute />} />
      <Route
        path="/tactics/favorites"
        element={
          <RequireAuth>
            <CreateTacticFromFavoritesRoute />
          </RequireAuth>
        }
      />
      <Route path="/tactics/maps" element={<TacticsMapSelectRoute />} />
      <Route path="/lineups/:mapId" element={<LineupGridRoute />} />
      <Route path="/lineups/:mapId/:lineupId" element={<LineupDetailRoute />} />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfileRoute />
          </RequireAuth>
        }
      />
      <Route path="/users/:userId" element={<UserProfileRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/signup" element={<SignupRoute />} />
      <Route path="/search" element={<SearchRoute />} />
      <Route path="/search/players" element={<PlayerSearchRoute />} />
      <Route
        path="/room"
        element={
          <RequireAuth>
            <RoomRoute />
          </RequireAuth>
        }
      />
      <Route
        path="/post"
        element={
          <RequireAuth>
            <PostRoute />
          </RequireAuth>
        }
      />
      <Route
        path="/post/preview"
        element={
          <RequireAuth>
            <PreviewPostRoute />
          </RequireAuth>
        }
      />
      <Route path="/maps" element={<MapSelectionRoute />} />
      <Route
        path="/friends"
        element={
          <RequireAuth>
            <FriendsRoute />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
