import React from 'react';
import { act, render } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen';
import LineupGridScreen from '../../screens/LineupGridScreen';
import RoomScreen from '../../screens/RoomScreen';
import { getPerfMetrics, resetPerfMetrics } from '../../services/perfMonitor';

const createDoc = (id, data) => ({ id, data: () => data });
const createSnapshot = (docs) => ({
  docs,
  forEach: (cb) => docs.forEach(cb),
});

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

let mockFollowing = [];
let mockTacticsContext = null;
const mockFetchPublicTactics = jest.fn();
const mockFetchUserTactics = jest.fn();

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: (effect) => {
      React.useEffect(effect, [effect]);
    },
  };
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

jest.mock('../../context/FollowContext', () => ({
  useFollow: () => ({
    getFollowing: () => mockFollowing,
    isFollowing: jest.fn(),
    followUser: jest.fn(),
    unfollowUser: jest.fn(),
    getFollowingCount: () => mockFollowing.length,
    getFollowersCount: () => 0,
  }),
}));

jest.mock('../../context/UpvoteContext', () => ({
  useUpvotes: () => ({
    getUpvoteCount: () => 0,
  }),
}));

jest.mock('../../context/TacticsContext', () => ({
  useTactics: () => mockTacticsContext,
}));

jest.mock('../../services/tacticService', () => ({
  fetchPublicTactics: (...args) => mockFetchPublicTactics(...args),
  fetchUserTactics: (...args) => mockFetchUserTactics(...args),
}));

jest.mock('../../firebaseConfig', () => ({ db: {} }));

jest.mock('firebase/firestore', () => {
  const mock = {
    getDocs: jest.fn(),
    getDoc: jest.fn(),
    collection: jest.fn((...parts) => ({ path: parts.filter(Boolean).join('/') })),
    query: jest.fn((target) => ({ path: target?.path || 'query' })),
    where: jest.fn((...args) => ({ type: 'where', args })),
    orderBy: jest.fn((...args) => ({ type: 'orderBy', args })),
    limit: jest.fn((...args) => ({ type: 'limit', args })),
    onSnapshot: jest.fn(),
    doc: jest.fn((...parts) => ({ path: parts.filter(Boolean).join('/') })),
    runTransaction: jest.fn(),
    updateDoc: jest.fn(),
    setDoc: jest.fn(),
    addDoc: jest.fn(),
    deleteDoc: jest.fn(),
  };

  return {
    getDocs: (...args) => mock.getDocs(...args),
    getDoc: (...args) => mock.getDoc(...args),
    collection: (...args) => mock.collection(...args),
    query: (...args) => mock.query(...args),
    where: (...args) => mock.where(...args),
    orderBy: (...args) => mock.orderBy(...args),
    limit: (...args) => mock.limit(...args),
    onSnapshot: (...args) => mock.onSnapshot(...args),
    doc: (...args) => mock.doc(...args),
    runTransaction: (...args) => mock.runTransaction(...args),
    updateDoc: (...args) => mock.updateDoc(...args),
    setDoc: (...args) => mock.setDoc(...args),
    addDoc: (...args) => mock.addDoc(...args),
    deleteDoc: (...args) => mock.deleteDoc(...args),
    __mock: mock,
  };
});

const extractTraceSummary = (metrics, screenName) => {
  const trace = metrics.completedTraces.find((entry) => entry.screen === screenName);
  if (!trace) {
    throw new Error(`Missing trace for ${screenName}`);
  }
  return {
    firstContentMs: Number((trace.firstContentMs || 0).toFixed(2)),
    dataReadyMs: Number((trace.dataReadyMs || 0).toFixed(2)),
    renders: metrics.renderCounts[screenName] || 0,
    networkCalls: metrics.network.totalCalls,
    maxActiveListeners: metrics.listeners.maxActive,
  };
};

describe('Perf baseline instrumentation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPerfMetrics();
    mockFollowing = [];
    mockTacticsContext = {
      user: { uid: 'user-1' },
      room: null,
      roomCode: '',
      isIGL: false,
      loading: false,
      error: '',
      createRoom: jest.fn(),
      joinRoom: jest.fn(),
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
    };
    mockFetchPublicTactics.mockResolvedValue([]);
    mockFetchUserTactics.mockResolvedValue([]);
  });

  it('captures baseline metrics for core transitions', async () => {
    const firestoreMock = require('firebase/firestore').__mock;

    const baseline = {};

    const homeNavigation = { navigate: jest.fn(), setParams: jest.fn() };
    const home = render(
      <HomeScreen navigation={homeNavigation} route={{ params: {} }} />,
    );
    await act(async () => {
      await flushPromises();
    });
    home.unmount();
    baseline.appLaunchToHome = extractTraceSummary(getPerfMetrics(), 'HomeScreen');

    resetPerfMetrics();
    firestoreMock.getDocs.mockResolvedValueOnce(
      createSnapshot([
        createDoc('lineup-1', {
          title: 'Window Smoke',
          description: 'Fast smoke',
          side: 'T',
          site: 'A',
          nadeType: 'Smoke',
          mapId: 'dust2',
          uploadedAt: { toDate: () => new Date('2025-01-01T10:00:00Z') },
          landImage: 'https://example.com/lineup-1.jpg',
        }),
      ]),
    );
    const lineupGrid = render(
      <LineupGridScreen
        navigation={{ navigate: jest.fn(), setOptions: jest.fn() }}
        route={{ params: { map: { id: 'dust2', name: 'Dust II' } } }}
      />,
    );
    await lineupGrid.findByText('Window Smoke');
    lineupGrid.unmount();
    baseline.homeToCoreFeature = extractTraceSummary(getPerfMetrics(), 'LineupGridScreen');

    resetPerfMetrics();
    firestoreMock.getDocs.mockResolvedValueOnce(
      createSnapshot([
        createDoc('lineup-1', {
          title: 'Entry Smoke',
          side: 'T',
          site: 'A',
          nadeType: 'Smoke',
          landImage: 'https://example.com/entry.jpg',
          standImage: 'https://example.com/stand.jpg',
          aimImage: 'https://example.com/aim.jpg',
        }),
      ]),
    );
    mockFetchPublicTactics.mockResolvedValueOnce([
      {
        id: 'tactic-1',
        title: 'A Fast Split',
        description: 'Explode through short and long',
        side: 'T',
        lineupIds: ['lineup-1'],
      },
    ]);
    mockFetchUserTactics.mockResolvedValueOnce([]);
    mockTacticsContext = {
      ...mockTacticsContext,
      roomCode: '123456',
      isIGL: true,
      room: {
        code: '123456',
        mapId: 'dust2',
        phase: 'TACTIC_VOTE',
        side: 'T',
        players: [{ uid: 'user-1', username: 'IGL' }],
        tacticSource: 'default',
        tacticVotes: {},
        grenadeSelections: {},
      },
    };

    const room = render(<RoomScreen />);
    await room.findByText('A Fast Split');
    room.unmount();
    baseline.lobbyJoinFlow = extractTraceSummary(getPerfMetrics(), 'RoomScreen');

    expect(baseline.appLaunchToHome.dataReadyMs).toBeGreaterThanOrEqual(0);
    expect(baseline.homeToCoreFeature.networkCalls).toBeGreaterThan(0);
    expect(baseline.lobbyJoinFlow.networkCalls).toBeGreaterThan(0);

    // Useful when collecting before/after values for PERF_BASELINE.md
    // eslint-disable-next-line no-console
    console.log('PERF_BASELINE_METRICS', JSON.stringify(baseline));
  });
});
