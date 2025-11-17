import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { UpvoteProvider } from './context/UpvoteContext';

export default function App() {
  return (
    <UpvoteProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <AppNavigator />
    </UpvoteProvider>
  );
}