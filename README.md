# Airese

React Native app (Expo, TypeScript, expo-router) for iOS and Android.

## Run it on your phone

```bash
npm install
npx expo start        # scan the QR code with your phone
```

## Live prototype and docs

- **Prototype:** https://nimkarkedar.github.io/easemed-airese/ (rebuilt and published on every push to `main`, see `.github/workflows/pages.yml`)
- **Design system (visual):** https://nimkarkedar.github.io/easemed-airese/design-system/ (generated from the code)
- **Design system (reference):** [design-system/README.md](design-system/README.md)
- **Product:** [docs/PRD.md](docs/PRD.md) · **Brand, voice and tone:** [docs/BRAND.md](docs/BRAND.md) · **Recording rules:** [docs/RECORDING.md](docs/RECORDING.md)

## Browser preview (iPhone 17 Pro frame)

```bash
npm run preview       # writes preview-dist/index.html
```

## Where things live

| Folder | What's in it |
| --- | --- |
| `src/theme/tokens.ts`, `src/theme/motion.ts` | Design tokens (colours, `alpha()`, spacing, corners, type) and motion presets. |
| `src/components/` | The component library (`AppText`, `Button`, `DetailPage`, `VerdictCard`, `MonthCalendar`…), all exported from `index.ts`. |
| `src/screens/` | One file per screen. |
| `src/app/` | Routes (expo-router). Thin files that point at screens. |
| `src/lib/` | Non-UI logic, e.g. `permissions.ts` (system prompts). `.web.ts` files are browser-preview stand-ins. |
| `preview/`, `scripts/` | Browser preview and the design system page builder. Not shipped in the app. |

## Rules

- Screens use tokens and components only. No hard-coded colours, font sizes, timings or curves; tints are `alpha(colors.x, n)`.
- Keep the design system small. Add a token or component only when a screen needs it.
- Copy and visuals follow the brand brief in [docs/BRAND.md](docs/BRAND.md): plain, factual, calm, useful; dark night UI with one warm light.
