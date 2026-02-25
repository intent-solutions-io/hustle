/**
 * Integration Test Setup
 *
 * Validates that Firebase Emulators are running before tests execute.
 * Fails fast with a helpful error message if emulators are not available.
 */

const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST;
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (!FIRESTORE_HOST) {
  throw new Error(
    'FIRESTORE_EMULATOR_HOST is not set.\n\n' +
    'Integration tests require Firebase Emulators. Run one of:\n' +
    '  1. firebase emulators:start --only auth,firestore   (in another terminal)\n' +
    '  2. npm run test:integration:emulator                (starts emulators automatically)\n'
  );
}

if (!AUTH_HOST) {
  throw new Error(
    'FIREBASE_AUTH_EMULATOR_HOST is not set.\n\n' +
    'Integration tests require Firebase Emulators. Run one of:\n' +
    '  1. firebase emulators:start --only auth,firestore   (in another terminal)\n' +
    '  2. npm run test:integration:emulator                (starts emulators automatically)\n'
  );
}

// Set project ID for emulator mode
if (!process.env.FIREBASE_PROJECT_ID) {
  process.env.FIREBASE_PROJECT_ID = 'hustle-test';
}
