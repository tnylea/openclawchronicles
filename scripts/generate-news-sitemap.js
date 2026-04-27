#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://openclawchronicles.com';
const POSTS_DIR = path.join(__dirname, '../content/posts');
const SITE_DIR = path.join(__dirname, '../_site');
const OUTPUT = path.join(SITE_DIR, 'news-sitemap.xml');
const MAX_NEWS_POSTS = 1000;
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 2;

function parseFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;

  const meta = {};
  for (const line of match[1].split('\n')) {
    const parts = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!parts) continue;
    meta[parts[1]] = parts[2].trim().replace(/^['"]|['"]$/g, '');
  }

  return meta;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const now = Date.now();
const posts = fs.readdirSync(POSTS_DIR)
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const meta = parseFrontmatter(path.join(POSTS_DIR, file));
    if (!meta?.date || !meta?.title) return null;
    const slug = path.basename(file, '.md');
    const published = new Date(meta.date);
    if (Number.isNaN(published.getTime())) return null;
    return {
      title: meta.title,
      date: published.toISOString(),
      url: `${BASE_URL}/posts/${slug}/`,
    };
  })
  .filter((post) => post && now - new Date(post.date).getTime() <= MAX_AGE_MS)
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, MAX_NEWS_POSTS);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${posts.map((post) => `  <url>
    <loc>${escapeXml(post.url)}</loc>
    <news:news>
      <news:publication>
        <news:name>OpenClaw Chronicles</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(post.date)}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
    </news:news>
  </url>`).join('\n')}
</urlset>
`;

fs.mkdirSync(SITE_DIR, { recursive: true });
fs.writeFileSync(OUTPUT, xml);
console.log(`✅ news-sitemap.xml written — ${posts.length} URLs`);
