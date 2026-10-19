# EnglishTok releases and deployment

## Repository and website

The project must be pushed to a GitHub repository before GitHub Actions can run. The current workspace had no `.git` directory and Git was not installed, so no remote repository could be configured from this environment.

1. Install Git for Windows, create a GitHub repository, then initialize this project as a repository and push its `main` branch.
2. Import the repository into Vercel, or add these repository **Actions secrets** to enable the included production-deploy workflow:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
3. Set `VITE_GITHUB_REPOSITORY` to `owner/repository` in Vercel's production environment if using Vercel's Git integration. The GitHub workflows set it automatically.
4. Keep the repository and its Releases public: installed APKs cannot safely contain a GitHub credential to read private releases.

The Vercel workflow always type-checks and builds pushes to `main`/`master`. Production deployment is skipped, with a workflow notice, until all three Vercel secrets are configured. Vercel's own Git integration can be used instead; do not enable two independent production deploy methods unless duplicate deployments are intended.

## Android APK signing and releases

Capacitor Android project files are checked in under `android/`. Local Android builds need Android Studio/SDK and JDK 21 or newer. Release APKs are built by GitHub Actions when a `v*` tag is pushed; a release tag must match the stable semantic version in `package.json` (currently `1.0.0`).

Create a dedicated Android upload/release keystore with Android Studio or `keytool`, and keep a second offline backup. Convert its bytes to Base64 in PowerShell to populate the GitHub secret:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\english-tok-release.keystore"))
```

Configure these GitHub Actions secrets; never commit the keystore or passwords:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

For a later app release, increment `package.json`'s version, commit that change, and push the matching tag (for example, version `1.0.1` with tag `v1.0.1`). The workflow verifies the match, maps the version to Android's increasing `versionCode`, signs the APK, verifies the APK signature, and publishes the APK plus `update-manifest.json` to GitHub Releases.

Keep the same signing key for every APK update. Android rejects an update signed with a different key; losing the key means existing installs cannot be updated in place. The installer also checks package identity, version, SDK compatibility, and APK signature. Updates are never silently installed.

## In-app update checks

On Android, the app checks the latest stable GitHub Release at launch and shows a dismissible notice when a newer version is available. The Settings → Export APK screen also supports a manual check. Both flows validate the manifest version, package ID, official APK URL, and SHA-256 format before opening the published APK download. The user downloads the APK and confirms installation using Android's package installer. Android checks package compatibility and the APK signature during installation; the published SHA-256 is release metadata and is not independently recalculated by the app because the download is handled outside the app.

An app build without `VITE_GITHUB_REPOSITORY` can still run normally, but cannot discover GitHub releases or remote content. Set the variable to `owner/repository` for Vercel builds; GitHub workflows inject their own repository automatically.

## Content-only updates

Lesson data remains authored in `src/data/lessons.ts` and `src/data/curriculum.ts`. `npm run build` exports the current curriculum to `public/content/learning-path.json`, which is bundled with the website and APK as offline fallback.

Changes to the lesson data trigger the `Publish lesson content` workflow. It updates the rolling `content-latest` GitHub Release without creating an APK release. Apps fetch and validate that JSON on launch (and when the user requests a refresh), cache it separately from learner data, and keep the learner's progress/favorites in the existing local profile storage. If the repository has not published a content release or the network is unavailable, the app uses its bundled/cached lessons.

## Cross-device progress backup

The six-character progress code is a lookup key, not an account or a secret. To let a learner enter only that code on another device, the deployment needs shared Redis storage. Create an Upstash Redis database and configure the server-only `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables in the deployment (the same names are supported by Vercel KV integrations). Vercel deploys `api/progress.ts` as the `/api/progress` function; local `npm run dev` serves the same endpoint. The function validates the profile, rate-limits requests by client IP in Redis, rejects duplicate codes, and expires snapshots after 90 days. No Redis credentials are sent to the browser.

Without those environment variables, backups remain on the current device and the downloadable JSON file remains the manual transfer option; the app reports that cloud storage is unavailable instead of implying that a code can restore progress remotely. Progress snapshots contain learning data, not login credentials, and the short code should not be treated as authentication.

## What must be verified after GitHub setup

The workflows cannot run until the project is pushed and the required repository secrets are configured. After setup, verify one successful Vercel production run, publish and install the first signed APK on Android, then publish a higher version with the same keystore and test Android's update confirmation. Also publish a lesson-only change and confirm it appears after content refresh without installing a new APK.
