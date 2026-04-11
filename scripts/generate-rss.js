const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '../content/posts');
const outputFile = path.join(__dirname, '../_site/feed.xml');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fm[key] = value;
  }
  return fm;
}

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc822(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toUTCString();
}

// Read all posts
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
const posts = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
  const fm = parseFrontmatter(content);
  if (!fm.date) continue;
  posts.push({
    title: fm.title || '',
    excerpt: fm.excerpt || '',
    date: fm.date,
    url: fm.url || '',
    authorName: fm.authorName || '',
    ogImageUrl: fm.ogImageUrl || '',
  });
}

// Sort by date descending
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// Limit to 50
const latest = posts.slice(0, 50);

const siteUrl = 'https://openclawchronicles.com';

const items = latest.map(post => {
  const link = `${siteUrl}${post.url}`;
  const enclosure = post.ogImageUrl
    ? `\n    <enclosure url="${escapeXml(siteUrl + post.ogImageUrl)}" type="image/png" length="0" />`
    : '';
  return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${escapeXml(link)}</link>
    <description>${escapeXml(post.excerpt)}</description>
    <pubDate>${toRfc822(post.date)}</pubDate>
    <guid isPermaLink="true">${escapeXml(link)}</guid>${enclosure}
  </item>`;
}).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>OpenClaw Chronicles</title>
    <link>${siteUrl}</link>
    <description>The #1 source for OpenClaw news, releases, tutorials, and community updates.</description>
    <language>en-us</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

fs.writeFileSync(outputFile, rss, 'utf8');
console.log(`RSS feed written to ${outputFile} (${latest.length} items)`);
