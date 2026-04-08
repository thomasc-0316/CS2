import React from 'react';
import { render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LineupGridScreen from '../../screens/LineupGridScreen';
import HotScreen from '../../screens/HotScreen';
import { getPerfMetrics, resetPerfMetrics } from '../../services/perfMonitor';
import { clearMemoryCache } from '../../services/dataCache';

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
          <React.Fragment key={keyExtractor ? keyExtractor(item, index) : index}>
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

jest.mock('../../firebaseConfig', () => ({ db: {} }));

jest.mock('firebase/firestore', () => {
  const mock = {
    getDocs: jest.fn(),
    collection: jest.fn((...parts) => ({ path: parts.filter(Boolean).join('/') })),
    query: jest.fn((target) => ({ path: target?.path || 'query' })),
    where: jest.fn((...args) => ({ type: 'where', args })),
    orderBy: jest.fn((...args) => ({ type: 'orderBy', args })),
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

const extractLatestTrace = (metrics, screenName) => {
  const traces = metrics.completedTraces.filter((trace) => trace.screen === screenName);
  return traces[traces.length - 1] || null;
};

const runLineupTwice = async ({ disableCache }) => {
  process.env.DISABLE_PERF_CACHE = disableCache ? '1' : '0';
  clearMemoryCache();
  await AsyncStorage.clear();
  const firestoreMock = require('firebase/firestore').__mock;
  firestoreMock.getDocs.mockReset();
  firestoreMock.getDocs.mockResolvedValue(
    createSnapshot([
      createDoc('lineup-1', {
        title: 'Cache Test Lineup',
        side: 'T',
        site: 'A',
        nadeType: 'Smoke',
        mapId: 'dust2',
        uploadedAt: { toDate: () => new Date('2025-01-01T10:00:00Z') },
        landImage: 'https://example.com/lineup-1.jpg',
      }),
    ]),
  );

  resetPerfMetrics();
  const first = render(
    <LineupGridScreen
      navigation={{ navigate: jest.fn(), setOptions: jest.fn() }}
      route={{ params: { map: { id: 'dust2', name: 'Dust II' } } }}
    />,
  );
  await first.findByText('Cache Test Lineup');
  first.unmount();

  const second = render(
    <LineupGridScreen
      navigation={{ navigate: jest.fn(), setOptions: jest.fn() }}
      route={{ params: { map: { id: 'dust2', name: 'Dust II' } } }}
    />,
  );
  await second.findByText('Cache Test Lineup');
  second.unmount();

  const metrics = getPerfMetrics();
  const latestTrace = extractLatestTrace(metrics, 'LineupGridScreen');
  return {
    dbCalls: metrics.network.totalCalls,
    secondVisitDataReadyMs: Number((latestTrace?.dataReadyMs || 0).toFixed(2)),
  };
};

const runHotTwice = async ({ disableCache }) => {
  process.env.DISABLE_PERF_CACHE = disableCache ? '1' : '0';
  clearMemoryCache();
  await AsyncStorage.clear();
  const firestoreMock = require('firebase/firestore').__mock;
  firestoreMock.getDocs.mockReset();
  firestoreMock.getDocs.mockResolvedValue(
    createSnapshot([
      createDoc('hot-1', {
        title: 'Cache Test Hot',
        uploadedAt: { toDate: () => new Date() },
        landImage: 'https://example.com/hot.jpg',
      }),
    ]),
  );

  resetPerfMetrics();
  const first = render(<HotScreen navigation={{ navigate: jest.fn() }} />);
  await first.findByText('Cache Test Hot');
  first.unmount();

  const second = render(<HotScreen navigation={{ navigate: jest.fn() }} />);
  await second.findByText('Cache Test Hot');
  second.unmount();

  const metrics = getPerfMetrics();
  const latestTrace = extractLatestTrace(metrics, 'HotScreen');
  return {
    dbCalls: metrics.network.totalCalls,
    secondVisitDataReadyMs: Number((latestTrace?.dataReadyMs || 0).toFixed(2)),
  };
};

describe('Perf optimization metrics', () => {
  afterAll(() => {
    delete process.env.DISABLE_PERF_CACHE;
  });

  it('reduces DB calls on repeated list-screen visits with cache enabled', async () => {
    const beforeLineup = await runLineupTwice({ disableCache: true });
    const afterLineup = await runLineupTwice({ disableCache: false });

    const beforeHot = await runHotTwice({ disableCache: true });
    const afterHot = await runHotTwice({ disableCache: false });

    expect(beforeLineup.dbCalls).toBeGreaterThan(afterLineup.dbCalls);
    expect(beforeHot.dbCalls).toBeGreaterThan(afterHot.dbCalls);

    // eslint-disable-next-line no-console
    console.log(
      'PERF_OPTIMIZATION_METRICS',
      JSON.stringify({
        lineupGridRepeat: { before: beforeLineup, after: afterLineup },
        hotRepeat: { before: beforeHot, after: afterHot },
      }),
    );
  });
});
