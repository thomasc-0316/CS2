import React from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';  // ADD THIS
import AppNavigator from './navigation/AppNavigator';
import AuthNavigator from './navigation/AuthNavigator';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UpvoteProvider } from './context/UpvoteContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { DraftsProvider } from './context/DraftsContext';
import { ProfileProvider } from './context/ProfileContext';
import { CommentsProvider } from './context/CommentsContext';
import { FollowProvider } from './context/FollowContext';
import { TacticsProvider } from './context/TacticsContext';
import { TacticLibraryProvider } from './context/TacticLibraryContext';

function AppContent() {
  const { currentUser, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
        <ActivityIndicator size="large" color="#FF6800" />
      </View>
    );
  }

  // Wrap EVERYTHING in NavigationContainer
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      {currentUser ? (
        // If logged in, show main app with all providers
        <TacticsProvider>
          <UpvoteProvider>
            <FavoritesProvider>
              <TacticLibraryProvider>
                <DraftsProvider>
                  <ProfileProvider>
                    <CommentsProvider>
                      <FollowProvider>
                        <AppNavigator />
                      </FollowProvider>
                    </CommentsProvider>
                  </ProfileProvider>
                </DraftsProvider>
              </TacticLibraryProvider>
            </FavoritesProvider>
          </UpvoteProvider>
        </TacticsProvider>
      ) : (
        // If not logged in, show auth screens
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
