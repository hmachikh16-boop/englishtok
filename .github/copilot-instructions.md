# Copilot instructions for EnglishTok

## Project overview

This repository is a mobile-first React + TypeScript app for English learning, with a vertical video feed, bilingual lesson content, local speech playback, and Android packaging via Capacitor. The app is built around a Vite frontend plus a small Express server used for local dev/production hosting.

Key areas:
- `src/App.tsx`: app shell, tab state, stored profile sync, and content refresh orchestration
- `src/components/`: feature screens for feed, categories, vocab, progress, settings, and navigation
- `src/data/`: authored lesson and curriculum content
- `src/services/`: storage, content fetching, speech engine, progression logic, and supporting utilities
- `public/content/`: generated JSON bundle used as the offline/fallback lesson catalog
- `android/`: Capacitor Android project and release build configuration
- `.github/workflows/`: CI validation, content publishing, and Android APK release automation

## Build, lint, and validation commands

Use the repo’s existing scripts from the project root:

```bash
npm ci
npm run dev
npm run build
npm run lint
npm run content:export
npm run generate:speech
npm run android:sync
npm start
```

Important details:
- `npm run dev` starts the local app through `tsx server.ts`.
- `npm run build` runs `npm run content:export` first and then `vite build`.
- `npm run lint` is the project’s CI validation step and currently runs `tsc --noEmit`.
- `npm run content:export` regenerates `public/content/learning-path.json` from the source curriculum.
- `npm run android:sync` runs the web build and then `cap sync android` for the Android project.
- There is no dedicated unit-test runner in this repo right now. For validation, prefer `npm run lint` and, when needed, a focused TypeScript compile check (`npx tsc --noEmit`).

CI in `.github/workflows/web-deploy.yml` enforces the same flow before deploy: `npm ci`, `npm run lint`, then `npm run build`.

## Architecture and data flow

The app intentionally separates authored lesson content from the UI layer:

- `src/data/curriculum.ts` and `src/data/lessons.ts` are the source of truth for lesson content and progression metadata.
- `npm run content:export` turns that curriculum into `public/content/learning-path.json`.
- `src/services/contentService.ts` validates the downloaded or cached content, checks the GitHub `content-latest` release, and falls back to local bundle data when offline.
- `src/App.tsx` loads cached content first, then refreshes from GitHub if `VITE_GITHUB_REPOSITORY` is configured.
- `src/services/storageService.ts` manages persistent learner state such as profile data, streaks, progress, and favorites.
- `src/services/speechService.ts` runs a local Kokoro-based speech pipeline through a Web Worker and IndexedDB cache; do not assume the app uses a remote TTS API.
- `src/components/*` are mostly view/state containers; keep business logic in services and typed models rather than spreading it across components.

The app is designed to work as both a web app and an Android app. Release automation is split across GitHub workflows:
- `web-deploy.yml`: validate + deploy the web site
- `publish-content.yml`: publish rolling lesson-content updates
- `android-release.yml`: build a signed APK and publish GitHub release assets

## Repository conventions and project-specific rules

- Keep authored content in `src/data/*.ts` and generate JSON rather than editing `public/content/learning-path.json` by hand.
- Reuse the existing types from `src/types/` and keep schema validation aligned with the checks in `contentService.ts` when adding new fields.
- Prefer the existing storage and content helpers (`getStoredProfile`, `saveProfile`, `fetchLatestLearningPath`, `getCachedLearningPath`) over ad hoc localStorage or fetch logic.
- This app is mobile-first and bilingual (English + Arabic). Keep user-facing screens aligned with that expectation unless a feature is intentionally English-only.
- If a change affects release/data publishing, keep the versioning and GitHub release assumptions in sync with `package.json` and the workflow files.
- `VITE_GITHUB_REPOSITORY` must match `owner/repository` for remote content update checks to work in deployed builds.
- When adding new lesson structure or vocabulary metadata, update both the source data and the validation logic in `contentService.ts` so the content bundle does not silently fail validation.

## Files to check before making changes

For the most likely impact areas, start here:
- `src/App.tsx`
- `src/services/contentService.ts`
- `src/services/speechService.ts`
- `src/services/storageService.ts`
- `src/data/curriculum.ts`
- `package.json`
- `.github/workflows/*.yml`

This gives a reliable view of the app flow without reading the entire repository.
