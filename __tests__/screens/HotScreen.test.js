import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HotScreen from '../../screens/HotScreen';

const createDoc = (id, data) => ({ id, data: () => data });
const createSnapshot = (docs) => ({
  docs,
  forEach: (cb) => docs.forEach(cb),
});

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

jest.mock('../../context/UpvoteContext', () => ({
  useUpvotes: () => ({
    getUpvoteCount: () => 0,
  }),
}));

jest.mock('firebase/firestore', () => {
  const mock = {
    getDocs: jest.fn(),
    collection: jest.fn(),
    query: jest.fn((...args) => ({ args })),
    where: jest.fn(),
    orderBy: jest.fn(),
  };

  return {
    getDocs: (...args) => mock.getDocs(...args),
    collection: (...args) => mock.collection(...args),
    query: (...args) => mock.query(...args),
    where: (...args) => mock.where(...args),
    orderBy: (...args) => mock.orderBy(...args),
    __mock: mock,
  };
});

jest.mock('../../firebaseConfig', () => ({ db: {} }));

describe('HotScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters lineups by time window', async () => {
    const now = new Date('2025-01-10T12:00:00Z');
    jest.useFakeTimers().setSystemTime(now);

    const firestoreMocks = require('firebase/firestore').__mock;
    firestoreMocks.getDocs.mockResolvedValueOnce(
      createSnapshot([
        createDoc('recent', {
          title: 'Recent Smoke',
          uploadedAt: { toDate: () => new Date('2025-01-10T10:00:00Z') },
          landImage: 'https://example.com/land.jpg',
        }),
        createDoc('old', {
          title: 'Old Smoke',
          uploadedAt: { toDate: () => new Date('2024-12-25T10:00:00Z') },
          landImage: 'https://example.com/land2.jpg',
        }),
      ])
    );

    const { findByText, queryByText, getByText } = render(
      <HotScreen navigation={{ navigate: jest.fn() }} />
    );

    expect(await findByText('Recent Smoke')).toBeTruthy();
    expect(queryByText('Old Smoke')).toBeNull();

    fireEvent.press(getByText('This Month'));

    expect(await findByText('Old Smoke')).toBeTruthy();

    jest.useRealTimers();
  });
});
