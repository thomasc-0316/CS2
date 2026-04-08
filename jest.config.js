module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/apps/web/dist/'],
  transformIgnorePatterns: [
    'node_modules/(?!(expo|@expo|expo-modules-core|react-native|@react-native|@react-navigation|@react-native-async-storage|react-native-screens|react-native-safe-area-context|expo-image|expo-image-picker|expo-image-manipulator|expo-media-library|expo-auth-session|expo-web-browser)/)',
  ],
  collectCoverageFrom: [
    'components/**/*.{js,jsx}',
    'context/**/*.{js,jsx}',
    'hooks/**/*.{js,jsx}',
    'navigation/**/*.{js,jsx}',
    'screens/**/*.{js,jsx}',
    'services/**/*.{js,jsx}',
    'data/**/*.{js,jsx}',
    '!**/node_modules/**',
  ],
};
