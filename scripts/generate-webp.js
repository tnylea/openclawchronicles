#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const imageRoots = [
  path.join(root, 'assets', 'images'),
];

const allowedExtensions = new Set(['.png', '.jpg', '.jpeg']);
const responsiveWidths = [640, 960];
const skipPatterns = [
  /favicon/i,
  /icon-/i,
  /apple-touch-icon/i,
  /authors\//i,
  /cover\.jpg$/i,
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }

  return files;
}

function shouldSkip(file) {
  return skipPatterns.some((pattern) => pattern.test(file.replace(/\\/g, '/')));
}

function needsResponsiveVariants(file) {
  const normalized = file.replace(/\\/g, '/');
  return /\/assets\/images\/(posts\/|about-banner\.(png|jpe?g)$)/i.test(normalized);
}

async function writeWebp(source, output, width = null) {
  let pipeline = sharp(source).rotate();

  if (width) {
    pipeline = pipeline.resize({ width, withoutEnlargement: true });
  }

  await pipeline.webp({ quality: 78, effort: 6 }).toFile(output);
}

async function main() {
  let converted = 0;
  let skipped = 0;

  for (const imageRoot of imageRoots) {
    if (!fs.existsSync(imageRoot)) continue;

    for (const file of walk(imageRoot)) {
      const ext = path.extname(file).toLowerCase();
      if (!allowedExtensions.has(ext) || shouldSkip(file)) {
        skipped += 1;
        continue;
      }

      const output = file.replace(/\.(png|jpe?g)$/i, '.webp');
      const sourceStat = fs.statSync(file);
      const outputExists = fs.existsSync(output);
      const outputFresh = outputExists && fs.statSync(output).mtimeMs >= sourceStat.mtimeMs;

      if (outputFresh) {
        skipped += 1;
        continue;
      }

      await writeWebp(file, output);
      converted += 1;

      if (needsResponsiveVariants(file)) {
        for (const width of responsiveWidths) {
          const variantOutput = output.replace(/\.webp$/i, `-${width}.webp`);
          const variantFresh = fs.existsSync(variantOutput) && fs.statSync(variantOutput).mtimeMs >= sourceStat.mtimeMs;
          if (variantFresh) {
            skipped += 1;
            continue;
          }

          await writeWebp(file, variantOutput, width);
          converted += 1;
        }
      }
    }
  }

  console.log(`Generated WebP assets, converted ${converted}, skipped ${skipped}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
