type StoreValue = string | null;
type StorageLike = Storage & { getAllKeys?: () => string[] };

const fallbackStore = (() => {
  const memory = new Map<string, string>();
  return {
    getItem: (key: string): StoreValue => (memory.has(key) ? memory.get(key)! : null),
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
    clear: () => {
      memory.clear();
    },
    getAllKeys: () => Array.from(memory.keys()),
  };
})();

const backing: StorageLike | typeof fallbackStore =
  typeof window !== 'undefined' && window.localStorage ? (window.localStorage as StorageLike) : fallbackStore;

const AsyncStorage = {
  getItem: async (key: string): Promise<StoreValue> => backing.getItem(key),
  setItem: async (key: string, value: string) => {
    backing.setItem(key, value);
  },
  removeItem: async (key: string) => {
    backing.removeItem(key);
  },
  clear: async () => {
    backing.clear();
  },
  getAllKeys: async (): Promise<string[]> =>
    backing.getAllKeys ? backing.getAllKeys() : Object.keys(backing as Record<string, string>),
  multiGet: async (keys: string[] = []) =>
    Promise.all(keys.map(async (key) => [key, await AsyncStorage.getItem(key)] as const)),
  multiSet: async (entries: [string, string][] = []) =>
    Promise.all(entries.map(([key, value]) => AsyncStorage.setItem(key, value))),
};

export { AsyncStorage };
export default AsyncStorage;
