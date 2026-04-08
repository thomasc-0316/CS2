import React from 'react';
import { render, act } from '@testing-library/react-native';

let authStateCallback;

jest.mock('firebase/auth', () => {
  const mock = {
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    updateProfile: jest.fn(),
    signInWithCredential: jest.fn(),
    GoogleAuthProvider: {
      credential: jest.fn((token) => ({ token })),
    },
  };

  return {
    createUserWithEmailAndPassword: (...args) =>
      mock.createUserWithEmailAndPassword(...args),
    signInWithEmailAndPassword: (...args) =>
      mock.signInWithEmailAndPassword(...args),
    signOut: (...args) => mock.signOut(...args),
    updateProfile: (...args) => mock.updateProfile(...args),
    onAuthStateChanged: (_auth, callback) => {
      authStateCallback = callback;
      return jest.fn();
    },
    GoogleAuthProvider: mock.GoogleAuthProvider,
    signInWithCredential: (...args) => mock.signInWithCredential(...args),
    __mock: mock,
  };
});

jest.mock('firebase/firestore', () => {
  const mock = {
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    serverTimestamp: jest.fn(() => 'SERVER_TIME'),
    doc: jest.fn((_db, _col, id) => ({ id })),
  };

  return {
    getDoc: (...args) => mock.getDoc(...args),
    setDoc: (...args) => mock.setDoc(...args),
    serverTimestamp: (...args) => mock.serverTimestamp(...args),
    doc: (...args) => mock.doc(...args),
    __mock: mock,
  };
});

jest.mock('../../firebaseConfig', () => ({
  auth: {},
  db: {},
}));

const Harness = React.forwardRef((props, ref) => {
  // Require after mocks are registered
  // eslint-disable-next-line global-require
  const { useAuth } = require('../../context/AuthContext');
  const auth = useAuth();
  React.useImperativeHandle(ref, () => auth, [auth]);
  return null;
});

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStateCallback = undefined;
  });

  const bootstrap = async () => {
    const ref = React.createRef();
    // eslint-disable-next-line global-require
    const { AuthProvider } = require('../../context/AuthContext');
    render(
      <AuthProvider>
        <Harness ref={ref} />
      </AuthProvider>
    );

    await act(async () => {});

    await act(async () => {
      authStateCallback(null);
    });

    return ref;
  };

  it('signs up and creates a profile document', async () => {
    const ref = await bootstrap();
    const mockUser = { uid: 'user-1', email: 'user@example.com', displayName: null };
    const authMocks = require('firebase/auth').__mock;
    const firestoreMocks = require('firebase/firestore').__mock;

    authMocks.createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });

    await act(async () => {
      await ref.current.signup('user@example.com', 'password', 'user', 'User');
    });

    expect(authMocks.createUserWithEmailAndPassword).toHaveBeenCalled();
    expect(authMocks.updateProfile).toHaveBeenCalled();
    expect(firestoreMocks.setDoc).toHaveBeenCalled();
  });

  it('logs in with email and password', async () => {
    const ref = await bootstrap();
    const authMocks = require('firebase/auth').__mock;
    authMocks.signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'user-1' } });

    await act(async () => {
      await ref.current.login('user@example.com', 'password');
    });

    expect(authMocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
      {},
      'user@example.com',
      'password'
    );
  });

  it('logs in with Google and creates profile when missing', async () => {
    const ref = await bootstrap();
    const mockUser = {
      uid: 'user-2',
      email: 'user2@example.com',
      displayName: 'User Two',
      photoURL: null,
    };
    const authMocks = require('firebase/auth').__mock;
    const firestoreMocks = require('firebase/firestore').__mock;

    authMocks.signInWithCredential.mockResolvedValue({ user: mockUser });
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });

    await act(async () => {
      await ref.current.loginWithGoogle('token-123');
    });

    expect(authMocks.GoogleAuthProvider.credential).toHaveBeenCalledWith('token-123');
    expect(authMocks.signInWithCredential).toHaveBeenCalled();
    expect(firestoreMocks.setDoc).toHaveBeenCalled();
  });

  it('throws when Google token is missing', async () => {
    const ref = await bootstrap();
    const authMocks = require('firebase/auth').__mock;

    await act(async () => {
      await expect(ref.current.loginWithGoogle()).rejects.toThrow(
        'Missing Google ID token'
      );
    });

    expect(authMocks.signInWithCredential).not.toHaveBeenCalled();
  });

  it('restores session with profile data', async () => {
    const ref = React.createRef();
    // eslint-disable-next-line global-require
    const { AuthProvider } = require('../../context/AuthContext');
    render(
      <AuthProvider>
        <Harness ref={ref} />
      </AuthProvider>
    );

    await act(async () => {});

    const profile = { username: 'player1' };
    const firestoreMocks = require('firebase/firestore').__mock;
    firestoreMocks.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user-1',
      data: () => profile,
    });

    await act(async () => {
      authStateCallback({ uid: 'user-1', email: 'user@example.com' });
    });

    expect(ref.current.currentUser.profile.username).toBe('player1');
  });

  it('creates profile on auth restore when missing', async () => {
    const ref = await bootstrap();
    const firestoreMocks = require('firebase/firestore').__mock;

    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });

    await act(async () => {
      await authStateCallback({ uid: 'user-3', email: 'user3@example.com' });
    });

    expect(firestoreMocks.setDoc).toHaveBeenCalled();
    expect(ref.current.currentUser.profile.username).toBe('user3');
  });

  it('logs out and clears current user', async () => {
    const ref = await bootstrap();
    const authMocks = require('firebase/auth').__mock;
    const firestoreMocks = require('firebase/firestore').__mock;
    authMocks.signOut.mockResolvedValue();

    firestoreMocks.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user-1',
      data: () => ({ username: 'player1' }),
    });

    await act(async () => {
      authStateCallback({ uid: 'user-1', email: 'user@example.com' });
    });

    await act(async () => {
      await ref.current.logout();
    });

    expect(authMocks.signOut).toHaveBeenCalled();
    expect(ref.current.currentUser).toBe(null);
  });

  it('signs out when auth bootstrap fails', async () => {
    const ref = await bootstrap();
    const authMocks = require('firebase/auth').__mock;
    const firestoreMocks = require('firebase/firestore').__mock;
    authMocks.signOut.mockResolvedValue();
    firestoreMocks.getDoc.mockRejectedValue(new Error('boom'));

    await act(async () => {
      await authStateCallback({ uid: 'user-4', email: 'user4@example.com' });
    });

    expect(authMocks.signOut).toHaveBeenCalled();
    expect(ref.current.currentUser).toBe(null);
  });

  it('updates user profile and refreshes current user', async () => {
    const ref = await bootstrap();
    const authMocks = require('firebase/auth').__mock;
    const firestoreMocks = require('firebase/firestore').__mock;
    const firebaseConfig = require('../../firebaseConfig');

    firebaseConfig.auth.currentUser = { uid: 'user-1' };
    firestoreMocks.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user-1',
      data: () => ({ username: 'newname' }),
    });

    await act(async () => {
      await ref.current.updateUserProfile({ username: 'newname' });
    });

    expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
      { id: 'user-1' },
      expect.objectContaining({ username: 'newname', usernameLower: 'newname' }),
      { merge: true }
    );
    expect(authMocks.updateProfile).toHaveBeenCalledWith(
      firebaseConfig.auth.currentUser,
      { displayName: 'newname' }
    );
  });

  it('throws when updating profile without authenticated user', async () => {
    const ref = await bootstrap();
    const firebaseConfig = require('../../firebaseConfig');
    firebaseConfig.auth.currentUser = null;

    await act(async () => {
      await expect(ref.current.updateUserProfile({ username: 'newname' })).rejects.toThrow(
        'No authenticated user'
      );
    });
  });
});
