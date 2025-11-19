import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { UpvoteProvider } from './context/UpvoteContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { DraftsProvider } from './context/DraftsContext';

export default function App() {
  return (
    <UpvoteProvider>
      <FavoritesProvider>
        <DraftsProvider>
          <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
          <AppNavigator />
        </DraftsProvider>
      </FavoritesProvider>
    </UpvoteProvider>
  );
}