import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearMemoryCache,
  fetchDeduped,
  readMemoryCache,
  readPersistentCache,
  writeMemoryCache,
  writePersistentCache,
} from '../../services/dataCache';

describe('dataCache', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    clearMemoryCache();
    await AsyncStorage.clear();
  });

  it('expires memory cache entries based on TTL', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    writeMemoryCache('lineups:dust2', [{ id: '1' }], 1000);

    const fresh = readMemoryCache('lineups:dust2');
    expect(fresh.exists).toBe(true);
    expect(fresh.isExpired).toBe(false);

    jest.setSystemTime(new Date('2026-01-01T00:00:02.000Z'));
    const stale = readMemoryCache('lineups:dust2');
    expect(stale.exists).toBe(true);
    expect(stale.isExpired).toBe(true);
    jest.useRealTimers();
  });

  it('deduplicates in-flight requests for the same key', async () => {
    const fetcher = jest.fn(async () => {
      return ['payload'];
    });

    const [first, second] = await Promise.all([
      fetchDeduped('same-key', fetcher),
      fetchDeduped('same-key', fetcher),
    ]);

    expect(first).toEqual(['payload']);
    expect(second).toEqual(['payload']);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('reads and writes persistent cache entries', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    await writePersistentCache('hot-lineups', [{ id: '1' }], 5000);

    const persisted = await readPersistentCache('hot-lineups');
    expect(persisted.exists).toBe(true);
    expect(persisted.isExpired).toBe(false);
    expect(persisted.value).toEqual([{ id: '1' }]);
    jest.useRealTimers();
  });
});
