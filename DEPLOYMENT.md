# Lin Go releases and deployment

## Quick start (already prepared in this workspace)

A dedicated Android release key already exists **locally** and is intentionally ignored by Git:

- `android/english-tok-release.keystore` — the signing key (never commit it).
- `android/keystore.properties` — local signing credentials used by `npm run android:apk`.
- `android/KEYSTORE-CREDENTIALS.txt` — a plain-text backup of the alias/passwords/fingerprint. Move it to a safe place and delete the plain-text copy when done.

Build an installable, signed APK on this machine:

```powershell
npm run android:apk
```

The result is `releases/english-tok-<version>.apk`. Installing a newer APK built with the **same key** updates the app in place and keeps learner data.

Publish the first GitHub release and enable in-app updates:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-github-release.ps1
```

The script logs in to GitHub CLI, creates a **public** repository, pushes `main`, uploads the four signing secrets, and pushes the `v<package.json version>` tag. `.github/workflows/android-release.yml` then builds the signed APK and publishes it with `update-manifest.json` to GitHub Releases. The installed app checks that release at launch (it must be built with `VITE_GITHUB_REPOSITORY=owner/repo`, which the workflow sets automatically).

If you prefer a local build that can also check for updates, set the repository before building:

```powershell
$env:VITE_GITHUB_REPOSITORY="owner/repo"; npm run android:apk
```

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

Capacitor Android project files are checked in under `android/`. Local Android builds need Android Studio/SDK and JDK 21 or newer. Release APKs are built by GitHub Actions when a `v*` tag is pushed; a release tag must match the stable semantic version in `package.json` (currently `1.7.6`).

Create a dedicated Android upload/release keystore with Android Studio or `keytool`, and keep a second offline backup. Convert its bytes to Base64 in PowerShell to populate the GitHub secret:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\english-tok-release.keystore"))
```

Configure these GitHub Actions secrets; never commit the keystore or passwords:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

For a later app release, increment `package.json`'s version, commit that change, and push the matching tag (for example, version `1.7.6` with tag `v1.7.6`). The workflow verifies the match, maps the version to Android's increasing `versionCode`, signs the APK, verifies the APK signature, and publishes the APK plus `update-manifest.json` to GitHub Releases.

Keep the same signing key for every APK update. Android rejects an update signed with a different key; losing the key means existing installs cannot be updated in place. The app checks package identity, version, SDK compatibility, the expected official APK URL, and the published SHA-256 before starting the installer. Android verifies package identity and the APK signature during installation. Updates are never silently installed.

## In-app update checks

On Android, the app checks the latest stable GitHub Release at launch and shows a dismissible notice when a newer version is available. The Settings → Export APK screen also supports a manual check. Both flows validate the release version, package ID, expected official APK URL, and SHA-256 format, then open the official APK link in the system browser with `@capacitor/browser`. Lin Go does not download or install packages itself, and it no longer declares `REQUEST_INSTALL_PACKAGES`. The learner confirms the installation in Android's own package installer or browser download flow.

Versions `1.8.2` and older still contain the former self-installer. If Google Play Protect blocks the transition update started by one of those versions, install `1.8.3` manually from the official download page in a browser. Do not disable Play Protect. Once `1.8.3` is installed, later updates open the browser directly.

An app build without `VITE_GITHUB_REPOSITORY` can still run normally, but cannot discover GitHub releases or remote content. Set the variable to `owner/repository` for Vercel builds; GitHub workflows inject their own repository automatically.

## Android permissions

The released APK declares two permissions:

- `android.permission.INTERNET` — GitHub release checks and the optional AI tutor.
- `android.permission.RECORD_AUDIO` — pronunciation practice, requested at runtime when the learner uses the microphone.

It intentionally does **not** request:

- `REQUEST_INSTALL_PACKAGES` — the app opens the browser for updates and never installs packages itself.
- `MANAGE_EXTERNAL_STORAGE`, `READ_EXTERNAL_STORAGE`, or `WRITE_EXTERNAL_STORAGE` — learner data stays in private app storage, and manual backups use Android's Storage Access Framework one-file picker.

Avoiding the package-installer permission and native installer code removes the main reason Google Play Protect treated the direct APK as a dropper/self-updater. Even a clean, self-signed APK distributed outside Google Play can still be flagged on some devices depending on reputation and device settings; publishing through Google Play is the only reliable way to guarantee a standard, warning-free install experience. Users who trust the official release can review the APK signature and SHA-256 before choosing to install.

## Content-only updates

Lesson data remains authored in `src/data/lessons.ts` and `src/data/curriculum.ts`. `npm run build` exports the current curriculum to `public/content/learning-path.json`, which is bundled with the website and APK as offline fallback.

Changes to the lesson data trigger the `Publish lesson content` workflow. It updates the rolling `content-latest` GitHub Release without creating an APK release. Apps fetch and validate that JSON on launch (and when the user requests a refresh), cache it separately from learner data, and keep the learner's progress/favorites in the existing local profile storage. If the repository has not published a content release or the network is unavailable, the app uses its bundled/cached lessons.

## Cross-device progress backup

The six-character progress code is a lookup key, not an account or a secret. To let a learner enter only that code on another device, the deployment needs shared Redis storage. Create an Upstash Redis database and configure the server-only `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables in the deployment (the same names are supported by Vercel KV integrations). Vercel deploys `api/progress.ts` as the `/api/progress` function; local `npm run dev` serves the same endpoint. The function validates the profile, rate-limits requests by client IP in Redis, rejects duplicate codes, and expires snapshots after 90 days. No Redis credentials are sent to the browser.

Without those environment variables, backups remain on the current device and the downloadable JSON file remains the manual transfer option; the app reports that cloud storage is unavailable instead of implying that a code can restore progress remotely. Progress snapshots contain learning data, not login credentials, and the short code should not be treated as authentication.

## What must be verified after GitHub setup

The workflows cannot run until the project is pushed and the required repository secrets are configured. After setup, verify one successful Vercel production run, publish and install the first signed APK on Android, then publish a higher version with the same keystore and test Android's update confirmation. Also publish a lesson-only change and confirm it appears after content refresh without installing a new APK.
