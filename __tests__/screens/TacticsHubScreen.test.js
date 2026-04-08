import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TacticsHubScreen from '../../screens/TacticsHubScreen';

const mockToggleTactic = jest.fn();

jest.mock('../../context/TacticLibraryContext', () => ({
  useTacticLibrary: () => ({
    savedTactics: [],
    toggleTactic: mockToggleTactic,
    isSaved: () => false,
  }),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'user-1' },
  }),
}));

jest.mock('../../services/lineupService', () => ({
  getFilteredLineups: jest.fn(async () => [
    {
      id: 'l1',
      title: 'A Default Smoke',
      side: 'T',
      mapId: 'dust2',
      landImage: 'https://example.com/land.jpg',
    },
  ]),
}));

jest.mock('../../services/tacticService', () => ({
  fetchPublicTactics: jest.fn(async () => [
    {
      id: 't1',
      title: 'Pistol exec',
      description: 'Fast A split',
      mapId: 'dust2',
      side: 'T',
      lineupIds: ['l1'],
      tags: [],
    },
  ]),
  fetchUserTactics: jest.fn(async () => []),
}));

describe('TacticsHubScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders explore tactics and switches to my tactics empty state', async () => {
    const { findByText, getByText } = render(
      <TacticsHubScreen
        navigation={{ navigate: jest.fn() }}
        route={{ params: { map: { id: 'dust2' } } }}
      />
    );

    expect(await findByText('Pistol exec')).toBeTruthy();

    fireEvent.press(getByText('My tactics'));

    expect(await findByText('No saved tactics yet')).toBeTruthy();
  });
});
