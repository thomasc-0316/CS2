import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { UpvoteProvider } from './context/UpvoteContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { DraftsProvider } from './context/DraftsContext';
import { ProfileProvider } from './context/ProfileContext';
import { CommentsProvider } from './context/CommentsContext';
import { FollowProvider } from './context/FollowContext';
import { TacticsProvider } from './context/TacticsContext';

export default function App() {
  return (
    <TacticsProvider>
      <UpvoteProvider>
        <FavoritesProvider>
          <DraftsProvider>
            <ProfileProvider>
              <CommentsProvider>
                <FollowProvider>
                  <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
                  <AppNavigator />
                </FollowProvider>
              </CommentsProvider>
            </ProfileProvider>
          </DraftsProvider>
        </FavoritesProvider>
      </UpvoteProvider>
    </TacticsProvider>
  );
}
