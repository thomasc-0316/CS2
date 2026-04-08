import { getPerfMetrics, resetPerfMetrics } from '../../services/perfMonitor';
import { getDocs, onSnapshot } from '../../services/firestoreClient';

jest.mock('firebase/firestore', () => {
  const mock = {
    getDocs: jest.fn(),
    onSnapshot: jest.fn(),
  };

  return {
    getDocs: (...args) => mock.getDocs(...args),
    onSnapshot: (...args) => mock.onSnapshot(...args),
    __mock: mock,
  };
});

describe('firestoreClient instrumentation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPerfMetrics();
  });

  it('tracks getDocs network calls', async () => {
    const firestore = require('firebase/firestore').__mock;
    firestore.getDocs.mockResolvedValue({ docs: [] });

    await getDocs({ path: 'lineups/query' });

    const metrics = getPerfMetrics();
    expect(metrics.network.totalCalls).toBe(1);
    expect(metrics.network.byOperation['firestore.getDocs:lineups/query']).toBe(1);
  });

  it('tracks listener start/stop counts', () => {
    const firestore = require('firebase/firestore').__mock;
    const unsubscribe = jest.fn();
    firestore.onSnapshot.mockReturnValue(unsubscribe);

    const wrappedUnsubscribe = onSnapshot({ path: 'rooms/123456' }, jest.fn());

    let metrics = getPerfMetrics();
    expect(metrics.listeners.active).toBe(1);
    expect(metrics.listeners.maxActive).toBe(1);
    expect(metrics.listeners.totalStarted).toBe(1);

    wrappedUnsubscribe();

    metrics = getPerfMetrics();
    expect(metrics.listeners.active).toBe(0);
    expect(metrics.listeners.totalStopped).toBe(1);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
