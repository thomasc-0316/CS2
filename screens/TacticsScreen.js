import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TacticsScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="book" size={80} color="#FF6800" />
      <Text style={styles.title}>Tactics</Text>
      <Text style={styles.text}>Coming Soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 18,
    color: '#666',
  },
});