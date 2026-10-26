#!/usr/bin/env node
/**
 * Renders the Lin Go app icon and splash artwork from the SVG sources in
 * `resources/`. Run with `npm run icons:generate` after editing those files.
 */
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const resources = resolve(root, 'resources');
const androidRes = resolve(root, 'android/app/src/main/res');
const publicDir = resolve(root, 'public');

const iconSvg = resolve(resources, 'app-icon.svg');
const roundIconSvg = resolve(resources, 'app-icon-round.svg');
const foregroundSvg = resolve(resources, 'app-icon-foreground.svg');

const densities = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

const foregroundDensities = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

const splashTargets = [
  ['drawable/splash.png', 480, 320],
  ['drawable-land-mdpi/splash.png', 480, 320],
  ['drawable-land-hdpi/splash.png', 800, 480],
  ['drawable-land-xhdpi/splash.png', 1280, 720],
  ['drawable-land-xxhdpi/splash.png', 1600, 960],
  ['drawable-land-xxxhdpi/splash.png', 1920, 1280],
  ['drawable-port-mdpi/splash.png', 320, 480],
  ['drawable-port-hdpi/splash.png', 480, 800],
  ['drawable-port-xhdpi/splash.png', 720, 1280],
  ['drawable-port-xxhdpi/splash.png', 960, 1600],
  ['drawable-port-xxxhdpi/splash.png', 1280, 1920],
];

const writePng = async (source, size, target) => {
  await mkdir(dirname(target), { recursive: true });
  await sharp(source)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(target);
};

const makeSplash = async (target, width, height) => {
  const shortestSide = Math.min(width, height);
  const logoSize = Math.round(shortestSide * 0.34);
  const glowRadius = Math.round(shortestSide * 0.30);
  const background = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#67D91B"/>
          <stop offset="0.52" stop-color="#58CC02"/>
          <stop offset="1" stop-color="#46A900"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="45%" r="50%">
          <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.15"/>
          <stop offset="0.62" stop-color="#FFFFFF" stop-opacity="0.035"/>
          <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <circle cx="${width / 2}" cy="${height * 0.45}" r="${glowRadius}" fill="url(#glow)"/>
    </svg>
  `);

  const logo = await sharp(foregroundSvg)
    .trim()
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await mkdir(dirname(target), { recursive: true });
  await sharp(background)
    .composite([
      {
        input: logo,
        left: Math.round((width - logoSize) / 2),
        top: Math.round((height - logoSize) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(target);
};

await Promise.all([
  ...Object.entries(densities).flatMap(([density, size]) => [
    writePng(iconSvg, size, resolve(androidRes, `mipmap-${density}/ic_launcher.png`)),
    writePng(roundIconSvg, size, resolve(androidRes, `mipmap-${density}/ic_launcher_round.png`)),
  ]),
  ...Object.entries(foregroundDensities).map(([density, size]) =>
    writePng(foregroundSvg, size, resolve(androidRes, `mipmap-${density}/ic_launcher_foreground.png`)),
  ),
  writePng(iconSvg, 64, resolve(publicDir, 'favicon.png')),
  writePng(iconSvg, 192, resolve(publicDir, 'icon-192.png')),
  writePng(iconSvg, 512, resolve(publicDir, 'icon-512.png')),
  writePng(iconSvg, 180, resolve(publicDir, 'apple-touch-icon.png')),
  writePng(iconSvg, 512, resolve(resources, 'app-icon-preview.png')),
]);

await Promise.all(
  splashTargets.map(([target, width, height]) =>
    makeSplash(resolve(androidRes, target), width, height),
  ),
);

console.log('Generated Android launcher icons, splash screens, and web icons.');
