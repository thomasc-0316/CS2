import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { transform } from 'esbuild';

const sharedDeps = [
  path.resolve(__dirname, '../..', 'context/AuthContext.js'),
  path.resolve(__dirname, '../..', 'context/TacticsContext.js'),
  path.resolve(__dirname, '../..', 'context/UpvoteContext.js'),
  path.resolve(__dirname, '../..', 'context/FavoritesContext.js'),
  path.resolve(__dirname, '../..', 'context/TacticLibraryContext.js'),
  path.resolve(__dirname, '../..', 'context/DraftsContext.js'),
  path.resolve(__dirname, '../..', 'context/ProfileContext.js'),
  path.resolve(__dirname, '../..', 'context/CommentsContext.js'),
  path.resolve(__dirname, '../..', 'context/FollowContext.js'),
  path.resolve(__dirname, '../..', 'services/lineupService.js'),
  path.resolve(__dirname, '../..', 'services/tacticService.js'),
  path.resolve(__dirname, '../..', 'services/postService.js'),
  path.resolve(__dirname, '../..', 'data/maps.js'),
];

export default defineConfig({
  plugins: [
    {
      name: 'shared-jsx-transform',
      async transform(code, id) {
        if (sharedDeps.some((dep) => id.startsWith(dep.replace(/\.js$/, ''))) || id.includes('/context/') || id.includes('/services/') || id.includes('/data/')) {
          const result = await transform(code, { loader: 'tsx', jsx: 'automatic', sourcemap: false });
          return { code: result.code, map: null };
        }
        return null;
      },
    },
    react({
      include: [/\.jsx?$/, /\.tsx?$/],
    }),
  ],
  resolve: {
    alias: [
      {
        find: 'react-native/Libraries/Utilities/codegenNativeComponent',
        replacement: path.resolve(__dirname, './src/shims/codegenNativeComponent'),
      },
      {
        find: 'react-native-web/Libraries/Utilities/codegenNativeComponent',
        replacement: path.resolve(__dirname, './src/shims/codegenNativeComponent'),
      },
      {
        find: 'react-native/Libraries/Animated/NativeAnimatedHelper',
        replacement: path.resolve(__dirname, './src/shims/NativeAnimatedHelper'),
      },
      {
        find: 'react-native-web/Libraries/Animated/NativeAnimatedHelper',
        replacement: path.resolve(__dirname, './src/shims/NativeAnimatedHelper'),
      },
      { find: 'react-native$', replacement: 'react-native-web' },
      { find: 'react-native', replacement: 'react-native-web' },
      { find: '@react-native-async-storage/async-storage', replacement: path.resolve(__dirname, './src/shims/async-storage') },
      { find: 'expo-image', replacement: path.resolve(__dirname, './src/shims/expo-image') },
      { find: 'expo-asset', replacement: path.resolve(__dirname, './src/shims/expo-asset') },
      { find: 'expo-image-picker', replacement: path.resolve(__dirname, './src/shims/expo-image-picker') },
      { find: 'expo-media-library', replacement: path.resolve(__dirname, './src/shims/expo-media-library') },
      { find: 'expo-image-manipulator', replacement: path.resolve(__dirname, './src/shims/expo-image-manipulator') },
      {
        find: 'expo-auth-session/providers/google',
        replacement: path.resolve(__dirname, './src/shims/expo-auth-session-providers-google'),
      },
      { find: 'expo-auth-session', replacement: path.resolve(__dirname, './src/shims/expo-auth-session') },
      { find: 'expo-web-browser', replacement: path.resolve(__dirname, './src/shims/expo-web-browser') },
      { find: '@expo/vector-icons', replacement: path.resolve(__dirname, './src/shims/expo-vector-icons') },
      { find: '@react-native-seoul/masonry-list', replacement: path.resolve(__dirname, './src/shims/masonry-list') },
      { find: 'react-native-image-viewing', replacement: path.resolve(__dirname, './src/shims/react-native-image-viewing') },
      { find: 'expo-modules-core', replacement: path.resolve(__dirname, './src/shims/expo-modules-core') },
      { find: '@ctx', replacement: `/@fs/${path.resolve(__dirname, '../..', 'context')}` },
      { find: '@services', replacement: `/@fs/${path.resolve(__dirname, '../..', 'services')}` },
      { find: '@data', replacement: `/@fs/${path.resolve(__dirname, '../..', 'data')}` },
      {
        // Redirect shared firebaseConfig imports to a web-safe version (avoids native persistence import)
        find: /^(.*\/)?firebaseConfig(\.js)?$/,
        replacement: path.resolve(__dirname, './src/shims/firebaseConfig.web.ts'),
      },
    ],
    extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.jsx', '.js', '.json'],
    dedupe: ['react', 'react-dom', 'react-native-web', 'react-native-safe-area-context'],
  },
  server: {
    fs: {
      allow: ['..', '../../'],
    },
  },
  optimizeDeps: {
    noDiscovery: true,
    include: ['react', 'react-dom', 'react-native-web'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
      jsx: 'automatic',
      resolveExtensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
      alias: {
        'react-native-web/Libraries/Utilities/codegenNativeComponent': path.resolve(
          __dirname,
          './src/shims/codegenNativeComponent',
        ),
        'react-native-web/Libraries/Utilities/codegenNativeComponent.js': path.resolve(
          __dirname,
          './src/shims/codegenNativeComponent',
        ),
        'react-native-web/Libraries/Animated/NativeAnimatedHelper': path.resolve(
          __dirname,
          './src/shims/NativeAnimatedHelper',
        ),
        'react-native-web/Libraries/Animated/NativeAnimatedHelper.js': path.resolve(
          __dirname,
          './src/shims/NativeAnimatedHelper',
        ),
      },
    },
  },
});
