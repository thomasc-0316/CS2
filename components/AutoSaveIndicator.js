// components/AutoSaveIndicator.js
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Auto-save status indicator component
 * Shows at the top of the PostScreen
 * 
 * @param {string} status - 'idle', 'saving', 'saved', 'error'
 * @param {Date} lastSaved - Last save timestamp
 */
export default function AutoSaveIndicator({ status, lastSaved }) {
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (status === 'saving' || status === 'saved' || status === 'error') {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [status, opacity]);

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: 'cloud-upload-outline',
          text: 'Saving draft...',
          color: '#999',
        };
      case 'saved':
        return {
          icon: 'checkmark-circle',
          text: 'Draft saved',
          color: '#10B981', // Green
        };
      case 'error':
        return {
          icon: 'alert-circle',
          text: 'Save failed',
          color: '#EF4444', // Red
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Ionicons name={config.icon} size={16} color={config.color} />
      <Text style={[styles.text, { color: config.color }]}>
        {config.text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});