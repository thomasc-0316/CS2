import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { FollowProvider } from '../../context/FollowContext';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      uid: 'user-1',
      displayName: 'User',
      email: 'user@example.com',
      profile: {},
    },
  }),
}));

jest.mock('../../firebaseConfig', () => ({
  db: {},
}));

jest.mock('../../services/firestoreClient', () => ({
  collection: jest.fn(() => ({ _type: 'collection' })),
  getDocs: jest.fn(() =>
    Promise.resolve({
      forEach: jest.fn(),
    })
  ),
  doc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIME'),
}));

describe('FollowContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refreshes followers from Firestore on mount', async () => {
    render(
      <FollowProvider>
        <></>
      </FollowProvider>
    );

    const firestore = require('../../services/firestoreClient');
    await waitFor(() => {
      expect(firestore.getDocs).toHaveBeenCalled();
    });
  });
});
