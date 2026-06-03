#!/usr/bin/env node
/**
 * generate-sitemap.js
 * Reads all markdown posts from content/posts/ and writes _site/sitemap.xml.
 * Run after `@devdojo/static build` so _site/ already exists.
 */

const fs = require('fs');
const path = require('path');
const { inferSection } = require('./post-taxonomy');

const BASE_URL = 'https://openclawchronicles.com';
const POSTS_DIR = path.join(__dirname, '../content/posts');
const SITE_DIR = path.join(__dirname, '../_site');
const OUTPUT = path.join(SITE_DIR, 'sitemap.xml');
const PAGES_DIR = path.join(__dirname, '../pages');

const staticPageConfigs = [
  { slug: 'about', changefreq: 'monthly', priority: '0.6', image: '/assets/images/about-banner.jpg', imageTitle: 'About OpenClaw Chronicles', imageCaption: 'How OpenClaw Chronicles researches and publishes OpenClaw coverage.' },
  { slug: 'site-map', changefreq: 'weekly', priority: '0.7', image: '/assets/images/about-banner.jpg', imageTitle: 'OpenClaw Chronicles site map', imageCaption: 'Start here page for release coverage, security reporting, and guides.' },
  { slug: 'releases', changefreq: 'weekly', priority: '0.8', section: 'releases', image: '/assets/images/about-banner.jpg', imageTitle: 'OpenClaw releases hub', imageCaption: 'Crawlable archive of OpenClaw release coverage, betas, and hotfixes.' },
  { slug: 'security', changefreq: 'weekly', priority: '0.8', section: 'security', image: '/assets/images/about-banner.jpg', imageTitle: 'OpenClaw security hub', imageCaption: 'OpenClaw security advisories, hardening guidance, and incident coverage.' },
  { slug: 'guides', changefreq: 'weekly', priority: '0.8', section: 'guides', image: '/assets/images/about-banner.jpg', imageTitle: 'OpenClaw guides and tutorials', imageCaption: 'OpenClaw setup guides, migrations, and practical how-tos.' },
  { slug: 'memory', changefreq: 'weekly', priority: '0.7', section: 'guides', image: '/assets/images/about-banner.jpg', imageTitle: 'OpenClaw memory guides', imageCaption: 'OpenClaw memory coverage, active memory explainers, and dreaming workflows.' },
  { slug: 'migrations', changefreq: 'weekly', priority: '0.7', section: 'guides', image: '/assets/images/about-banner.jpg', imageTitle: 'OpenClaw migration guides', imageCaption: 'OpenClaw migration tutorials and upgrade help.' },
  { slug: 'local-models', changefreq: 'weekly', priority: '0.7', section: 'guides', image: '/assets/images/about-banner.jpg', imageTitle: 'OpenClaw local models', imageCaption: 'Local model workflows and on-device OpenClaw setup coverage.' },
];

const discoveryResourceConfigs = [
  {
    loc: `${BASE_URL}/feed.xml`,
    changefreq: 'hourly',
    priority: '0.4',
    image: absoluteAssetUrl('/icon-512.png'),
    imageTitle: 'OpenClaw Chronicles RSS feed',
    imageCaption: 'Subscribe to OpenClaw Chronicles via RSS.',
  },
  {
    loc: `${BASE_URL}/feed.json`,
    changefreq: 'hourly',
    priority: '0.3',
    image: absoluteAssetUrl('/icon-512.png'),
    imageTitle: 'OpenClaw Chronicles JSON feed',
    imageCaption: 'Machine-readable JSON feed for OpenClaw Chronicles updates.',
  },
  {
    loc: `${BASE_URL}/opensearch.xml`,
    changefreq: 'weekly',
    priority: '0.3',
    image: absoluteAssetUrl('/icon-512.png'),
    imageTitle: 'OpenClaw Chronicles OpenSearch description',
    imageCaption: 'OpenSearch resource for searching OpenClaw Chronicles from compatible browsers and tools.',
  },
];

// Parse the first `key: value` frontmatter field from a markdown string
function getFrontmatterField(content, key) {
  const match = content.match(new RegExp(`^${key}:\\s*['"]?([^'"\\n]+)['"]?`, 'm'));
  return match ? match[1].trim() : null;
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

function mostRecentDate(...values) {
  return values
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0];
}

function pageLastmod(filePath, fallback, ...relatedDates) {
  return mostRecentDate(fileDateOrFallback(filePath, fallback), fallback, ...relatedDates);
}

function contentModifiedDate(filePath, frontmatterModified, fallback) {
  if (frontmatterModified) return frontmatterModified.split('T')[0];
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
    const dateModified = getFrontmatterField(content, 'dateModified');
    const section = inferSection({ title, excerpt, content })
      .toLowerCase()
      .replace('openclaw news', 'news');
    const modified = contentModifiedDate(filePath, dateModified, date ? date.split('T')[0] : undefined);
    return { slug, date, dateModified, coverImage, title, excerpt, section, modified };
  })
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

const latestPostDate = postFiles[0]?.date?.split('T')[0];
const latestPostModified = mostRecentDate(...postFiles.map((post) => post.modified || post.date?.split('T')[0])) || latestPostDate;
const latestSectionDate = (section) => {
  const sectionPosts = postFiles.filter((post) => post.section === section);
  return mostRecentDate(...sectionPosts.map((post) => post.modified || post.date?.split('T')[0])) || latestPostModified;
};

// Homepage
urls.push({
  loc: `${BASE_URL}/`,
  lastmod: pageLastmod(path.join(PAGES_DIR, 'index.html'), latestPostDate, latestPostModified),
  changefreq: 'daily',
  priority: '1.0',
  image: absoluteAssetUrl('/assets/images/about-banner.jpg'),
  imageTitle: 'OpenClaw Chronicles homepage',
  imageCaption: 'OpenClaw news, releases, security alerts, and guides.'
});

// Posts index
urls.push({
  loc: `${BASE_URL}/posts/`,
  lastmod: latestPostModified,
  changefreq: 'daily',
  priority: '0.8',
  image: absoluteAssetUrl('/assets/images/about-banner.jpg'),
  imageTitle: 'OpenClaw Chronicles archive',
  imageCaption: 'Browse the full OpenClaw Chronicles archive for releases, security coverage, and guides.',
});

for (const page of staticPageConfigs) {
  const fallbackDate = page.section ? latestSectionDate(page.section) : latestPostDate;
  urls.push({
    loc: `${BASE_URL}/${page.slug}/`,
    lastmod: pageLastmod(path.join(PAGES_DIR, `${page.slug}.html`), fallbackDate, page.section ? latestSectionDate(page.section) : latestPostModified, latestPostModified),
    changefreq: page.changefreq,
    priority: page.priority,
    image: absoluteAssetUrl(page.image),
    imageTitle: page.imageTitle,
    imageCaption: page.imageCaption,
  });
}

for (const resource of discoveryResourceConfigs) {
  urls.push({
    loc: resource.loc,
    lastmod: latestPostModified,
    changefreq: resource.changefreq,
    priority: resource.priority,
    image: resource.image,
    imageTitle: resource.imageTitle,
    imageCaption: resource.imageCaption,
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
