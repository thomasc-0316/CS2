import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RoomScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room is mobile-only for now.</Text>
      <Text style={styles.subtitle}>Open the iOS/Android app to access live rooms.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d1017',
    padding: 24,
    gap: 8,
  },
  title: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 20,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
});
