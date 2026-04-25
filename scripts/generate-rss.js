const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '../content/posts');
const outputFile = path.join(__dirname, '../_site/feed.xml');
const siteUrl = 'https://openclawchronicles.com';

function parsePost(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;

  const fm = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fm[key] = value;
  }

  return {
    frontmatter: fm,
    body: match[2].trim(),
  };
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

function markdownToHtml(markdown) {
  return markdown
    .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<h[1-3]>/.test(trimmed)) return trimmed;
      if (/^-\s+/m.test(trimmed)) {
        const items = trimmed.split('\n').map((line) => line.replace(/^-\s+/, '').trim()).filter(Boolean);
        return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
      }
      if (/^\d+\.\s+/m.test(trimmed)) {
        const items = trimmed.split('\n').map((line) => line.replace(/^\d+\.\s+/, '').trim()).filter(Boolean);
        return `<ol>${items.map((item) => `<li>${item}</li>`).join('')}</ol>`;
      }
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('');
}

function inferCategory(post) {
  const haystack = `${post.title} ${post.excerpt} ${post.body}`.toLowerCase();
  if (/security|cve|hardening|vulnerability|exploit/.test(haystack)) return 'Security';
  if (/guide|tutorial|migrate|migration|setup|how to|locally/.test(haystack)) return 'Guides';
  if (/release|beta|hotfix|stable|changelog/.test(haystack)) return 'Releases';
  return 'OpenClaw News';
}

function imageMimeType(url) {
  const extension = (url.split('.').pop() || '').toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'gif') return 'image/gif';
  if (extension === 'svg') return 'image/svg+xml';
  return 'image/png';
}

const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));
const posts = [];

for (const file of files) {
  const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
  const parsed = parsePost(raw);
  if (!parsed || !parsed.frontmatter.date) continue;

  posts.push({
    title: parsed.frontmatter.title || '',
    excerpt: parsed.frontmatter.excerpt || '',
    date: parsed.frontmatter.date,
    url: parsed.frontmatter.url || `/posts/${path.basename(file, '.md')}/`,
    authorName: parsed.frontmatter.authorName || 'Cody',
    ogImageUrl: parsed.frontmatter.ogImageUrl || '',
    body: parsed.body,
  });
}

posts.sort((a, b) => new Date(b.date) - new Date(a.date));
const latest = posts.slice(0, 50);
const lastBuildDate = latest[0]?.date || new Date().toISOString();

const items = latest.map((post) => {
  const link = `${siteUrl}${post.url}`;
  const category = inferCategory(post);
  const enclosure = post.ogImageUrl
    ? `\n    <enclosure url="${escapeXml(siteUrl + post.ogImageUrl)}" type="${imageMimeType(post.ogImageUrl)}" length="0" />`
    : '';
  const contentEncoded = `\n    <content:encoded><![CDATA[${markdownToHtml(post.body)}]]></content:encoded>`;

  return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${escapeXml(link)}</link>
    <description>${escapeXml(post.excerpt)}</description>
    <category>${escapeXml(category)}</category>
    <author>news@openclawchronicles.com (${escapeXml(post.authorName)})</author>
    <pubDate>${toRfc822(post.date)}</pubDate>
    <guid isPermaLink="true">${escapeXml(link)}</guid>${enclosure}${contentEncoded}
  </item>`;
}).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>OpenClaw Chronicles</title>
    <link>${siteUrl}</link>
    <description>The #1 source for OpenClaw news, releases, tutorials, and community updates.</description>
    <language>en-us</language>
    <lastBuildDate>${toRfc822(lastBuildDate)}</lastBuildDate>
    <ttl>60</ttl>
    <managingEditor>news@openclawchronicles.com (Cody)</managingEditor>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

fs.writeFileSync(outputFile, rss, 'utf8');
console.log(`RSS feed written to ${outputFile} (${latest.length} items)`);
