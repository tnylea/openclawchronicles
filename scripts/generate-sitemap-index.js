#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://openclawchronicles.com';
const SITE_DIR = path.join(__dirname, '..', '_site');
const OUTPUT = path.join(SITE_DIR, 'sitemap-index.xml');

const sitemapFiles = [
  { file: 'sitemap.xml', url: `${BASE_URL}/sitemap.xml` },
  { file: 'news-sitemap.xml', url: `${BASE_URL}/news-sitemap.xml` },
];

function lastModified(file) {
  try {
    return fs.statSync(path.join(SITE_DIR, file)).mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapFiles.map(({ file, url }) => `  <sitemap>\n    <loc>${url}</loc>\n    <lastmod>${lastModified(file)}</lastmod>\n  </sitemap>`).join('\n')}
</sitemapindex>
`;

fs.mkdirSync(SITE_DIR, { recursive: true });
fs.writeFileSync(OUTPUT, xml);
console.log('✅ sitemap-index.xml written');
