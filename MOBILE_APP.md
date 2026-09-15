# Plantify Android App

Plantify now includes an Android wrapper under `android/` and a GitHub Actions workflow at `.github/workflows/mobile-apk.yml`.

## What the APK contains

- Same Plantify web UI and Supabase account system
- Camera permission for the AI leaf scanner
- Gallery image selection
- Android back navigation
- Plantify launcher icon
- APK is produced as a GitHub Actions artifact named `Plantify-debug-apk`

The Android shell currently loads the GitHub Pages version of Plantify at:
`https://mikey-eze.github.io/Plantify-V1/`

## Build the APK

1. Open the repository's **Actions** tab.
2. Select **Plantify Web + Android APK**.
3. Click **Run workflow** on `main`.
4. After the Android job succeeds, open the workflow run and download the `Plantify-debug-apk` artifact.

If GitHub Pages is being used, set **Settings → Pages → Source → GitHub Actions**. GitHub Pages then publishes the Vite build from the workflow.

## API keys — important

The Android APK must **not** contain OpenRouter, Plantix, Kindwise, or other provider secret keys. Anything inside an APK can be extracted.

Keep these provider secrets in the Supabase Edge Function secrets:

- `OPENROUTER_API_KEY`
- `PLANTIX_API_KEY`
- `KINDWISE_API_KEY` (if enabled)

The web build may use the Supabase **publishable** key (`VITE_SUPABASE_PUBLISHABLE_KEY`). That key is intended for client-side use. Add it as a GitHub Actions repository secret with exactly that name before building the production web/PWA.

## Google login on Android

The current APK wraps the same web application. Email/password authentication works through the web app. Google OAuth inside an embedded WebView needs a native deep-link callback flow; the Android shell already reserves the `plantify://auth/...` scheme for that integration, but the web login button still needs to be switched to use the native callback before Google login should be considered production-ready on Android.
