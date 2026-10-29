#!/usr/bin/env node
/**
 * Build the signed Lin Go Gold APK.
 *
 * Gold is a separate application id (com.englishtok.gold) so it installs next
 * to the free Lin Go app. It reuses the same UI, native shell and signing key;
 * only the curriculum layer and app identity change.
 *
 * Usage: npm run android:gold
 */
import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
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

// Read the Gold flavor version from Gradle so the output filename and the
// published release cannot drift apart after a version bump.
const gradleSource = await readFile(resolve(androidDir, 'app', 'build.gradle'), 'utf8');
const goldFlavor = /gold\s*\{([\s\S]*?)\}/.exec(gradleSource)?.[1] ?? '';
const goldVersion = /versionName\s+["']([^"']+)["']/.exec(goldFlavor)?.[1];
if (!goldVersion || !/^\d+\.\d+\.\d+$/.test(goldVersion)) {
  console.error('Could not read the Gold versionName from android/app/build.gradle.');
  process.exit(1);
}

const run = (command, args, cwd, env = process.env) => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env,
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const goldEnv = {
  ...process.env,
  VITE_GOLD_EDITION: 'true',
  VITE_STORE_BUILD: 'false',
  VITE_GITHUB_REPOSITORY:
    process.env.VITE_GITHUB_REPOSITORY || 'hmachikh16-boop/englishtok',
};

// Never bundle the website APK (or a previous Gold APK) inside the app.
for (const stagedApk of [
  resolve(root, 'public', 'english-tok.apk'),
  resolve(root, 'dist', 'english-tok.apk'),
  resolve(root, 'public', 'lin-go-gold.apk'),
  resolve(root, 'dist', 'lin-go-gold.apk'),
  resolve(root, 'public', 'lin-go-gold-1.0.1.apk'),
  resolve(root, 'dist', 'lin-go-gold-1.0.1.apk'),
  resolve(root, 'public', 'lin-go-gold-1.1.1.apk'),
  resolve(root, 'dist', 'lin-go-gold-1.1.1.apk'),
]) {
  if (existsSync(stagedApk)) {
    await rm(stagedApk, { force: true });
    console.log(`Removed staged APK before Gold build: ${stagedApk}`);
  }
}

console.log('1/4  Building Gold web assets (same UI + Gold curriculum)…');
run('npm', ['run', 'build'], root, goldEnv);

// Vite copies public/ into dist/. Make sure no download payload slipped in.
for (const stagedApk of [
  resolve(root, 'public', 'english-tok.apk'),
  resolve(root, 'dist', 'english-tok.apk'),
  resolve(root, 'public', 'lin-go-gold.apk'),
  resolve(root, 'dist', 'lin-go-gold.apk'),
  resolve(root, 'public', 'lin-go-gold-1.0.1.apk'),
  resolve(root, 'dist', 'lin-go-gold-1.0.1.apk'),
  resolve(root, 'public', 'lin-go-gold-1.1.1.apk'),
  resolve(root, 'dist', 'lin-go-gold-1.1.1.apk'),
]) {
  if (existsSync(stagedApk)) {
    await rm(stagedApk, { force: true });
    console.log(`Removed staged APK before Android sync: ${stagedApk}`);
  }
}

console.log('2/4  Syncing Capacitor…');
run('npx', ['cap', 'sync', 'android'], root, goldEnv);

console.log('3/4  Building the signed Gold release APK…');
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const keystore = resolve(androidDir, props.storeFile);
const gradleProperty = (name, value) => `-P${name}="${value}"`;
run(
  gradlew,
  [
    'assembleGoldRelease',
    '-Pandroid.overridePathCheck=true',
    gradleProperty('android.injected.signing.store.file', keystore),
    gradleProperty('android.injected.signing.store.password', props.storePassword),
    gradleProperty('android.injected.signing.key.alias', props.keyAlias),
    gradleProperty('android.injected.signing.key.password', props.keyPassword),
  ],
  androidDir,
  goldEnv,
);

const apk = resolve(
  androidDir,
  'app/build/outputs/apk/gold/release/app-gold-release.apk',
);
if (!existsSync(apk)) {
  console.error('The Gold release APK was not produced.');
  process.exit(1);
}

await mkdir(resolve(root, 'releases'), { recursive: true });
const output = resolve(root, 'releases', `lin-go-gold-${goldVersion}.apk`);
await copyFile(apk, output);

console.log(`4/4  Done. Gold APK ${goldVersion}: ${output}`);
console.log('The free APK in releases/ is untouched.');
