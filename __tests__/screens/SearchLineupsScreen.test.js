import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import SearchLineupsScreen from '../../screens/SearchLineupsScreen';

let mockFavorites = [];

const createDoc = (id, data) => ({ id, data: () => data });
const createSnapshot = (docs) => ({
  docs,
  forEach: (cb) => docs.forEach(cb),
});

jest.mock('../../context/FavoritesContext', () => ({
  useFavorites: () => ({
    getFavorites: () => mockFavorites,
  }),
}));

jest.mock('../../context/UpvoteContext', () => ({
  useUpvotes: () => ({
    getUpvoteCount: () => 0,
  }),
}));

jest.mock('@react-native-seoul/masonry-list', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ data = [], renderItem, keyExtractor, ListEmptyComponent }) => {
    const Empty = ListEmptyComponent;
    if (!data.length && Empty) {
      return React.isValidElement(Empty) ? Empty : <Empty />;
    }
    return (
      <View>
        {data.map((item, index) => (
          <React.Fragment
            key={keyExtractor ? keyExtractor(item, index) : index}
          >
            {renderItem({ item, index })}
          </React.Fragment>
        ))}
      </View>
    );
  };
});

jest.mock('firebase/firestore', () => {
  const mock = {
    getDocs: jest.fn(),
    collection: jest.fn(),
    query: jest.fn((...args) => ({ args })),
    where: jest.fn(),
  };

  return {
    getDocs: (...args) => mock.getDocs(...args),
    collection: (...args) => mock.collection(...args),
    query: (...args) => mock.query(...args),
    where: (...args) => mock.where(...args),
    __mock: mock,
  };
});

jest.mock('../../firebaseConfig', () => ({ db: {} }));

describe('SearchLineupsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFavorites = [];
  });

  it('shows empty state when no favorites are saved', async () => {
    const { findByText } = render(
      <SearchLineupsScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} />
    );

    expect(await findByText('No lineups saved yet')).toBeTruthy();
  });

  it('filters lineups by search query', async () => {
    mockFavorites = ['lineup-1'];
    const firestoreMocks = require('firebase/firestore').__mock;
    firestoreMocks.getDocs.mockResolvedValueOnce(
      createSnapshot([
        createDoc('lineup-1', {
          title: 'Dust2 Smoke',
          description: 'Window smoke',
          mapId: 'dust2',
          side: 'T',
          site: 'A',
          nadeType: 'Smoke',
          landImage: 'https://example.com/land.jpg',
        }),
      ])
    );

    const { findByText, getByPlaceholderText } = render(
      <SearchLineupsScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} />
    );

    expect(await findByText('Dust2 Smoke')).toBeTruthy();

    const input = getByPlaceholderText('Search my lineups');
    await act(async () => {
      fireEvent.changeText(input, 'inferno');
    });

    expect(await findByText('No results found')).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(input, 'dust2');
    });

    expect(await findByText('Dust2 Smoke')).toBeTruthy();
  });
});
