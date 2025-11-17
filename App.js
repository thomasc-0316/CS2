import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { UpvoteProvider } from './context/UpvoteContext';
import { FavoritesProvider } from './context/FavoritesContext';

export default function App() {
  return (
    <UpvoteProvider>
      <FavoritesProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <AppNavigator />
      </FavoritesProvider>
    </UpvoteProvider>
  );
}