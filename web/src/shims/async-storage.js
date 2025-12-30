const fallbackStore = (() => {
  const memory = new Map();
  return {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key),
    clear: () => memory.clear(),
    getAllKeys: () => Array.from(memory.keys()),
  };
})();

const backing = typeof window !== 'undefined' && window.localStorage ? window.localStorage : fallbackStore;

const AsyncStorage = {
  getItem: async (key) => backing.getItem(key),
  setItem: async (key, value) => {
    backing.setItem(key, value);
  },
  removeItem: async (key) => {
    backing.removeItem(key);
  },
  clear: async () => {
    backing.clear();
  },
  getAllKeys: async () => {
    return backing.getAllKeys ? backing.getAllKeys() : Object.keys(backing);
  },
  multiGet: async (keys = []) => Promise.all(keys.map(async (key) => [key, await AsyncStorage.getItem(key)])),
  multiSet: async (entries = []) => Promise.all(entries.map(([key, value]) => AsyncStorage.setItem(key, value))),
};

export { AsyncStorage };
export default AsyncStorage;
