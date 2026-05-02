#!/usr/bin/env node
/**
 * generate-sitemap.js
 * Reads all markdown posts from content/posts/ and writes _site/sitemap.xml.
 * Run after `@devdojo/static build` so _site/ already exists.
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://openclawchronicles.com';
const POSTS_DIR = path.join(__dirname, '../content/posts');
const SITE_DIR = path.join(__dirname, '../_site');
const OUTPUT = path.join(SITE_DIR, 'sitemap.xml');
const POSTS_PER_PAGE = 15;
const PAGES_DIR = path.join(__dirname, '../pages');

const staticPageConfigs = [
  { slug: 'about', changefreq: 'monthly', priority: '0.6' },
  { slug: 'site-map', changefreq: 'weekly', priority: '0.7' },
  { slug: 'releases', changefreq: 'weekly', priority: '0.8', section: 'releases' },
  { slug: 'security', changefreq: 'weekly', priority: '0.8', section: 'security' },
  { slug: 'guides', changefreq: 'weekly', priority: '0.8', section: 'guides' },
  { slug: 'memory', changefreq: 'weekly', priority: '0.7', section: 'guides' },
  { slug: 'migrations', changefreq: 'weekly', priority: '0.7', section: 'guides' },
  { slug: 'local-models', changefreq: 'weekly', priority: '0.7', section: 'guides' },
];

// Parse the first `key: value` frontmatter field from a markdown string
function getFrontmatterField(content, key) {
  const match = content.match(new RegExp(`^${key}:\\s*['"]?([^'"\\n]+)['"]?`, 'm'));
  return match ? match[1].trim() : null;
}

function inferSection(content = '') {
  const haystack = content.toLowerCase();
  if (/security|cve|hardening|vulnerability|exploit/.test(haystack)) return 'security';
  if (/guide|tutorial|migrate|migration|setup|how to|locally/.test(haystack)) return 'guides';
  if (/release|beta|hotfix|stable|changelog/.test(haystack)) return 'releases';
  return 'news';
}

function absoluteAssetUrl(assetPath) {
  if (!assetPath) return null;
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  return `${BASE_URL}${assetPath.startsWith('/') ? '' : '/'}${assetPath}`;
}

function fileDateOrFallback(filePath, fallback) {
  try {
    return fs.statSync(filePath).mtime.toISOString().split('T')[0];
  } catch {
    return fallback;
  }
}

function contentModifiedDate(filePath, fallback) {
  try {
    return fs.statSync(filePath).mtime.toISOString().split('T')[0];
  } catch {
    return fallback;
  }
}

// Build URL entries
const urls = [];

// Individual posts — sorted by date desc
const postFiles = fs.readdirSync(POSTS_DIR)
  .filter(f => f.endsWith('.md'))
  .map(file => {
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const slug = path.basename(file, '.md');
    const date = getFrontmatterField(content, 'date');
    const coverImage = getFrontmatterField(content, 'coverImage');
    const title = getFrontmatterField(content, 'title');
    const excerpt = getFrontmatterField(content, 'excerpt');
    const section = inferSection(content);
    const modified = contentModifiedDate(filePath, date ? date.split('T')[0] : undefined);
    return { slug, date, coverImage, title, excerpt, section, modified };
  })
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

const latestPostDate = postFiles[0]?.date?.split('T')[0];
const latestSectionDate = (section) => postFiles.find((post) => post.section === section)?.date?.split('T')[0] || latestPostDate;

// Homepage
urls.push({ loc: `${BASE_URL}/`, lastmod: fileDateOrFallback(path.join(PAGES_DIR, 'index.html'), latestPostDate), changefreq: 'daily', priority: '1.0' });

// Posts index
urls.push({ loc: `${BASE_URL}/posts/`, lastmod: latestPostDate, changefreq: 'daily', priority: '0.8' });

for (const page of staticPageConfigs) {
  const fallbackDate = page.section ? latestSectionDate(page.section) : latestPostDate;
  urls.push({
    loc: `${BASE_URL}/${page.slug}/`,
    lastmod: fileDateOrFallback(path.join(PAGES_DIR, `${page.slug}.html`), fallbackDate),
    changefreq: page.changefreq,
    priority: page.priority,
  });
}
urls.push({ loc: `${BASE_URL}/feed.xml`, lastmod: latestPostDate, changefreq: 'daily', priority: '0.4' });
urls.push({ loc: `${BASE_URL}/feed.json`, lastmod: latestPostDate, changefreq: 'daily', priority: '0.4' });

const totalArchivePages = Math.max(1, Math.ceil(postFiles.length / POSTS_PER_PAGE));

for (let page = 2; page <= totalArchivePages; page++) {
  const pagePosts = postFiles.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
  urls.push({
    loc: `${BASE_URL}/posts/${page}/`,
    lastmod: pagePosts[0]?.date?.split('T')[0] || latestPostDate,
    changefreq: 'weekly',
    priority: '0.5',
  });
}

for (const post of postFiles) {
  urls.push({
    loc: `${BASE_URL}/posts/${post.slug}/`,
    lastmod: post.modified || (post.date ? post.date.split('T')[0] : undefined),
    changefreq: 'monthly',
    priority: '0.7',
    image: absoluteAssetUrl(post.coverImage),
    imageTitle: post.title,
    imageCaption: post.excerpt,
  });
}

// Build XML
const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const entries = urls.map(({ loc, lastmod, changefreq, priority, image, imageTitle, imageCaption }) => {
  const lines = [`  <url>`, `    <loc>${escapeXml(loc)}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${escapeXml(changefreq)}</changefreq>`);
  if (priority) lines.push(`    <priority>${escapeXml(priority)}</priority>`);
  if (image) {
    lines.push('    <image:image>');
    lines.push(`      <image:loc>${escapeXml(image)}</image:loc>`);
    if (imageTitle) lines.push(`      <image:title>${escapeXml(imageTitle)}</image:title>`);
    if (imageCaption) lines.push(`      <image:caption>${escapeXml(imageCaption)}</image:caption>`);
    lines.push('    </image:image>');
  }
  lines.push(`  </url>`);
  return lines.join('\n');
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries}
</urlset>
`;

if (!fs.existsSync(SITE_DIR)) {
  fs.mkdirSync(SITE_DIR, { recursive: true });
}

fs.writeFileSync(OUTPUT, xml);
console.log(`✅ sitemap.xml written — ${urls.length} URLs`);
