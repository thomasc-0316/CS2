import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        presets: ['nativewind/babel'],
      },
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-native-web', 'react-native-safe-area-context'],
    extensions: ['.web.js', '.web.jsx', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.json'],
    alias: [
      { find: 'react', replacement: path.resolve(__dirname, './node_modules/react') },
      { find: 'react-dom', replacement: path.resolve(__dirname, './node_modules/react-dom') },
      {
        find: /^react-native$/,
        replacement: path.resolve(__dirname, './node_modules/react-native-web/dist/index.js'),
      },
      { find: 'expo-image', replacement: path.resolve(__dirname, './src/shims/expo-image.js') },
      { find: 'expo-asset', replacement: path.resolve(__dirname, './src/shims/expo-asset.js') },
      { find: 'expo-image-picker', replacement: path.resolve(__dirname, './src/shims/expo-image-picker.js') },
      { find: 'expo-media-library', replacement: path.resolve(__dirname, './src/shims/expo-media-library.js') },
      { find: 'expo-image-manipulator', replacement: path.resolve(__dirname, './src/shims/expo-image-manipulator.js') },
      {
        find: 'expo-auth-session/providers/google',
        replacement: path.resolve(__dirname, './src/shims/expo-auth-session-providers-google.js'),
      },
      { find: 'expo-auth-session', replacement: path.resolve(__dirname, './src/shims/expo-auth-session.js') },
      { find: 'expo-web-browser', replacement: path.resolve(__dirname, './src/shims/expo-web-browser.js') },
      {
        find: '@react-native-async-storage/async-storage',
        replacement: path.resolve(__dirname, './src/shims/async-storage.js'),
      },
      { find: '@expo/vector-icons', replacement: path.resolve(__dirname, './src/shims/expo-vector-icons.js') },
      {
        find: 'react-native-css-interop/jsx-runtime',
        replacement: path.resolve(__dirname, './node_modules/react-native-css-interop/dist/runtime/jsx-runtime.js'),
      },
      {
        find: 'react-native-css-interop/jsx-dev-runtime',
        replacement: path.resolve(
          __dirname,
          './node_modules/react-native-css-interop/dist/runtime/jsx-dev-runtime.js'
        ),
      },
      {
        find: /nativewind[/\\]dist[/\\]doctor/,
        replacement: path.resolve(__dirname, './src/shims/nativewind-doctor.js'),
      },
      {
        find: /react-native-css-interop[/\\]dist[/\\]doctor/,
        replacement: path.resolve(__dirname, './src/shims/nativewind-doctor.js'),
      },
      {
        find: '@react-native-seoul/masonry-list',
        replacement: path.resolve(__dirname, './src/shims/masonry-list.js'),
      },
      {
        find: 'react-native-image-viewing',
        replacement: path.resolve(__dirname, './src/shims/react-native-image-viewing.js'),
      },
      {
        find: 'expo-modules-core',
        replacement: path.resolve(__dirname, './src/shims/expo-modules-core.js'),
      },
      {
        find: 'react-native/Libraries/Animated/NativeAnimatedHelper',
        replacement: path.resolve(__dirname, './src/shims/NativeAnimatedHelper.js'),
      },
      {
        find: 'react-native/Libraries/Utilities/codegenNativeComponent',
        replacement: path.resolve(__dirname, './src/shims/codegenNativeComponent.js'),
      },
    ],
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
  optimizeDeps: {
    include: ['react-native-web'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
      jsx: 'automatic',
      resolveExtensions: ['.web.js', '.js', '.jsx', '.mjs', '.ts', '.tsx', '.json'],
      mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
    },
    force: true,
    dedupe: ['react', 'react-dom', 'react-native-web', 'react-native-safe-area-context'],
  },
});
