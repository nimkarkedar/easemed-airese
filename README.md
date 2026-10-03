# Airese

React Native app (Expo, TypeScript, expo-router) for iOS and Android.

## Run it on your phone

```bash
npm install
npx expo start        # scan the QR code with your phone
```

## Live prototype

https://nimkarkedar.github.io/easemed-airese/ — rebuilt and published automatically on every push to `main` (see `.github/workflows/pages.yml`).

## Browser preview (iPhone 17 Pro frame)

```bash
npm run preview       # writes preview-dist/index.html
```

## Where things live

| Folder | What's in it |
| --- | --- |
| `src/theme/tokens.ts` | Design tokens: colours, spacing, corners, type. |
| `src/components/` | Shared parts: `AppText`, `Screen`, `Button`, `Card`. |
| `src/screens/` | One file per screen. |
| `src/app/` | Routes (expo-router). Thin files that point at screens. |
| `src/lib/` | Non-UI logic, e.g. `permissions.ts` (system prompts). `.web.ts` files are browser-preview stand-ins. |
| `preview/`, `scripts/` | Browser preview only. Not shipped in the app. |

## Rules

- Screens use tokens and components only. No hard-coded colours or font sizes.
- Keep the design system small. Add a token or component only when a screen needs it.
- Copy and visuals follow the brand brief in [docs/BRAND.md](docs/BRAND.md): plain, factual, calm, useful; dark night UI with one warm light.
