const fs = require('fs');
const path = require('path');

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

function inferTags(post) {
  const haystack = `${post.title} ${post.summary} ${post.content_text}`.toLowerCase();
  const tags = ['OpenClaw'];

  if (/security|cve|hardening|vulnerability|exploit/.test(haystack)) tags.push('Security');
  if (/guide|tutorial|migrate|migration|setup|how to|locally/.test(haystack)) tags.push('Guides');
  if (/release|beta|hotfix|stable|changelog/.test(haystack)) tags.push('Releases');
  if (tags.length === 1) tags.push('News');

  return tags;
}

const files = fs.readdirSync(postsDir).filter((file) => file.endsWith('.md'));
const items = [];

for (const file of files) {
  const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
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
    content_html: markdownToHtml(parsed.body),
    date_published: parsed.frontmatter.date,
    date_modified: parsed.frontmatter.date,
    authors: [
      {
        name: parsed.frontmatter.authorName || 'Cody',
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
    },
  ],
  language: 'en-US',
  items: items.slice(0, 50),
};

fs.writeFileSync(outputFile, `${JSON.stringify(feed, null, 2)}\n`, 'utf8');
console.log(`JSON Feed written to ${outputFile} (${feed.items.length} items)`);
