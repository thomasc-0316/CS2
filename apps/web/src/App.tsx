import type { ReactNode } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppShell from './components/AppShell';
import FullScreenSpinner from './components/FullScreenSpinner';
import RequireAuth from './components/RequireAuth';
import HomePage from './pages/HomePage';
import HotPage from './pages/HotPage';
import LineupsPage from './pages/LineupsPage';
import LineupDetailPage from './pages/LineupDetailPage';
import TacticsPage from './pages/TacticsPage';
import TacticDetailPage from './pages/TacticDetailPage';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import AuthPage from './pages/AuthPage';
import PostPage from './pages/PostPage';
import RoomPage from './pages/RoomPage';
import { AuthProvider, useAuth } from '@ctx/AuthContext.js';
import { TacticsProvider } from '@ctx/TacticsContext.js';
import { UpvoteProvider } from '@ctx/UpvoteContext.js';
import { FavoritesProvider } from '@ctx/FavoritesContext.js';
import { TacticLibraryProvider } from '@ctx/TacticLibraryContext.js';
import { DraftsProvider } from '@ctx/DraftsContext.js';
import { ProfileProvider } from '@ctx/ProfileContext.js';
import { CommentsProvider } from '@ctx/CommentsContext.js';
import { FollowProvider } from '@ctx/FollowContext.js';

function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TacticsProvider>
        <UpvoteProvider>
          <FavoritesProvider>
            <TacticLibraryProvider>
              <DraftsProvider>
                <ProfileProvider>
                  <CommentsProvider>
                    <FollowProvider>{children}</FollowProvider>
                  </CommentsProvider>
                </ProfileProvider>
              </DraftsProvider>
            </TacticLibraryProvider>
          </FavoritesProvider>
        </UpvoteProvider>
      </TacticsProvider>
    </AuthProvider>
  );
}

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) {
    return <FullScreenSpinner message="Bootstrapping session..." />;
  }

  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route element={<ShellLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/hot" element={<HotPage />} />
        <Route path="/lineups/:mapId" element={<LineupsPage />} />
        <Route path="/lineups/:mapId/:lineupId" element={<LineupDetailPage />} />
        <Route path="/tactics" element={<TacticsPage />} />
        <Route path="/tactics/:tacticId" element={<TacticDetailPage />} />
        <Route
          path="/post"
          element={
            <RequireAuth>
              <PostPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route path="/users/:userId" element={<UserProfilePage />} />
        <Route path="/room" element={<RoomPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Providers>
        <AppRoutes />
      </Providers>
    </SafeAreaProvider>
  );
}
