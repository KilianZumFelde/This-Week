// Jest setup for the Expo (SDK 55) app — React Native Testing Library.
// Add module mocks here as component tests need them.

// AsyncStorage — required when any module imports @supabase/supabase-js (which uses it for auth persistence)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// @expo/vector-icons: stubbed via app/__mocks__/@expo/vector-icons.js (avoids factory-scope issue with NativeWind's babel transform)
