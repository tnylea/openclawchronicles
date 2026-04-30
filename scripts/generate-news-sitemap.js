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

function inferSection(text = '') {
  const haystack = text.toLowerCase();
  if (/security|cve|hardening|vulnerability|exploit|incident/.test(haystack)) return 'Security';
  if (/guide|tutorial|migrate|migration|setup|how to|local model/.test(haystack)) return 'Guides';
  if (/release|beta|hotfix|stable|changelog/.test(haystack)) return 'Releases';
  return 'OpenClaw News';
}

function buildKeywords(meta) {
  const section = inferSection(`${meta.title || ''} ${meta.excerpt || ''}`);
  const titleTokens = String(meta.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 3 && !['openclaw', 'with', 'from', 'this', 'that'].includes(token));

  return [...new Set(['OpenClaw', section, ...titleTokens.slice(0, 6)])].join(', ');
}

function absoluteAssetUrl(assetPath) {
  if (!assetPath) return null;
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  return `${BASE_URL}${assetPath.startsWith('/') ? '' : '/'}${assetPath}`;
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
      keywords: buildKeywords(meta),
      image: absoluteAssetUrl(meta.coverImage),
    };
  })
  .filter((post) => post && now - new Date(post.date).getTime() <= MAX_AGE_MS)
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, MAX_NEWS_POSTS);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${posts.map((post) => `  <url>
    <loc>${escapeXml(post.url)}</loc>
    <news:news>
      <news:publication>
        <news:name>OpenClaw Chronicles</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(post.date)}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
      <news:keywords>${escapeXml(post.keywords)}</news:keywords>
    </news:news>${post.image ? `
    <image:image>
      <image:loc>${escapeXml(post.image)}</image:loc>
      <image:title>${escapeXml(post.title)}</image:title>
    </image:image>` : ''}
  </url>`).join('\n')}
</urlset>
`;

fs.mkdirSync(SITE_DIR, { recursive: true });
fs.writeFileSync(OUTPUT, xml);
console.log(`✅ news-sitemap.xml written — ${posts.length} URLs`);
