import AsyncStorage from '@react-native-async-storage/async-storage';

const memoryCache = new Map();
const inflightRequests = new Map();
const STORAGE_PREFIX = 'data_cache_v1:';

const cacheEnabled = () => process.env.DISABLE_PERF_CACHE !== '1';

const buildEntry = (value, ttlMs) => {
  const now = Date.now();
  return {
    value,
    updatedAt: now,
    expiresAt: now + ttlMs,
  };
};

const isExpired = (entry) => {
  if (!entry) return true;
  return entry.expiresAt <= Date.now();
};

export const readMemoryCache = (key) => {
  if (!cacheEnabled()) return { exists: false, isExpired: true, value: null };
  const entry = memoryCache.get(key);
  if (!entry) return { exists: false, isExpired: true, value: null };
  return {
    exists: true,
    isExpired: isExpired(entry),
    value: entry.value,
    updatedAt: entry.updatedAt,
    expiresAt: entry.expiresAt,
  };
};

export const writeMemoryCache = (key, value, ttlMs) => {
  if (!cacheEnabled()) return;
  memoryCache.set(key, buildEntry(value, ttlMs));
};

export const readPersistentCache = async (key) => {
  if (!cacheEnabled()) return { exists: false, isExpired: true, value: null };
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return { exists: false, isExpired: true, value: null };
    const entry = JSON.parse(raw);
    return {
      exists: true,
      isExpired: isExpired(entry),
      value: entry.value,
      updatedAt: entry.updatedAt,
      expiresAt: entry.expiresAt,
    };
  } catch (error) {
    return { exists: false, isExpired: true, value: null };
  }
};

export const writePersistentCache = async (key, value, ttlMs) => {
  if (!cacheEnabled()) return;
  try {
    const entry = buildEntry(value, ttlMs);
    await AsyncStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (error) {
    // Non-fatal cache writes should not impact user flows.
  }
};

export const fetchDeduped = async (key, fetcher) => {
  if (!cacheEnabled()) {
    return fetcher();
  }
  if (inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  const task = Promise.resolve()
    .then(fetcher)
    .finally(() => {
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, task);
  return task;
};

export const clearMemoryCache = (prefix = '') => {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  Array.from(memoryCache.keys()).forEach((key) => {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  });
};
