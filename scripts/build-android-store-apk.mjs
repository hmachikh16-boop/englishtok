#!/usr/bin/env node
/**
 * Build a signed store APK (no in-app APK updater / installer permission).
 *
 * Usage: npm run android:apk:store
 *
 * Upload this APK to Samsung Galaxy Store or another APK-based store. Google
 * Play uses the AAB produced by `npm run android:aab`.
 */
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = resolve(root, 'android');
const propsFile = resolve(androidDir, 'keystore.properties');

if (!existsSync(propsFile)) {
  console.error(
    '\nMissing android/keystore.properties.\n' +
      'Restore your release keystore and credentials file before building.\n',
  );
  process.exit(1);
}

const props = Object.fromEntries(
  (await readFile(propsFile, 'utf8'))
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

for (const key of ['storeFile', 'storePassword', 'keyAlias', 'keyPassword']) {
  if (!props[key]) {
    console.error(`android/keystore.properties is missing "${key}".`);
    process.exit(1);
  }
}

const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: true });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

if (!process.env.VITE_GITHUB_REPOSITORY) {
  process.env.VITE_GITHUB_REPOSITORY = 'hmachikh16-boop/englishtok';
  console.log(`Using the release repository ${process.env.VITE_GITHUB_REPOSITORY} for in-app updates.`);
}
process.env.VITE_STORE_BUILD = 'true';

console.log('1/3  Building store web assets and syncing Capacitor…');
run('npm', ['run', 'android:sync'], root);

console.log('2/3  Building the signed store APK…');
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const keystore = resolve(androidDir, props.storeFile);
// Gradle is launched through the Windows shell here. The workspace path can
// contain spaces and non-ASCII characters, so each property value must be
// quoted or cmd.exe splits the keystore path into stray Gradle task names.
const gradleProperty = (name, value) => `-P${name}="${value}"`;
run(
  gradlew,
  [
    'assembleStoreRelease',
    '-Pandroid.overridePathCheck=true',
    gradleProperty('android.injected.signing.store.file', keystore),
    gradleProperty('android.injected.signing.store.password', props.storePassword),
    gradleProperty('android.injected.signing.key.alias', props.keyAlias),
    gradleProperty('android.injected.signing.key.password', props.keyPassword),
  ],
  androidDir,
);

const apk = resolve(androidDir, 'app/build/outputs/apk/store/release/app-store-release.apk');
if (!existsSync(apk)) {
  console.error('The release APK was not produced.');
  process.exit(1);
}

const { version } = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
await mkdir(resolve(root, 'releases'), { recursive: true });
const output = resolve(root, 'releases', `english-tok-${version}-store.apk`);
await copyFile(apk, output);

console.log(`3/3  Done. Store APK (no self-update): ${output}`);
console.log('Upload this APK to an APK-based store; keep using the same keystore.');
