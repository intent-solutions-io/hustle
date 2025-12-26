# Hustle Stats Mobile App

React Native mobile application for tracking youth soccer statistics, built with Expo SDK 54.

**Bundle ID:** `io.hustlestats.app`
**Deep Link:** `hustlestats://`
**Platforms:** iOS, Android

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and add Firebase credentials
cp .env.example .env

# Start development server
npx expo start

# Run on iOS Simulator
npx expo start --ios

# Run on Android Emulator
npx expo start --android
```

## Project Structure

```
mobile/
├── app/                          # Expo Router screens (file-based routing)
│   ├── (auth)/                   # Auth group (unauthenticated users)
│   │   ├── _layout.tsx           # Auth stack navigator
│   │   ├── login.tsx             # Login screen
│   │   ├── register.tsx          # Registration (COPPA compliant)
│   │   └── forgot-password.tsx   # Password reset
│   ├── (tabs)/                   # Tab group (authenticated users)
│   │   ├── _layout.tsx           # Tab bar navigator
│   │   ├── index.tsx             # Dashboard/Home
│   │   ├── players.tsx           # Players list
│   │   ├── stats.tsx             # Statistics view
│   │   └── settings.tsx          # User settings
│   ├── player/
│   │   └── [id].tsx              # Player detail (dynamic route)
│   ├── game/
│   │   └── new.tsx               # Game logging form
│   ├── _layout.tsx               # Root layout with providers
│   └── index.tsx                 # Entry redirect
├── src/
│   ├── lib/firebase/             # Firebase services
│   │   ├── config.ts             # Firebase initialization
│   │   ├── auth.ts               # Authentication service
│   │   ├── players.ts            # Player CRUD operations
│   │   ├── games.ts              # Game CRUD + stats calculation
│   │   └── index.ts              # Re-exports
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts            # Auth state hook
│   │   ├── usePlayers.ts         # React Query player hooks
│   │   ├── useGames.ts           # React Query game hooks
│   │   └── index.ts              # Re-exports
│   ├── store/                    # Zustand stores
│   │   └── auth.ts               # Auth state management
│   └── types/                    # TypeScript definitions
│       └── index.ts              # All types (94% reuse from Next.js)
├── assets/                       # App icons and images
│   ├── icon.png                  # App Store icon (1024x1024)
│   ├── adaptive-icon.png         # Android adaptive icon
│   ├── splash-icon.png           # Splash screen icon
│   └── favicon.png               # Web favicon
├── app.json                      # Expo configuration
├── eas.json                      # EAS Build configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 54 |
| Navigation | Expo Router (file-based) |
| Language | TypeScript |
| Backend | Firebase (Auth + Firestore) |
| Server State | React Query (@tanstack/react-query) |
| Client State | Zustand |
| Forms | React Hook Form + Zod |
| Icons | Lucide React Native |

## Environment Variables

Create a `.env` file in the mobile directory:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Firebase Data Model

```
/users/{userId}
  - firstName, lastName, email
  - agreedToTerms, agreedToPrivacy, isParentGuardian
  - createdAt, updatedAt

/users/{userId}/players/{playerId}
  - name, teamClub, primaryPosition, leagueCode
  - gender, birthday
  - createdAt, updatedAt

/users/{userId}/players/{playerId}/games/{gameId}
  - date, opponent, result (Win/Loss/Draw)
  - finalScore, goals, assists, minutesPlayed
  - createdAt
```

## Building for Production

### Prerequisites
- EAS CLI: `npm install -g eas-cli`
- Expo account: `eas login`

### Build Commands

```bash
# Development build (includes dev tools)
eas build --platform all --profile development

# Preview build (internal testing)
eas build --platform all --profile preview

# Production build (app store submission)
eas build --platform all --profile production
```

### Submit to App Stores

```bash
# Submit latest build to both stores
eas submit --platform all --latest

# iOS only
eas submit --platform ios --latest

# Android only
eas submit --platform android --latest
```

## Development

### Type Checking
```bash
npx tsc --noEmit
```

### Expo Doctor
```bash
npx expo-doctor
```

### Clear Cache
```bash
npx expo start --clear
```

## Features

### Authentication
- Email/password sign up and sign in
- Password reset via email
- COPPA compliance (parent/guardian verification)
- Persistent auth state (survives app restart)

### Player Management
- Add players with name, team, position, league
- View player profiles and statistics
- Delete players (long press)

### Game Logging
- Log game results (Win/Loss/Draw)
- Track scores and individual stats
- Goals, assists, minutes played

### Statistics
- Per-player analytics
- Win rate calculation
- Goals/assists per game
- Season record (W-D-L)
- Minutes played tracking

## License

Copyright 2025 Intent Solutions IO. All rights reserved.
