#!/usr/bin/env node
/**
 * Build a signed release APK locally using android/keystore.properties.
 *
 * Usage: npm run android:apk
 *
 * The signing key in android/keystore.properties MUST stay the same for every
 * future release, otherwise Android rejects the update over an installed app.
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
  console.warn(
    '\nWARNING: VITE_GITHUB_REPOSITORY is not set, so this APK cannot check GitHub for updates.\n' +
      'Set it before building, for example:\n' +
      '  $env:VITE_GITHUB_REPOSITORY="your-user/your-repo"; npm run android:apk\n',
  );
}

console.log('1/3  Building web assets and syncing Capacitor…');
run('npm', ['run', 'android:sync'], root);

console.log('2/3  Building the signed release APK…');
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const keystore = resolve(androidDir, props.storeFile);
run(
  gradlew,
  [
    'assembleRelease',
    `-Pandroid.injected.signing.store.file=${keystore}`,
    `-Pandroid.injected.signing.store.password=${props.storePassword}`,
    `-Pandroid.injected.signing.key.alias=${props.keyAlias}`,
    `-Pandroid.injected.signing.key.password=${props.keyPassword}`,
  ],
  androidDir,
);

const apk = resolve(androidDir, 'app/build/outputs/apk/release/app-release.apk');
if (!existsSync(apk)) {
  console.error('The release APK was not produced.');
  process.exit(1);
}

const { version } = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
await mkdir(resolve(root, 'releases'), { recursive: true });
const output = resolve(root, 'releases', `english-tok-${version}.apk`);
await copyFile(apk, output);

console.log(`3/3  Done. Installable APK: ${output}`);
console.log('Keep using the same keystore for every future version.');
