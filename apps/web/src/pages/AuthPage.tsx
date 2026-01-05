import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@ctx/AuthContext.js';
import Surface from '../components/Surface';
import { colors, radii, spacing } from '../theme/tokens';

type Mode = 'login' | 'signup';

type Props = {
  mode: Mode;
};

export default function AuthPage({ mode }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, loginWithGooglePopup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from || '/';

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password, username || email.split('@')[0], displayName || username);
      }
      navigate(from);
    } catch (err: any) {
      console.error('Auth error', err);
      setError(err?.message || 'Unable to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGooglePopup();
      navigate(from);
    } catch (err: any) {
      console.error('Google login failed', err);
      setError('Google sign-in failed. Ensure popups are allowed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      <Surface>
        <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create an account'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'login'
            ? 'Use the same credentials as the mobile app.'
            : 'Set a username to show up on your lineups and tactics.'}
        </Text>

        <View style={styles.form}>
          {mode === 'signup' ? (
            <>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="username"
                placeholderTextColor={colors.muted}
              />
              <Text style={styles.label}>Display name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Optional"
                placeholderTextColor={colors.muted}
              />
            </>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Text style={styles.button} onPress={handleSubmit} suppressHighlighting>
              {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </Text>
            <Text style={styles.altButton} onPress={handleGoogle} suppressHighlighting>
              {loading ? '...' : 'Continue with Google'}
            </Text>
          </View>

          <View style={styles.switch}>
            <Text style={styles.switchText}>
              {mode === 'login' ? "Don't have an account?" : 'Already registered?'}{' '}
              <Link to={mode === 'login' ? '/signup' : '/login'} className="link">
                <Text style={styles.link}>
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </Text>
              </Link>
            </Text>
          </View>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 24,
  },
  subtitle: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  form: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  error: {
    color: colors.danger,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'column',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    textAlign: 'center',
    backgroundColor: colors.primary,
    color: '#0b0c10',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  altButton: {
    textAlign: 'center',
    backgroundColor: colors.surface,
    color: colors.text,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: colors.border,
  },
  switch: {
    marginTop: spacing.sm,
  },
  switchText: {
    color: colors.muted,
  },
  link: {
    color: colors.primary,
    fontWeight: '800',
  },
});
