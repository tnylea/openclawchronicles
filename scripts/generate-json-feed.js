const fs = require('fs');
const path = require('path');
const { inferFeedTags } = require('./post-taxonomy');

const postsDir = path.join(__dirname, '../content/posts');
const outputFile = path.join(__dirname, '../_site/feed.json');
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fm[key] = value;
  }

  return {
    frontmatter: fm,
    body: match[2].trim(),
  };
}

function absolutizeUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${siteUrl}${url}`;
  return `${siteUrl}/${url.replace(/^\.\//, '')}`;
}

function markdownToHtml(markdown) {
  return markdown
    .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => `<a href="${absolutizeUrl(href)}">${label}</a>`)
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

function inferTags(post) {
  const tags = inferFeedTags(post);

  const keywordTags = [...new Set(String(post.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 3 && !['openclaw', 'with', 'from', 'this', 'that', 'into', 'your'].includes(token)))].slice(0, 5);

  return [...new Set([...tags, ...keywordTags.map((tag) => tag.replace(/\b\w/g, (char) => char.toUpperCase()))])];
}

const files = fs.readdirSync(postsDir).filter((file) => file.endsWith('.md'));
const items = [];

for (const file of files) {
  const filePath = path.join(postsDir, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = parsePost(raw);
  if (!parsed || !parsed.frontmatter.date) continue;

  const slug = path.basename(file, '.md');
  const url = parsed.frontmatter.url || `/posts/${slug}/`;
  const image = parsed.frontmatter.ogImageUrl || parsed.frontmatter.coverImage || '';
  const item = {
    id: `${siteUrl}${url}`,
    url: `${siteUrl}${url}`,
    title: parsed.frontmatter.title || '',
    summary: parsed.frontmatter.excerpt || '',
    content_text: parsed.body,
    content_html: `${markdownToHtml(parsed.body)}${image ? `<p><img src="${absolutizeUrl(image)}" alt="${(parsed.frontmatter.title || '').replace(/"/g, '&quot;')}" /></p>` : ''}`,
    date_published: parsed.frontmatter.date,
    date_modified: parsed.frontmatter.dateModified || fs.statSync(filePath).mtime.toISOString(),
    authors: [
      {
        name: parsed.frontmatter.authorName || 'Cody',
        url: `${siteUrl}/about/`,
        avatar: `${siteUrl}/assets/images/authors/cody.jpg`,
      },
    ],
    tags: [],
  };

  if (image) {
    item.image = `${siteUrl}${image.startsWith('/') ? image : `/${image}`}`;
  }

  item.tags = inferTags(item);
  items.push(item);
}

items.sort((a, b) => new Date(b.date_published) - new Date(a.date_published));

const feed = {
  version: 'https://jsonfeed.org/version/1.1',
  title: 'OpenClaw Chronicles',
  home_page_url: siteUrl,
  feed_url: `${siteUrl}/feed.json`,
  description: 'OpenClaw Chronicles covers OpenClaw releases, security alerts, migration guides, tutorials, and ecosystem news.',
  icon: `${siteUrl}/icon-512.png`,
  favicon: `${siteUrl}/favicon.png`,
  authors: [
    {
      name: 'Cody',
      url: `${siteUrl}/about/`,
      avatar: `${siteUrl}/assets/images/authors/cody.jpg`,
    },
  ],
  language: 'en-US',
  banner_image: `${siteUrl}/assets/images/about-banner.jpg`,
  items: items.slice(0, 50),
};

fs.writeFileSync(outputFile, `${JSON.stringify(feed, null, 2)}\n`, 'utf8');
console.log(`JSON Feed written to ${outputFile} (${feed.items.length} items)`);
