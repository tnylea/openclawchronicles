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
const trustExistingOutputs = process.env.GITHUB_PAGES === 'true' || process.env.CI === 'true';
const cacheDir = path.join(root, '.cache');
const cacheFile = path.join(cacheDir, 'image-build-manifest.json');
const skipPatterns = [
  /favicon/i,
  /icon-/i,
  /apple-touch-icon/i,
  /authors\//i,
  /cover\.jpg$/i,
  /ad-/i,
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

function normalizeFile(file) {
  return file.replace(/\\/g, '/');
}

function shouldSkip(file) {
  return skipPatterns.some((pattern) => pattern.test(normalizeFile(file)));
}

function needsResponsiveVariants(file) {
  const normalized = normalizeFile(file);
  return /\/assets\/images\/(posts\/|about-banner\.(png|jpe?g)$)/i.test(normalized);
}

function expectedOutputs(file) {
  const outputs = [];

  for (const format of outputFormats) {
    const baseOutput = file.replace(/\.(png|jpe?g)$/i, `.${format.extension}`);
    outputs.push(baseOutput);

    if (needsResponsiveVariants(file)) {
      for (const width of responsiveWidths) {
        outputs.push(baseOutput.replace(new RegExp(`\\.${format.extension}$`, 'i'), `-${width}.${format.extension}`));
      }
    }
  }

  return outputs;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  } catch {
    return {};
  }
}

function saveManifest(manifest) {
  ensureDir(cacheDir);
  fs.writeFileSync(cacheFile, JSON.stringify(manifest, null, 2));
}

function sourceFingerprint(file, stat) {
  return `${stat.size}:${Math.round(stat.mtimeMs)}`;
}

function cleanupOrphanedDerivatives(rootDir, sourceFiles) {
  const expected = new Set();
  for (const file of sourceFiles) {
    expectedOutputs(file).forEach((output) => expected.add(path.resolve(output)));
  }

  // Build a set of all known source base names (without extension)
  // so we can detect if the source PNG/JPG simply doesn't exist (e.g. gitignored)
  // vs. a truly orphaned derivative whose source was intentionally removed.
  const knownSourceBases = new Set();
  for (const file of sourceFiles) {
    knownSourceBases.add(path.resolve(file).replace(/\.(png|jpe?g)$/i, ''));
  }

  let removed = 0;
  for (const file of walk(rootDir)) {
    if (!/\.(avif|webp)$/i.test(file)) continue;
    if (expected.has(path.resolve(file))) continue;

    // Determine the base name of this derivative (strip -640, -960, -1200 suffixes and extension)
    const resolved = path.resolve(file);
    const baseName = resolved
      .replace(/-(640|960|1200)\.(avif|webp)$/i, '')
      .replace(/\.(avif|webp)$/i, '');

    // If no source file exists for this base, the PNG may be gitignored — keep the derivative.
    if (!knownSourceBases.has(baseName)) continue;

    fs.unlinkSync(file);
    removed += 1;
  }

  return removed;
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
  if (trustExistingOutputs) {
    console.log('Skipping responsive image generation in CI; using committed image assets');
    return;
  }

  let converted = 0;
  let skipped = 0;
  let removed = 0;
  const manifest = loadManifest();
  const nextManifest = {};

  for (const imageRoot of imageRoots) {
    if (!fs.existsSync(imageRoot)) continue;

    const sourceFiles = walk(imageRoot).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return allowedExtensions.has(ext) && !shouldSkip(file);
    });

    removed += cleanupOrphanedDerivatives(imageRoot, sourceFiles);

    for (const file of sourceFiles) {
      const sourceStat = fs.statSync(file);
      const fingerprint = sourceFingerprint(file, sourceStat);
      const cachedEntry = manifest[file];
      const expected = expectedOutputs(file);
      const allExpectedOutputsExist = expected.every((output) => fs.existsSync(output));
      const allOutputsFresh = allExpectedOutputsExist && expected.every((output) => fs.statSync(output).mtimeMs >= sourceStat.mtimeMs);
      const canReuseExistingOutputs = trustExistingOutputs && allExpectedOutputsExist;
      const canReuseManifest = cachedEntry && cachedEntry.fingerprint === fingerprint && allOutputsFresh;

      if (canReuseManifest || canReuseExistingOutputs) {
        nextManifest[file] = cachedEntry || {
          fingerprint,
          outputs: expected,
          width: null,
        };
        skipped += expected.length;
        continue;
      }

      const metadata = needsResponsiveVariants(file) ? await imageMetadata(file) : null;
      const sourceWidth = metadata?.width || null;

      for (const format of outputFormats) {
        if (!format.include(file)) {
          skipped += 1;
          continue;
        }
        const output = file.replace(/\.(png|jpe?g)$/i, `.${format.extension}`);
        const outputExists = fs.existsSync(output);
        const outputFresh = outputExists && (trustExistingOutputs || fs.statSync(output).mtimeMs >= sourceStat.mtimeMs);

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
            const variantFresh = fs.existsSync(variantOutput) && (trustExistingOutputs || fs.statSync(variantOutput).mtimeMs >= sourceStat.mtimeMs);
            if (variantFresh) {
              skipped += 1;
              continue;
            }

            await writeVariant(file, variantOutput, format, width);
            converted += 1;
          }
        }
      }

      nextManifest[file] = {
        fingerprint,
        outputs: expected,
        width: sourceWidth,
      };
    }
  }

  saveManifest(nextManifest);

  console.log(`Generated responsive image assets, converted ${converted}, skipped ${skipped}, removed ${removed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
