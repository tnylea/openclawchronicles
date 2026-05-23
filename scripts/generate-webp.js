#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

sharp.concurrency(1);
sharp.cache(false);

const root = path.join(__dirname, '..');
const imageRoots = [
  path.join(root, 'assets', 'images'),
];

const allowedExtensions = new Set(['.png', '.jpg', '.jpeg']);
const responsiveWidths = [640, 960, 1200];
const outputFormats = [
  {
    extension: 'avif',
    encode: (pipeline) => pipeline.avif({ quality: 52, effort: 7 }),
    include: () => true,
  },
  {
    extension: 'webp',
    encode: (pipeline) => pipeline.webp({ quality: 78, effort: 6 }),
    include: () => true,
  },
];
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

async function writeVariant(source, output, format, width = null) {
  let pipeline = sharp(source).rotate();

  if (width) {
    pipeline = pipeline.resize({ width, withoutEnlargement: true });
  }

  await format.encode(pipeline).toFile(output);
}

async function imageMetadata(file) {
  return sharp(file).metadata();
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

      const sourceStat = fs.statSync(file);
      const metadata = needsResponsiveVariants(file) ? await imageMetadata(file) : null;
      const sourceWidth = metadata?.width || null;

      for (const format of outputFormats) {
        if (!format.include(file)) {
          skipped += 1;
          continue;
        }
        const output = file.replace(/\.(png|jpe?g)$/i, `.${format.extension}`);
        const outputExists = fs.existsSync(output);
        const outputFresh = outputExists && fs.statSync(output).mtimeMs >= sourceStat.mtimeMs;

        if (outputFresh) {
          skipped += 1;
        } else {
          await writeVariant(file, output, format);
          converted += 1;
        }

        if (needsResponsiveVariants(file)) {
          for (const width of responsiveWidths) {
            if (sourceWidth && width >= sourceWidth) {
              skipped += 1;
              continue;
            }

            const variantOutput = output.replace(new RegExp(`\\.${format.extension}$`, 'i'), `-${width}.${format.extension}`);
            const variantFresh = fs.existsSync(variantOutput) && fs.statSync(variantOutput).mtimeMs >= sourceStat.mtimeMs;
            if (variantFresh) {
              skipped += 1;
              continue;
            }

            await writeVariant(file, variantOutput, format, width);
            converted += 1;
          }
        }
      }
    }
  }

  console.log(`Generated responsive image assets, converted ${converted}, skipped ${skipped}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
