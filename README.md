# Plantify Web V17 — Stable Leaf Diagnosis

Plantify is a camera-first plant-health web application. This version focuses on one job: capture a leaf, identify the plant, diagnose the most likely visible health problem, and explain what to do next without crashing the browser or silently losing the AI response.

## Core flow

```text
Camera / Gallery
      ↓
Image resize + compression
      ↓
Supabase Edge Function
      ↓
Plantix agricultural analysis
      ↓
OpenRouter Vision / Gemini
      ↓
Structured diagnosis
      ↓
Plantify result UI
```

Provider secrets stay server-side.

## Current work

- Supabase authentication with email/password and Google OAuth.
- Supabase project: `ygsgpalzjlvzcfaouvlk`.
- Stable leaf scanner lifecycle with camera cleanup and duplicate-request protection.
- Structured AI diagnosis schema.
- Plantix integration as an agriculture-specific diagnostic and image-quality signal.
- Gemini/OpenRouter used as the final visual reasoning layer.
- Better handling for blurry, non-plant, and distance-too-far images.
- Raw provider output is retained for debugging when a response cannot be parsed.

## Google OAuth

Google Cloud OAuth redirect URI:

```text
https://ygsgpalzjlvzcfaouvlk.supabase.co/auth/v1/callback
```

Supabase local redirect URL:

```text
http://localhost:5173/
```

## Server secrets

Never commit provider secrets. Configure them in Supabase:

```bat
npx supabase secrets set OPENROUTER_API_KEY="YOUR_KEY"
npx supabase secrets set OPENROUTER_MODEL="google/gemini-2.5-pro"
npx supabase secrets set PLANTIX_API_KEY="YOUR_KEY"
```

## Local development

```bat
npm install
npm run dev
```

## Deploy Edge Function

```bat
npx supabase link --project-ref ygsgpalzjlvzcfaouvlk
npx supabase functions deploy plant-detect --use-api
```

## Safety and stability goal

A single photograph cannot guarantee a field diagnosis. Plantify should communicate uncertainty and recommend a better photo or local agricultural confirmation when evidence is weak. Avoid making high-risk chemical treatment decisions from an AI result alone.

Repeated scans should remain stable before adding larger features such as alerts, plant history, community mapping, or voice-first interaction.
