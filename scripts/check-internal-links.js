const fs = require('fs');
const path = require('path');

const siteDir = path.join(__dirname, '..', '_site');
const siteUrl = 'https://openclawchronicles.com';
const ignorePrefixes = ['mailto:', 'tel:', 'javascript:', 'data:', '#'];
const checked = new Set();
const errors = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function normalizeAssetTarget(targetPath) {
  const clean = targetPath.split('#')[0].split('?')[0];
  return path.join(siteDir, clean.replace(/^\//, ''));
}

function normalizePageTarget(targetPath) {
  const clean = targetPath.split('#')[0].split('?')[0];
  if (clean === '/' || clean === '') return path.join(siteDir, 'index.html');
  if (clean.endsWith('.xml') || clean.endsWith('.json') || clean.endsWith('.txt') || clean.endsWith('.webmanifest') || clean.endsWith('.ico') || clean.endsWith('.png') || clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.webp') || clean.endsWith('.avif') || clean.endsWith('.svg') || clean.endsWith('.css') || clean.endsWith('.js')) {
    return normalizeAssetTarget(clean);
  }
  return path.join(siteDir, clean.replace(/^\//, ''), 'index.html');
}

function shouldSkip(target) {
  return !target || ignorePrefixes.some((prefix) => target.startsWith(prefix)) || /^https?:\/\//i.test(target) || /^\/posts\/\$\{slug\}\/?$/.test(target);
}

for (const file of walk(siteDir)) {
  const html = fs.readFileSync(file, 'utf8');
  const matches = [...html.matchAll(/(?:href|src)="([^"]+)"/g)];

  for (const match of matches) {
    const target = match[1];
    if (shouldSkip(target)) continue;
    if (checked.has(`${file}::${target}`)) continue;
    checked.add(`${file}::${target}`);

    const resolved = target.startsWith('/') ? normalizePageTarget(target) : path.resolve(path.dirname(file), target.split('#')[0].split('?')[0]);
    if (!fs.existsSync(resolved)) {
      errors.push(`${path.relative(siteDir, file)} -> ${target}`);
    }
  }
}

if (errors.length) {
  console.error('Broken internal links/assets found:');
  errors.forEach((error) => console.error(` - ${error}`));
  process.exit(1);
}

console.log('Internal link check passed');
