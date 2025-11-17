import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SideSelectionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Side Selection Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
  },
});