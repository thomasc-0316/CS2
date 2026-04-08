import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import PlayerSearchScreen from '../../screens/PlayerSearchScreen';

const mockNavigate = jest.fn();

const createDoc = (id, data) => ({ id, data: () => data });
const createSnapshot = (docs) => ({
  empty: docs.length === 0,
  docs,
  forEach: (cb) => docs.forEach(cb),
});

jest.mock('firebase/firestore', () => {
  const mock = {
    getDocs: jest.fn(),
    collection: jest.fn(),
    query: jest.fn((...args) => ({ args })),
    where: jest.fn(),
    orderBy: jest.fn(),
    startAt: jest.fn(),
    endAt: jest.fn(),
    limit: jest.fn(),
  };

  return {
    getDocs: (...args) => mock.getDocs(...args),
    collection: (...args) => mock.collection(...args),
    query: (...args) => mock.query(...args),
    where: (...args) => mock.where(...args),
    orderBy: (...args) => mock.orderBy(...args),
    startAt: (...args) => mock.startAt(...args),
    endAt: (...args) => mock.endAt(...args),
    limit: (...args) => mock.limit(...args),
    __mock: mock,
  };
});

jest.mock('../../firebaseConfig', () => ({ db: {} }));

describe('PlayerSearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
  });

  it('shows validation error when search is empty', async () => {
    const { findByText, getByText } = render(
      <PlayerSearchScreen navigation={{ navigate: mockNavigate }} />
    );

    fireEvent.press(getByText('Search'));

    expect(await findByText('Enter a Player ID or username.')).toBeTruthy();
  });

  it('renders results and navigates to profile', async () => {
    const firestoreMocks = require('firebase/firestore').__mock;
    firestoreMocks.getDocs
      .mockResolvedValueOnce(createSnapshot([]))
      .mockResolvedValueOnce(
        createSnapshot([
          createDoc('user-1', {
            username: 'User One',
            playerID: 'ABC123',
            profilePicture: null,
          }),
        ])
      );

    const { findByText, getByPlaceholderText, getByText } = render(
      <PlayerSearchScreen navigation={{ navigate: mockNavigate }} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter Player ID or username'), 'user');

    await act(async () => {
      fireEvent.press(getByText('Search'));
    });

    expect(await findByText('User One')).toBeTruthy();
    expect(await findByText('Player ID: ABC123')).toBeTruthy();

    fireEvent.press(getByText('User One'));

    expect(mockNavigate).toHaveBeenCalledWith('UserProfile', {
      userId: 'user-1',
      username: 'User One',
      profilePicture: null,
    });
  });
});
