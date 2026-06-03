# Assets

Drop the following image assets here before building (referenced by `app.json`):

| File | Size | Purpose |
|------|------|---------|
| `icon.png` | 1024×1024 | App icon |
| `splash.png` | 1284×2778 | Splash screen (dark bg `#0B0B0F`) |
| `adaptive-icon.png` | 1024×1024 | Android adaptive foreground |
| `notification-icon.png` | 96×96 (white, transparent) | Android notification icon |

Until added, `expo start` will warn but still run in Expo Go. Generate a set quickly with `npx @expo/configure-splash-screen` or any icon tool.
