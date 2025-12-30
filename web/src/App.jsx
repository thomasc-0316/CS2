import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WebRoutes from './routes';
import { AuthProvider } from '../../context/AuthContext';
import { UpvoteProvider } from '../../context/UpvoteContext';
import { FavoritesProvider } from '../../context/FavoritesContext';
import { DraftsProvider } from '../../context/DraftsContext';
import { ProfileProvider } from '../../context/ProfileContext';
import { CommentsProvider } from '../../context/CommentsContext';
import { FollowProvider } from '../../context/FollowContext';
import { TacticsProvider } from '../../context/TacticsContext';
import { TacticLibraryProvider } from '../../context/TacticLibraryContext';
import Shell from './Shell';

function Providers({ children }) {
  return (
    <AuthProvider>
      <TacticsProvider>
        <UpvoteProvider>
          <FavoritesProvider>
            <TacticLibraryProvider>
              <DraftsProvider>
                <ProfileProvider>
                  <CommentsProvider>
                    <FollowProvider>
                      {children}
                    </FollowProvider>
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

export default function App() {
  return (
    <SafeAreaProvider>
      <Providers>
        <Shell>
          <WebRoutes />
        </Shell>
      </Providers>
    </SafeAreaProvider>
  );
}
