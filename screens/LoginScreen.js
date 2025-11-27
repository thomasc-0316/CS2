import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuth } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

// --- CONFIGURATION ---
const GOOGLE_WEB_CLIENT_ID = '563685919534-a19qr9hubus44sme0aqhq7hoc6rejica.apps.googleusercontent.com';
// Native ID kept for future reference if you switch off proxy later
const GOOGLE_IOS_CLIENT_ID = '563685919534-2fg45eppv095rgqk7jkuap0dgk27ojh2.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = "563685919534-oc16fkrv6d5uacpjp9uvop0r3oecf27n.apps.googleusercontent.com"

export const googleClientIds = {
  expo: GOOGLE_WEB_CLIENT_ID,
  ios: GOOGLE_IOS_CLIENT_ID, 
  android: GOOGLE_ANDROID_CLIENT_ID,
  web: GOOGLE_WEB_CLIENT_ID,
};

// Force Expo's HTTPS proxy. This requires the "Web Client ID".
const useProxy = false;

const redirectUri = makeRedirectUri({
  useProxy,
});

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientIds.web, // Simplified: Just use the Web ID for everything when using Proxy
    iosClientId: googleClientIds.ios,
    androidClientId: googleClientIds.android,
    webClientId: googleClientIds.web,
    redirectUri,
  });

  const handleLogin = async () => {
    if (googleLoading) return;

    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      let errorMessage = 'Failed to log in';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!request) {
      Alert.alert('Error', 'Google sign-in is not ready yet. Please try again in a moment.');
      return;
    }

    try {
      setGoogleLoading(true);
      await promptAsync({ useProxy });
    } catch (error) {
      setGoogleLoading(false);
      Alert.alert('Error', 'Google sign-in could not start. Please try again.');
    }
  };

  useEffect(() => {
    const finishGoogleLogin = async () => {
      if (!response) return;

      if (response.type !== 'success') {
        setGoogleLoading(false);
        return;
      }

      const idToken = response.params?.id_token;

      if (!idToken) {
        setGoogleLoading(false);
        Alert.alert('Error', 'No ID token returned from Google.');
        return;
      }

      try {
        await loginWithGoogle(idToken);
      } catch (error) {
        console.error('Google sign-in error:', error);
        Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    };

    finishGoogleLogin();
  }, [response, loginWithGoogle]);

  const isBusy = loading || googleLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Log in to CS2 Tactics</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={isBusy}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleLogin}
          disabled={isBusy}
        >
          {googleLoading ? (
            <ActivityIndicator color="#1a1a1a" />
          ) : (
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  button: {
    backgroundColor: '#FF6800',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: '#fff',
    marginTop: 12,
  },
  googleButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#888',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#FF6800',
    fontWeight: 'bold',
  },
});