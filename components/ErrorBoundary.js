// components/ErrorBoundary.js
//
// Top-level React error boundary. Without this, any thrown error inside a
// context provider or screen would crash the entire app to a white screen
// (M8 in FULL_QA_AUDIT.md). Captures the error, logs it, and renders a
// minimal recovery UI with a reset button.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Surface the error to whatever logger is configured. We deliberately
    // do not pull in Sentry/Firebase Performance here so this stays free of
    // optional deps; wire one in via props.onError if you need it.
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught', error, info?.componentStack);
    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, info);
      } catch (_) {
        // ignore reporter errors
      }
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({ error: this.state.error, reset: this.reset });
      }
      return (
        <View style={styles.container} testID="error-boundary-fallback">
          <Text style={styles.title}>Something went wrong.</Text>
          <ScrollView style={styles.errorBox}>
            <Text style={styles.errorText}>
              {this.state.error?.message || 'Unknown error'}
            </Text>
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={this.reset}>
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  errorBox: {
    maxHeight: 200,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    alignSelf: 'stretch',
  },
  errorText: {
    color: '#FF6800',
    fontFamily: 'System',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#FF6800',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default ErrorBoundary;
