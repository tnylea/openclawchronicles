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

// Parse the first `key: value` frontmatter field from a markdown string
function getFrontmatterField(content, key) {
  const match = content.match(new RegExp(`^${key}:\\s*['"]?([^'"\\n]+)['"]?`, 'm'));
  return match ? match[1].trim() : null;
}

// Build URL entries
const urls = [];

// Homepage
urls.push({ loc: `${BASE_URL}/`, changefreq: 'daily', priority: '1.0' });

// Posts index
urls.push({ loc: `${BASE_URL}/posts/`, changefreq: 'daily', priority: '0.8' });

// About page
urls.push({ loc: `${BASE_URL}/about/`, changefreq: 'monthly', priority: '0.6' });

// Individual posts — sorted by date desc
const postFiles = fs.readdirSync(POSTS_DIR)
  .filter(f => f.endsWith('.md'))
  .map(file => {
    const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const slug = path.basename(file, '.md');
    const date = getFrontmatterField(content, 'date');
    return { slug, date };
  })
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

const totalArchivePages = Math.max(1, Math.ceil(postFiles.length / POSTS_PER_PAGE));

for (let page = 2; page <= totalArchivePages; page++) {
  urls.push({
    loc: `${BASE_URL}/posts/${page}/`,
    changefreq: 'weekly',
    priority: '0.5',
  });
}

for (const post of postFiles) {
  urls.push({
    loc: `${BASE_URL}/posts/${post.slug}/`,
    lastmod: post.date ? post.date.split('T')[0] : undefined,
    changefreq: 'monthly',
    priority: '0.7',
  });
}

// Build XML
const entries = urls.map(({ loc, lastmod, changefreq, priority }) => {
  const lines = [`  <url>`, `    <loc>${loc}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) lines.push(`    <priority>${priority}</priority>`);
  lines.push(`  </url>`);
  return lines.join('\n');
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;

if (!fs.existsSync(SITE_DIR)) {
  fs.mkdirSync(SITE_DIR, { recursive: true });
}

fs.writeFileSync(OUTPUT, xml);
console.log(`✅ sitemap.xml written — ${urls.length} URLs`);
