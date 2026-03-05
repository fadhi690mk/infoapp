# Infoapp – Promoter-style Mobile App

Expo (React Native) mobile app that replicates the **Promoter App** UI and workflow. Built from scratch with **NativeWind (Tailwind CSS)** and a clear, maintainable structure.

> **✅ Navigation Fix Applied:** The `MISSING_CONTEXT_ERROR` has been resolved. See [FIX_APPLIED.md](./FIX_APPLIED.md) for details.

## Structure

```
infoapp/
├── assets/           # Images and static assets (e.g. logo)
├── components/        # Reusable UI
│   ├── ui/            # Button, Card, Badge, Input, Label, Separator
│   ├── AppLayout.tsx  # Header + content layout
│   └── BottomNav.tsx  # Custom tab bar
├── screens/           # Login, Dashboard, Products, ProductDetails, My Sales, Earnings, Bank, Profile, Submit Sale
├── navigation/        # React Navigation (stack + bottom tabs)
├── services/          # API client (services/api.ts) + auth
├── contexts/          # AuthContext for login state
├── hooks/             # Custom hooks
├── utils/             # cn() and helpers
├── global.css         # Tailwind directives
├── tailwind.config.js # Theme (Promoter App colors)
├── babel.config.js    # NativeWind + Reanimated
├── metro.config.js    # NativeWind CSS input
└── App.tsx
```

## Design

- **Colors and radius** match the Promoter App (primary blue, secondary orange, success/warning/destructive, card/background/muted).
- **Layout**: gradient-style header with logo + title, rounded content panel, bottom tab bar (Home, Products, My Sales, Earnings, Bank, Profile).
- **Components**: reusable Button (variants/sizes), Card (Header/Title/Content/Footer), Badge, Input, Label, Separator.

## Quick Setup

```bash
# Run the setup script (installs dependencies and creates .env)
./setup.sh

# Or manually:
npm install
cp .env.example .env
```

## Running

```bash
# First time or after major changes - clear cache
npm run start:clear

# Normal start
npm start

# Platform-specific
npm run web      # Web browser
npm run android  # Android emulator/device
npm run ios      # iOS simulator/device (macOS only)
```

## Tech stack

- **Expo** (SDK 55)
- **React Navigation** (native stack + bottom tabs)
- **NativeWind** (Tailwind for React Native)
- **react-native-safe-area-context**, **react-native-reanimated**
- **lucide-react-native** for icons

## Backend API

The app connects to the **Infozerv promoter API** at `https://promoter-api.infozerv.com/api/v1` by default.

- **Env**: Set `EXPO_PUBLIC_API_URL` (no trailing slash) to override. Copy `.env.example` to `.env` and adjust.
- **Auth**: JWT Bearer. Login with promoter credentials; tokens are stored in AsyncStorage.
- **Endpoints used**: `/auth/token/`, `/promoters/me/`, `/promoters/campaigns/`, `/promoters/bank-accounts/`, `/promoters/submissions/`, `/ecom/products/`, `/ecom/orders/`, etc.

## Notes

- Login uses the same API as the Promoter web app; only users with role `promoter` can sign in.
- Dashboard loads promoter stats and campaigns; Products and Product Details load from ecom API; My Sales and Earnings use promoter orders and submissions.
- Edit Profile and Add Bank Account are placeholders (API exists; UI can be extended).
# infoapp
