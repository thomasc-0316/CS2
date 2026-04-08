import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RoomScreen from '../../screens/RoomScreen';

const mockJoinRoom = jest.fn();
const mockCreateRoom = jest.fn();
let mockError = '';

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: (effect) => {
      React.useEffect(effect, [effect]);
    },
  };
});

jest.mock('../../context/TacticsContext', () => ({
  useTactics: () => ({
    user: { uid: 'user-1' },
    room: null,
    roomCode: '',
    isIGL: false,
    loading: false,
    error: mockError,
    createRoom: mockCreateRoom,
    joinRoom: mockJoinRoom,
    setMap: jest.fn(),
    goToPrepPhase: jest.fn(),
    returnToMapSelect: jest.fn(),
    startMatch: jest.fn(),
    setSide: jest.fn(),
    setTacticSource: jest.fn(),
    voteForTactic: jest.fn(),
    startGrenadeDraft: jest.fn(),
    selectGrenade: jest.fn(),
    toggleTimerPause: jest.fn(),
    skipToExecution: jest.fn(),
    endRound: jest.fn(),
    leaveRoom: jest.fn(),
    setRoomRealtimeEnabled: jest.fn(),
    clearError: jest.fn(),
  }),
}));

jest.mock('../../firebaseConfig', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

describe('RoomScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockError = '';
  });

  it('does not join when room code is incomplete', () => {
    const { getByPlaceholderText, getByText } = render(<RoomScreen />);

    fireEvent.changeText(
      getByPlaceholderText('Enter 6-digit room code'),
      '12345'
    );
    fireEvent.press(getByText('Join Room'));

    expect(mockJoinRoom).not.toHaveBeenCalled();
  });

  it('joins room with valid 6-digit code', () => {
    const { getByPlaceholderText, getByText } = render(<RoomScreen />);

    fireEvent.changeText(
      getByPlaceholderText('Enter 6-digit room code'),
      '123456'
    );
    fireEvent.press(getByText('Join Room'));

    expect(mockJoinRoom).toHaveBeenCalledWith('123456');
  });

  it('shows error banner when context error is set', () => {
    mockError = 'Room is full.';
    const { getByText } = render(<RoomScreen />);
    expect(getByText('Room is full.')).toBeTruthy();
  });
});
