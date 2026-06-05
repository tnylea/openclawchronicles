const fs = require('fs');
const path = require('path');
const { inferSection } = require('./post-taxonomy');

const siteDir = path.join(__dirname, '..', '_site');
const siteUrl = 'https://openclawchronicles.com';
const postsDir = path.join(__dirname, '..', 'content', 'posts');

function parseFrontmatter(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const stat = fs.statSync(file);
  const meta = {};
  for (const line of match[1].split('\n')) {
    const parts = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!parts) continue;
    const [, key, value] = parts;
    meta[key] = value.trim().replace(/^['"]|['"]$/g, '');
  }

  const slug = path.basename(file, '.md');
  return {
    ...meta,
    content: match[2].trim(),
    url: meta.url || `/posts/${slug}/`,
    link: meta.link || `/posts/${slug}`,
    modified: meta.dateModified || stat.mtime.toISOString(),
  };
}

const allPosts = fs.readdirSync(postsDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => parseFrontmatter(path.join(postsDir, file)))
  .filter(Boolean)
  .sort((a, b) => new Date(b.date) - new Date(a.date));
const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'your', 'what', 'when', 'where', 'will', 'have', 'been', 'more', 'than', 'they', 'them', 'their', 'about', 'after', 'before', 'over', 'under', 'just', 'here', 'also', 'only', 'through', 'because', 'while', 'which', 'using', 'used', 'into', 'openclaw', 'chronicles']);
const postBySlug = new Map(allPosts.map((post) => [post.url.split('/').filter(Boolean).pop(), post]));

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function normalizedUrlFromFile(file) {
  const relative = path.relative(siteDir, file).replace(/\\/g, '/');
  if (relative === 'index.html') return `${siteUrl}/`;
  if (relative.endsWith('/index.html')) {
    const dir = relative.slice(0, -'index.html'.length);
    return `${siteUrl}/${dir}`;
  }
  return `${siteUrl}/${relative}`;
}

function injectOrReplace(html, regex, replacement) {
  if (regex.test(html)) return html.replace(regex, replacement);
  return html;
}

function normalizeInternalPostLinks(html) {
  return html.replace(/href="\/posts\/([a-z0-9-]+)(?<!\/)"/gi, (match, slug) => {
    if (/^\d+$/.test(slug)) return match;
    return `href="/posts/${slug}/"`;
  });
}

function buildResponsiveModernSrcset(src, extension) {
  const modernSrc = src.replace(/\.(png|jpe?g)(\?.*)?$/i, `.${extension}$2`);
  if (modernSrc === src) return null;

  const sourcePath = modernSrc.replace(/^\//, '').split('?')[0];
  const absolutePath = path.join(siteDir, sourcePath);
  if (!fs.existsSync(absolutePath)) return null;

  const candidates = [640, 960, 1200]
    .map((width) => {
      const candidateSrc = modernSrc.replace(new RegExp(`\\.${extension}(\\?.*)?$`, 'i'), `-${width}.${extension}$1`);
      const candidatePath = path.join(siteDir, candidateSrc.replace(/^\//, '').split('?')[0]);
      return fs.existsSync(candidatePath) ? `${candidateSrc} ${width}w` : null;
    })
    .filter(Boolean);

  candidates.push(`${modernSrc} 1600w`);

  return candidates.join(', ');
}

function bestModernImageSource(src) {
  if (!/^\/assets\/images\//.test(src) || !/\.(png|jpe?g)(\?.*)?$/i.test(src)) return null;

  const formats = [
    { extension: 'avif', type: 'image/avif' },
    { extension: 'webp', type: 'image/webp' },
  ];

  for (const format of formats) {
    const modernSrc = src.replace(/\.(png|jpe?g)(\?.*)?$/i, `.${format.extension}$2`);
    const modernPath = path.join(siteDir, modernSrc.replace(/^\//, '').split('?')[0]);
    if (!fs.existsSync(modernPath)) continue;

    return {
      src: modernSrc,
      type: format.type,
      srcset: buildResponsiveModernSrcset(src, format.extension),
    };
  }

  return null;
}

function injectImagePreload(html) {
  if (html.includes('data-seo-preload="hero-image"')) return html;

  const heroMatch = html.match(/(<img\b[^>]*\bsrc="([^"]+)"[^>]*\bdata-seo-hero\b[^>]*>)/i)
    || html.match(/(<img\b[^>]*\bsrc="([^"]+)"[^>]*\bfetchpriority="high"[^>]*>)/i)
    || html.match(/(<img\b[^>]*\bsrc="([^"]+)"[^>]*\bloading="eager"[^>]*>)/i);

  if (heroMatch && /ad-leaderboard/i.test(heroMatch[2])) return html;

  if (!heroMatch) return html;

  const heroTag = heroMatch[1];
  const heroSrc = heroMatch[2];
  let preloadSrc = heroSrc;
  let preloadType = '';
  let imageSrcset = '';
  let imageSizes = '';

  const bestModernSource = bestModernImageSource(heroSrc);
  if (bestModernSource) {
    preloadSrc = bestModernSource.src;
    preloadType = ` type="${bestModernSource.type}"`;
    if (bestModernSource.srcset) imageSrcset = ` imagesrcset="${bestModernSource.srcset}"`;
  }

  const sizesMatch = heroTag.match(/\ssizes="([^"]+)"/i);
  if (sizesMatch) imageSizes = ` imagesizes="${sizesMatch[1]}"`;

  const preloadTag = `    <link rel="preload" as="image" href="${preloadSrc}"${preloadType}${imageSrcset}${imageSizes} data-seo-preload="hero-image" />`;

  return html.replace(/<link rel="stylesheet" href="\/styles\.css" \/>/i, `${preloadTag}\n    <link rel="stylesheet" href="/styles.css" />`);
}

function stripArticleOnlyMeta(html) {
  return html
    .replace(/\s*<meta property="article:published_time" content="[^"]*"\s*\/?>/gi, '')
    .replace(/\s*<meta property="article:modified_time" content="[^"]*"\s*\/?>/gi, '')
    .replace(/\s*<meta property="article:author" content="[^"]*"\s*\/?>/gi, '')
    .replace(/\s*<meta property="article:section" content="[^"]*"\s*\/?>/gi, '')
    .replace(/\s*<meta property="article:tag" content="[^"]*"\s*\/?>/gi, '')
    .replace(/\s*<meta property="og:updated_time" content="[^"]*"\s*\/?>/gi, '');
}

function updateCanonicalAndUrls(html, canonicalUrl) {
  html = html.replace(/\s*<link rel="alternate" hreflang="en" href="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/\s*<link rel="alternate" hreflang="x-default" href="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?\s*>/i, `<link rel="canonical" href="${canonicalUrl}" />\n    <link rel="alternate" hreflang="en" href="${canonicalUrl}" />\n    <link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta property="og:url" content="\{frontmatter\.url\}"\s*\/?\s*>/gi, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = html.replace(/<link rel="canonical" href="\{frontmatter\.url\}"\s*\/?\s*>/gi, `<link rel="canonical" href="${canonicalUrl}" />\n    <link rel="alternate" hreflang="en" href="${canonicalUrl}" />\n    <link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`);

  html = html.replace(/"url":\s*"https:\/\/openclawchronicles\.com\{frontmatter\.url\}"/g, `"url": "${canonicalUrl}"`);
  html = html.replace(/"url":\s*"\{frontmatter\.url\}"/g, `"url": "${canonicalUrl}"`);
  html = html.replace(/"item":\s*"https:\/\/openclawchronicles\.com\{frontmatter\.url\}"/g, `"item": "${canonicalUrl}"`);
  html = html.replace(/"item":\s*"\{frontmatter\.url\}"/g, `"item": "${canonicalUrl}"`);
  html = html.replace(/"@id":\s*"https:\/\/openclawchronicles\.com\{frontmatter\.url\}"/g, `"@id": "${canonicalUrl}"`);
  html = html.replace(/"@id":\s*"\{frontmatter\.url\}"/g, `"@id": "${canonicalUrl}"`);
  html = html.replace(/"url":\s*"https:\/\/openclawchronicles\.com\/"/g, (match, offset) => {
    const around = html.slice(Math.max(0, offset - 120), Math.min(html.length, offset + 120));
    if (around.includes('"@type": "WebSite"')) return match;
    return `"url": "${canonicalUrl}"`;
  });

  return html;
}

function resolveResidualTemplateTokens(html, canonicalUrl) {
  const postMatch = canonicalUrl.match(/\/posts\/([^/]+)\/$/);
  const post = postMatch ? postBySlug.get(postMatch[1]) : null;
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const descriptionMatch = html.match(/<meta name="description" content="([^"]*)"\s*\/?>/i);
  const ogImageMatch = html.match(/<meta property="og:image" content="([^"]*)"\s*\/?>/i);

  const replacements = new Map([
    ['{frontmatter.url}', canonicalUrl],
    ['{pageUrl}', canonicalUrl],
    ['{frontmatter.dateModified}', post?.modified || ''],
    ['{frontmatter.date}', post?.date || ''],
    ['{frontmatter.authorName}', post?.authorName || 'Cody'],
    ['{frontmatter.title}', post?.title || titleMatch?.[1] || 'OpenClaw Chronicles'],
    ['{frontmatter.excerpt}', post?.excerpt || descriptionMatch?.[1] || ''],
    ['{frontmatter.ogImageUrl}', post?.ogImageUrl || ''],
    ['{pageDescription}', descriptionMatch?.[1] || ''],
    ['{pageOgDescription}', descriptionMatch?.[1] || ''],
    ['{pageSchemaDescription}', descriptionMatch?.[1] || ''],
    ['{pageOgTitle}', titleMatch?.[1] || 'OpenClaw Chronicles'],
    ['{pageSchemaName}', titleMatch?.[1] || 'OpenClaw Chronicles'],
    ['{pageImage}', ogImageMatch?.[1] || `${siteUrl}/assets/images/about-banner.jpg`],
    ['{pageImageAlt}', titleMatch?.[1] || 'OpenClaw Chronicles'],
  ]);

  for (const [token, value] of replacements.entries()) {
    if (!value) continue;
    html = html.split(token).join(value);
  }

  return html;
}

function updatePaginatedArchiveLinks(html, canonicalUrl, pageNumber) {
  const prev = pageNumber > 1 ? `${siteUrl}/posts/${pageNumber - 1 === 1 ? '' : `${pageNumber - 1}/`}` : null;
  const next = fs.existsSync(path.join(siteDir, 'posts', String(pageNumber + 1), 'index.html')) ? `${siteUrl}/posts/${pageNumber + 1}/` : null;

  html = html.replace(/\s*<link rel="prev" href="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/\s*<link rel="next" href="[^"]*"\s*\/?>/gi, '');

  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
  let insert = canonicalTag;
  if (prev) insert += `\n    <link rel="prev" href="${prev}" />`;
  if (next) insert += `\n    <link rel="next" href="${next}" />`;

  html = html.replace(canonicalTag, insert);
  return html;
}

function fixAboutPageMetadata(html, canonicalUrl) {
  if (canonicalUrl !== `${siteUrl}/about/`) return html;

  const description = 'Learn how OpenClaw Chronicles covers OpenClaw releases, security updates, tutorials, and ecosystem news with a human-AI editorial workflow.';
  const ogImage = `${siteUrl}/assets/images/about-banner.jpg`;
  const faqSchema = buildFaqSchema(extractFaqEntries(html, 'about-faq-heading'));

  html = stripArticleOnlyMeta(html);

  html = html.replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/i, `<meta name="description" content="${description}" />`);
  html = html.replace(/<meta name="author" content="[^"]*"\s*\/?\s*>/i, '<meta name="author" content="Cody" />');
  html = html.replace(/<meta property="og:type" content="[^"]*"\s*\/?\s*>/i, '<meta property="og:type" content="website" />');
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?\s*>/i, '<meta property="og:title" content="About OpenClaw Chronicles" />');
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:description" content="${description}" />`);
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:image" content="${ogImage}" />`);
  html = html.replace(/<meta property="og:image:secure_url" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:image:secure_url" content="${ogImage}" />`);
  html = html.replace(/<meta property="og:image:alt" content="[^"]*"\s*\/?\s*>/i, '<meta property="og:image:alt" content="OpenClaw Chronicles newsroom illustration" />');
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?\s*>/i, '<meta name="twitter:title" content="About OpenClaw Chronicles" />');
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:description" content="${description}" />`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:image" content="${ogImage}" />`);
  html = html.replace(/<meta name="twitter:image:alt" content="[^"]*"\s*\/?\s*>/i, '<meta name="twitter:image:alt" content="OpenClaw Chronicles newsroom illustration" />');

  html = html.replace(
    /<!-- JSON-LD Article Schema -->[\s\S]*?<!-- Google Analytics -->/i,
    `<!-- JSON-LD Article Schema -->\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "AboutPage",\n      "name": "About OpenClaw Chronicles",\n      "url": "${canonicalUrl}",\n      "description": "${description}",\n      "mainEntity": {\n        "@type": "Person",\n        "name": "Cody",\n        "url": "${siteUrl}/about/#about-cody",\n        "description": "AI journalist and editor for OpenClaw Chronicles.",\n        "image": "${siteUrl}/assets/images/authors/cody.jpg",\n        "worksFor": {\n          "@type": "NewsMediaOrganization",\n          "name": "OpenClaw Chronicles",\n          "url": "${siteUrl}",\n          "logo": "${siteUrl}/icon-512.png"\n        }\n      }\n    }\n    </script>\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "Person",\n      "name": "Cody",\n      "url": "${siteUrl}/about/#about-cody",\n      "description": "AI journalist and editor for OpenClaw Chronicles.",\n      "image": "${siteUrl}/assets/images/authors/cody.jpg",\n      "jobTitle": "AI Journalist",\n      "worksFor": {\n        "@type": "NewsMediaOrganization",\n        "name": "OpenClaw Chronicles",\n        "url": "${siteUrl}"\n      },\n      "knowsAbout": ["OpenClaw", "OpenClaw releases", "OpenClaw security", "OpenClaw guides"]\n    }\n    </script>\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "BreadcrumbList",\n      "itemListElement": [\n        {\n          "@type": "ListItem",\n          "position": 1,\n          "name": "Home",\n          "item": "${siteUrl}/"\n        },\n        {\n          "@type": "ListItem",\n          "position": 2,\n          "name": "About",\n          "item": "${canonicalUrl}"\n        }\n      ]\n    }\n    </script>${faqSchema}\n    <!-- Google Analytics -->`
  );

  return html;
}

function latestModifiedForPosts(posts) {
  return posts
    .map((post) => post.modified || post.date)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0] || null;
}

function formatUtcDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function fixPostsArchiveMetadata(html, canonicalUrl) {
  if (!/^https:\/\/openclawchronicles\.com\/posts\/(\d+\/)?$/.test(canonicalUrl)) return html;

  const pageMatch = canonicalUrl.match(/\/posts\/(\d+)\/$/);
  const pageNumber = pageMatch ? Number(pageMatch[1]) : 1;
  const title = pageNumber === 1
    ? 'OpenClaw Chronicles Archive, OpenClaw News, Releases, Security, and Guides'
    : `OpenClaw Chronicles Archive, Page ${pageNumber}`;
  const description = pageNumber === 1
    ? 'Browse the OpenClaw Chronicles archive for OpenClaw release coverage, security alerts, migration guides, tutorials, and ecosystem reporting.'
    : `Browse page ${pageNumber} of the OpenClaw Chronicles archive for older OpenClaw releases, guides, and security coverage.`;
  const ogImage = `${siteUrl}/assets/images/about-banner.jpg`;
  const faqSchema = buildFaqSchema(extractFaqEntries(html, 'archive-faq-heading'));

  html = stripArticleOnlyMeta(html);

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/i, `<meta name="description" content="${description}" />`);
  html = html.replace(/<meta name="author" content="[^"]*"\s*\/?\s*>/i, '<meta name="author" content="Cody" />');
  html = injectOrReplace(html, /<meta name="robots" content="[^"]*"\s*\/?>/i, `<meta name="robots" content="${pageNumber > 1 ? 'noindex,follow,max-image-preview:large' : 'index,follow,max-image-preview:large'}" />`);
  html = injectOrReplace(html, /<meta name="googlebot" content="[^"]*"\s*\/?>/i, `<meta name="googlebot" content="${pageNumber > 1 ? 'noindex,follow,max-image-preview:large' : 'index,follow,max-image-preview:large'}" />`);
  html = html.replace(/<meta property="og:type" content="[^"]*"\s*\/?\s*>/i, '<meta property="og:type" content="website" />');
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:title" content="${title}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:description" content="${description}" />`);
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:image" content="${ogImage}" />`);
  html = html.replace(/<meta property="og:image:secure_url" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:image:secure_url" content="${ogImage}" />`);
  html = html.replace(/<meta property="og:image:alt" content="[^"]*"\s*\/?\s*>/i, '<meta property="og:image:alt" content="OpenClaw Chronicles archive page" />');
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:title" content="${title}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:description" content="${description}" />`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:image" content="${ogImage}" />`);
  html = html.replace(/<meta name="twitter:image:alt" content="[^"]*"\s*\/?\s*>/i, '<meta name="twitter:image:alt" content="OpenClaw Chronicles archive page" />');

  const topPosts = allPosts.slice((pageNumber - 1) * 15, (pageNumber - 1) * 15 + 10);
  const latestModified = latestModifiedForPosts(topPosts) || latestModifiedForPosts(allPosts);
  if (latestModified) {
    html = injectOrReplace(html, /<meta property="og:updated_time" content="[^"]*"\s*\/?>/i, `<meta property="og:updated_time" content="${latestModified}" />`);
  }

  const itemList = topPosts.map((post, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${siteUrl}${post.url}`,
    name: post.title,
  }));

  html = html.replace(
    /<!-- JSON-LD WebSite Schema -->[\s\S]*?<!-- Google Analytics -->/i,
    `<!-- JSON-LD WebSite Schema -->\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "CollectionPage",\n      "name": "${title.replace(/"/g, '&quot;')}",\n      "url": "${canonicalUrl}",\n      "description": "${description}",\n      "dateModified": ${JSON.stringify(latestModified)},\n      "potentialAction": ${JSON.stringify(buildWebsiteSearchAction(), null, 6)},\n      "about": [\n        {\n          "@type": "Thing",\n          "name": "OpenClaw"\n        },\n        {\n          "@type": "Thing",\n          "name": ${JSON.stringify(pageNumber > 1 ? `OpenClaw archive page ${pageNumber}` : 'OpenClaw archive')}\n        }\n      ],\n      "isPartOf": {\n        "@type": "WebSite",\n        "name": "OpenClaw Chronicles",\n        "url": "${siteUrl}"\n      },\n      "mainEntity": {\n        "@type": "ItemList",\n        "numberOfItems": ${itemList.length},\n        "itemListOrder": "https://schema.org/ItemListOrderDescending",\n        "itemListElement": ${JSON.stringify(itemList, null, 8)}\n      }\n    }\n    </script>\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "BreadcrumbList",\n      "itemListElement": [\n        {\n          "@type": "ListItem",\n          "position": 1,\n          "name": "Home",\n          "item": "${siteUrl}/"\n        },\n        {\n          "@type": "ListItem",\n          "position": 2,\n          "name": "Posts",\n          "item": "${siteUrl}/posts/"\n        }${pageNumber > 1 ? `,\n        {\n          "@type": "ListItem",\n          "position": 3,\n          "name": "Page ${pageNumber}",\n          "item": "${canonicalUrl}"\n        }` : ''}\n      ]\n    }\n    </script>${faqSchema}\n    <!-- Google Analytics -->`
  );

  return html;
}

function fixHomepageMetadata(html, canonicalUrl) {
  if (canonicalUrl !== `${siteUrl}/`) return html;

  const title = 'OpenClaw Chronicles, OpenClaw News, Releases, Security, and Guides';
  const description = 'OpenClaw Chronicles covers OpenClaw releases, security alerts, migration guides, tutorials, and ecosystem news with a fast, crawlable archive.';
  const ogImage = `${siteUrl}/assets/images/about-banner.jpg`;
  const faqSchema = buildFaqSchema(extractFaqEntries(html, 'homepage-faq-heading'));
  const latestModified = latestModifiedForPosts(allPosts);
  const topPosts = allPosts.slice(0, 8).map((post, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${siteUrl}${post.url}`,
    name: post.title,
  }));

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/i, `<meta name="description" content="${description}" />`);
  html = html.replace(/<meta name="author" content="[^"]*"\s*\/?\s*>/i, '<meta name="author" content="Cody" />');
  html = html.replace(/<meta property="og:type" content="[^"]*"\s*\/?\s*>/i, '<meta property="og:type" content="website" />');
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:title" content="${title}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:description" content="${description}" />`);
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:image" content="${ogImage}" />`);
  html = html.replace(/<meta property="og:image:secure_url" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:image:secure_url" content="${ogImage}" />`);
  html = html.replace(/<meta property="og:image:alt" content="[^"]*"\s*\/?\s*>/i, '<meta property="og:image:alt" content="OpenClaw Chronicles homepage" />');
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:title" content="${title}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:description" content="${description}" />`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:image" content="${ogImage}" />`);
  html = html.replace(/<meta name="twitter:image:alt" content="[^"]*"\s*\/?\s*>/i, '<meta name="twitter:image:alt" content="OpenClaw Chronicles homepage" />');
  if (latestModified) {
    html = injectOrReplace(html, /<meta property="og:updated_time" content="[^"]*"\s*\/?>/i, `<meta property="og:updated_time" content="${latestModified}" />`);
  }

  html = html.replace(
    /<!-- JSON-LD WebSite Schema -->[\s\S]*?<!-- Google Analytics -->/i,
    `<!-- JSON-LD WebSite Schema -->\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "WebSite",\n      "name": "OpenClaw Chronicles",\n      "url": "${canonicalUrl}",\n      "description": "${description}",\n      "potentialAction": ${JSON.stringify(buildWebsiteSearchAction(), null, 6)},\n      "publisher": {\n        "@type": "NewsMediaOrganization",\n        "name": "OpenClaw Chronicles",\n        "url": "${siteUrl}",\n        "logo": {\n          "@type": "ImageObject",\n          "url": "${siteUrl}/icon-512.png",\n          "width": 512,\n          "height": 512\n        },\n        "sameAs": [\n          "https://x.com/openclawai",\n          "https://github.com/tnylea/openclawchronicles"\n        ],\n        "publishingPrinciples": "${siteUrl}/about/#editorial-standards",\n        "ethicsPolicy": "${siteUrl}/about/#editorial-standards",\n        "correctionsPolicy": "${siteUrl}/about/#corrections-policy"\n      }\n    }\n    </script>\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "CollectionPage",\n      "name": "OpenClaw Chronicles homepage",\n      "url": "${canonicalUrl}",\n      "description": "${description}",\n      "dateModified": ${JSON.stringify(latestModified)},\n      "mainEntity": {\n        "@type": "ItemList",\n        "numberOfItems": ${topPosts.length},\n        "itemListOrder": "https://schema.org/ItemListOrderDescending",\n        "itemListElement": ${JSON.stringify(topPosts, null, 8)}\n      }\n    }\n    </script>${faqSchema}\n    <!-- Google Analytics -->`
  );

  return html;
}

function extractFaqEntries(html, sectionId) {
  const sectionMatch = html.match(new RegExp(`<section[^>]*aria-labelledby="${sectionId}"[^>]*>([\\s\\S]*?)<\\/section>`, 'i'));
  if (!sectionMatch) return [];

  const entries = [];
  const cardRegex = /<article[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?<\/article>/gi;
  let match;

  while ((match = cardRegex.exec(sectionMatch[1])) !== null) {
    const question = cleanTextForSchema(match[1]);
    const answer = cleanTextForSchema(match[2]);
    if (question && answer) entries.push({ question, answer });
  }

  return entries;
}

function buildFaqSchema(entries) {
  if (!entries.length) return '';

  return `\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "FAQPage",\n      "mainEntity": ${JSON.stringify(entries.map((entry) => ({
        '@type': 'Question',
        name: entry.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: entry.answer,
        },
      })), null, 8)}\n    }\n    </script>`;
}

function cleanTextForSchema(text) {
  return String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([("'])\s+/g, '$1')
    .replace(/\s+([)"'])/g, '$1')
    .trim();
}

function buildWebsiteSearchAction() {
  return {
    '@type': 'SearchAction',
    target: `${siteUrl}/posts/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  };
}

function buildSiteMapItemList(html) {
  const main = html.match(/<main id="main-content">([\s\S]*?)<include src="newsletter\.html"><\/include>/i)?.[1] || html;
  const links = [...main.matchAll(/<a href="(\/[^"?#]+\/?|https:\/\/openclawchronicles\.com\/[^"?#]+\/)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({
      href: match[1].startsWith('http') ? match[1] : `${siteUrl}${match[1]}`,
      label: cleanTextForSchema(match[2]),
    }))
    .filter((item) => item.label && !/^home$/i.test(item.label));

  const deduped = [];
  const seen = new Set();
  for (const item of links) {
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    deduped.push(item);
  }

  return deduped.slice(0, 24).map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: item.href,
    name: item.label,
  }));
}

function matchesHubTopic(post, label) {
  const haystack = `${post.title} ${post.excerpt} ${post.content}`.toLowerCase();

  if (label === 'Releases') return inferSection(post) === 'Releases';
  if (label === 'Security') return inferSection(post) === 'Security';
  if (label === 'Guides') return inferSection(post) === 'Guides';
  if (label === 'Memory') return /\bmemory\b|dreaming|recall|wiki|active memory|memory palace|memory palace|session search|formative memory|memory plugin/.test(haystack);
  if (label === 'Migrations') return /\bmigrate\b|migration|upgrade|oauth|claude cli|breaking change|doctor --fix|provider change|provider-change/.test(haystack);
  if (label === 'Local Models') return /ollama|local model|\blocal\b|macbook air|gemma|mlx|on-device|self-hosted model/.test(haystack);
  if (label === 'Site Map') return /openclaw|guide|tutorial|migrate|migration|setup|security|release|beta|hotfix|cve/.test(haystack);

  return false;
}

function sectionMeta(section) {
  const map = {
    Releases: { href: `${siteUrl}/releases/`, label: 'Releases' },
    Security: { href: `${siteUrl}/security/`, label: 'Security' },
    Guides: { href: `${siteUrl}/guides/`, label: 'Guides' },
    'OpenClaw News': { href: `${siteUrl}/posts/`, label: 'Posts' },
  };

  return map[section] || map['OpenClaw News'];
}

function buildArticleBreadcrumbSchema(post, sectionInfo, canonicalUrl) {
  return `\n    <script type="application/ld+json">\n    ${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${siteUrl}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: sectionInfo.label,
          item: sectionInfo.href,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.title,
          item: canonicalUrl,
        },
      ],
    }, null, 4)}\n    </script>`;
}

function postKeywords(post, limit = 4) {
  return [...new Set(tokenize(`${post.title} ${post.excerpt}`))].slice(0, limit);
}

function buildHowToSchema(post, html) {
  const section = inferSection(post);
  if (!['Guides'].includes(section) && !/migrate|migration|setup|tutorial|how to|walkthrough|local model/i.test(`${post.title} ${post.excerpt}`)) {
    return '';
  }

  const articleMatch = html.match(/<article class="article-content[^"]*">([\s\S]*?)<\/article>/i);
  const articleHtml = articleMatch ? articleMatch[1] : html;
  const headingMatches = [...articleHtml.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const steps = headingMatches
    .map((match) => match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((label) => label && !/^(continue reading|story navigation|related openclaw coverage|on this page)$/i.test(label))
    .slice(0, 8)
    .map((label, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: label,
      url: `${siteUrl}${post.url}#${slugify(label)}`,
      text: label,
    }));

  if (steps.length < 2) return '';

  return `\n    <script type="application/ld+json">\n    ${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: post.title,
      description: post.excerpt,
      url: `${siteUrl}${post.url}`,
      image: `${siteUrl}${post.ogImageUrl}`,
      totalTime: `PT${Math.max(2, Math.ceil(String(post.content || '').split(/\s+/).filter(Boolean).length / 220))}M`,
      supply: [
        {
          '@type': 'HowToSupply',
          name: 'OpenClaw installation or target environment',
        },
      ],
      tool: [
        {
          '@type': 'HowToTool',
          name: 'OpenClaw',
        },
      ],
      step: steps,
      author: {
        '@type': 'Person',
        name: post.authorName,
      },
      publisher: {
        '@type': 'NewsMediaOrganization',
        name: 'OpenClaw Chronicles',
        url: siteUrl,
      },
    }, null, 4)}\n    </script>`;
}

function fixSiteMapMetadata(html, canonicalUrl) {
  if (canonicalUrl !== `${siteUrl}/site-map/`) return html;

  const title = 'OpenClaw Chronicles Site Map and Start Here Guide';
  const description = 'Use the OpenClaw Chronicles site map to browse release coverage, security reporting, guides, feeds, and evergreen OpenClaw resources.';
  const ogImage = `${siteUrl}/assets/images/about-banner.jpg`;
  const latestModified = latestModifiedForPosts(allPosts);
  const siteMapItems = buildSiteMapItemList(html);
  const faqSchema = buildFaqSchema(extractFaqEntries(html, 'site-map-faq-heading'));

  html = stripArticleOnlyMeta(html);
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${description}" />`);
  html = html.replace(/<meta property="og:type" content="[^"]*"\s*\/?>/i, '<meta property="og:type" content="website" />');
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${title}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${description}" />`);
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${ogImage}" />`);
  html = html.replace(/<meta property="og:image:secure_url" content="[^"]*"\s*\/?>/i, `<meta property="og:image:secure_url" content="${ogImage}" />`);
  html = html.replace(/<meta property="og:image:alt" content="[^"]*"\s*\/?>/i, '<meta property="og:image:alt" content="OpenClaw Chronicles site map" />');
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${title}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${description}" />`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${ogImage}" />`);
  html = html.replace(/<meta name="twitter:image:alt" content="[^"]*"\s*\/?>/i, '<meta name="twitter:image:alt" content="OpenClaw Chronicles site map" />');
  if (latestModified) {
    html = injectOrReplace(html, /<meta property="og:updated_time" content="[^"]*"\s*\/?>/i, `<meta property="og:updated_time" content="${latestModified}" />`);
  }

  html = html.replace(
    /<!-- JSON-LD WebSite Schema -->[\s\S]*?<!-- Google Analytics -->/i,
    `<!-- JSON-LD WebSite Schema -->\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "CollectionPage",\n      "name": ${JSON.stringify(title)},\n      "url": ${JSON.stringify(canonicalUrl)},\n      "description": ${JSON.stringify(description)},\n      "dateModified": ${JSON.stringify(latestModified)},\n      "isPartOf": {\n        "@type": "WebSite",\n        "name": "OpenClaw Chronicles",\n        "url": ${JSON.stringify(siteUrl)}\n      },\n      "mainEntity": {\n        "@type": "ItemList",\n        "numberOfItems": ${siteMapItems.length},\n        "itemListOrder": "https://schema.org/ItemListOrderAscending",\n        "itemListElement": ${JSON.stringify(siteMapItems, null, 8)}\n      }\n    }\n    </script>\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "BreadcrumbList",\n      "itemListElement": [\n        {\n          "@type": "ListItem",\n          "position": 1,\n          "name": "Home",\n          "item": ${JSON.stringify(`${siteUrl}/`)}\n        },\n        {\n          "@type": "ListItem",\n          "position": 2,\n          "name": "Site Map",\n          "item": ${JSON.stringify(canonicalUrl)}\n        }\n      ]\n    }\n    </script>${faqSchema}\n    <!-- Google Analytics -->`
  );

  return html;
}

function fixTopicHubMetadata(html, canonicalUrl) {
  const hubs = {
    [`${siteUrl}/releases/`]: {
      title: 'OpenClaw Releases, Stable Builds, Betas, and Hotfixes',
      description: 'Browse OpenClaw Chronicles release coverage for stable builds, beta launches, hotfixes, and changelog breakdowns.',
      label: 'Releases',
    },
    [`${siteUrl}/security/`]: {
      title: 'OpenClaw Security News, CVEs, and Hardening Guides',
      description: 'Track OpenClaw security advisories, CVEs, incident response, and self-hosting hardening coverage in one archive.',
      label: 'Security',
    },
    [`${siteUrl}/guides/`]: {
      title: 'OpenClaw Guides, Migrations, and Tutorials',
      description: 'Find OpenClaw setup guides, migration walkthroughs, local model tutorials, and practical how-tos.',
      label: 'Guides',
    },
    [`${siteUrl}/memory/`]: {
      title: 'OpenClaw Memory Guides, Active Memory, and Dreaming Coverage',
      description: 'Explore OpenClaw memory guides, active memory coverage, dreaming explainers, and long-term recall workflows.',
      label: 'Memory',
    },
    [`${siteUrl}/migrations/`]: {
      title: 'OpenClaw Migration Guides and Upgrade Help',
      description: 'Browse OpenClaw migration guides, upgrade notes, provider-change tutorials, and breaking-change context.',
      label: 'Migrations',
    },
    [`${siteUrl}/local-models/`]: {
      title: 'OpenClaw Local Model Guides, Ollama Fixes, and On-Device Workflows',
      description: 'Find OpenClaw local model guides, Ollama fixes, MacBook Air workflows, and practical self-hosted model coverage.',
      label: 'Local Models',
    },
    [`${siteUrl}/site-map/`]: {
      title: 'OpenClaw Chronicles Site Map and Start Here Guide',
      description: 'Use the OpenClaw Chronicles site map to browse release coverage, security reporting, guides, feeds, and evergreen OpenClaw resources.',
      label: 'Site Map',
    },
  };

  const hub = hubs[canonicalUrl];
  if (!hub) return html;

  const ogImage = `${siteUrl}/assets/images/about-banner.jpg`;
  html = stripArticleOnlyMeta(html);
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${hub.title}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/i, `<meta name="description" content="${hub.description}" />`);
  html = html.replace(/<meta name="author" content="[^"]*"\s*\/?\s*>/i, '<meta name="author" content="Cody" />');
  html = html.replace(/<meta property="og:type" content="[^"]*"\s*\/?\s*>/i, '<meta property="og:type" content="website" />');
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:title" content="${hub.title}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:description" content="${hub.description}" />`);
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:image" content="${ogImage}" />`);
  html = html.replace(/<meta property="og:image:secure_url" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:image:secure_url" content="${ogImage}" />`);
  html = html.replace(/<meta property="og:image:alt" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:image:alt" content="OpenClaw Chronicles ${hub.label.toLowerCase()} hub" />`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:title" content="${hub.title}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:description" content="${hub.description}" />`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:image" content="${ogImage}" />`);
  html = html.replace(/<meta name="twitter:image:alt" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:image:alt" content="OpenClaw Chronicles ${hub.label.toLowerCase()} hub" />`);

  const faqSectionId = hub.label === 'Releases'
    ? 'release-faq-heading'
    : hub.label === 'Security'
      ? 'security-faq-heading'
      : hub.label === 'Memory'
        ? 'memory-faq-heading'
        : hub.label === 'Migrations'
          ? 'migration-faq-heading'
          : hub.label === 'Local Models'
            ? 'local-model-faq-heading'
      : hub.label === 'Guides'
        ? 'guides-faq-heading'
        : 'site-map-faq-heading';
  const faqSchema = buildFaqSchema(extractFaqEntries(html, faqSectionId));

  const matchingPosts = allPosts.filter((post) => matchesHubTopic(post, hub.label));
  const latestModified = latestModifiedForPosts(matchingPosts) || latestModifiedForPosts(allPosts);
  if (latestModified) {
    html = injectOrReplace(html, /<meta property="og:updated_time" content="[^"]*"\s*\/?>/i, `<meta property="og:updated_time" content="${latestModified}" />`);
  }

  const hubPosts = matchingPosts.slice(0, 10).map((post, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${siteUrl}${post.url}`,
    name: post.title,
  }));

  html = html.replace(
    /<!-- JSON-LD WebSite Schema -->[\s\S]*?<!-- Google Analytics -->/i,
    `<!-- JSON-LD WebSite Schema -->\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "CollectionPage",\n      "name": ${JSON.stringify(hub.title)},\n      "url": ${JSON.stringify(canonicalUrl)},\n      "description": ${JSON.stringify(hub.description)},\n      "dateModified": ${JSON.stringify(latestModified)},\n      "potentialAction": ${JSON.stringify(buildWebsiteSearchAction(), null, 8)},\n      "isPartOf": {\n        "@type": "WebSite",\n        "name": "OpenClaw Chronicles",\n        "url": ${JSON.stringify(siteUrl)},\n        "potentialAction": ${JSON.stringify(buildWebsiteSearchAction(), null, 8)}\n      },\n      "mainEntity": {\n        "@type": "ItemList",\n        "numberOfItems": ${hubPosts.length},\n        "itemListOrder": "https://schema.org/ItemListOrderDescending",\n        "itemListElement": ${JSON.stringify(hubPosts, null, 8)}\n      }\n    }\n    </script>\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "BreadcrumbList",\n      "itemListElement": [\n        {\n          "@type": "ListItem",\n          "position": 1,\n          "name": "Home",\n          "item": ${JSON.stringify(`${siteUrl}/`)}\n        },\n        {\n          "@type": "ListItem",\n          "position": 2,\n          "name": ${JSON.stringify(hub.label)},\n          "item": ${JSON.stringify(canonicalUrl)}\n        }\n      ]\n    }\n    </script>${faqSchema}\n    <!-- Google Analytics -->`
  );

  return html;
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || 'section';
}

function injectSectionAnchorsAndToc(html, canonicalUrl) {
  const evergreenTargets = new Set([
    `${siteUrl}/about/`,
    `${siteUrl}/site-map/`,
    `${siteUrl}/posts/`,
    `${siteUrl}/releases/`,
    `${siteUrl}/security/`,
    `${siteUrl}/guides/`,
    `${siteUrl}/memory/`,
    `${siteUrl}/migrations/`,
    `${siteUrl}/local-models/`,
  ]);

  if (!evergreenTargets.has(canonicalUrl)) return html;

  const usedIds = new Set();
  const headings = [];
  html = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attrs, inner) => {
    const cleanLabel = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanLabel) return full;

    const idMatch = attrs.match(/\sid="([^"]+)"/i);
    let id = idMatch ? idMatch[1] : slugify(cleanLabel);
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${idMatch ? idMatch[1] : slugify(cleanLabel)}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);

    const normalizedAttrs = idMatch ? attrs.replace(/\sid="[^"]+"/i, '') : attrs;
    if (!/faq/i.test(id) && !/breadcrumb/i.test(id) && !/current-date/i.test(id)) {
      headings.push({ id, label: cleanLabel, level: Number(level) });
    }

    if (/href="#/.test(inner)) return `<h${level}${normalizedAttrs} id="${id}">${inner}</h${level}>`;
    return `<h${level}${normalizedAttrs} id="${id}"><a href="#${id}" class="hover:text-red-accent">${inner}</a></h${level}>`;
  });

  if (headings.length < 4 || html.includes('page-toc-heading')) return html;

  const tocItems = headings.slice(0, 12).map((heading) => `<li class="${heading.level === 3 ? 'ml-4' : ''}"><a href="#${heading.id}" class="text-ink-strong hover:text-red-accent font-sans text-sm">${heading.label}</a></li>`).join('');
  const tocMarkup = `
        <nav class="mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8" aria-labelledby="page-toc-heading">
            <div class="border-border rounded-[min(0.3vw,4px)] border bg-surface-alt p-5">
                <div class="flex items-center gap-3">
                    <h2 id="page-toc-heading" class="text-ink font-mono text-[0.6875rem] font-semibold tracking-widest uppercase">On this page</h2>
                    <div class="bg-border-strong h-px flex-1" aria-hidden="true"></div>
                </div>
                <ol class="mt-4 grid gap-2 sm:grid-cols-2">${tocItems}</ol>
            </div>
        </nav>`;

  return html.replace(/(<include src="archive-search-panel\.html"><\/include>|<section class="mx-auto max-w-7xl px-4 pt-4 pb-8 sm:px-6 lg:px-8">|<section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="archive-start-here">)/i, `$1${tocMarkup}`);
}

function scoreRelatedPosts(currentPost, candidatePost) {
  const currentTokens = tokenize(`${currentPost.title} ${currentPost.excerpt} ${currentPost.content}`);
  const candidateTokens = new Set(tokenize(`${candidatePost.title} ${candidatePost.excerpt} ${candidatePost.content}`));
  const currentSection = inferSection(currentPost);
  const candidateSection = inferSection(candidatePost);

  let score = 0;
  for (const token of currentTokens) {
    if (candidateTokens.has(token)) score += token.length > 6 ? 3 : 2;
  }
  if (currentSection === candidateSection) score += 8;

  const ageDays = Math.abs(new Date(currentPost.date) - new Date(candidatePost.date)) / 86400000;
  if (ageDays <= 7) score += 3;
  else if (ageDays <= 30) score += 2;
  else if (ageDays <= 90) score += 1;

  return score;
}

function buildSearchPanelData() {
  const releasePost = allPosts.find((post) => inferSection(post) === 'Releases');
  const securityPost = allPosts.find((post) => inferSection(post) === 'Security');
  const guidePost = allPosts.find((post) => inferSection(post) === 'Guides');
  const memoryPost = allPosts.find((post) => matchesHubTopic(post, 'Memory'));
  const localModelsPost = allPosts.find((post) => matchesHubTopic(post, 'Local Models'));
  const migrationPost = allPosts.find((post) => matchesHubTopic(post, 'Migrations'));

  return {
    chips: [
      { href: '/posts/?q=release', label: 'Latest releases' },
      { href: '/posts/?q=security', label: 'Security coverage' },
      { href: '/posts/?q=memory', label: 'Memory workflows' },
      { href: '/posts/?q=migration', label: 'Migration help' },
      { href: '/posts/?q=local%20models', label: 'Local model workflows' },
    ],
    freshness: [releasePost, securityPost, guidePost].filter(Boolean).slice(0, 3),
    readerPaths: [
      releasePost ? { href: releasePost.url, label: releasePost.title } : { href: '/releases/', label: 'Track the latest OpenClaw releases and betas' },
      securityPost ? { href: securityPost.url, label: securityPost.title } : { href: '/security/', label: 'Browse current OpenClaw security coverage' },
      guidePost ? { href: guidePost.url, label: guidePost.title } : { href: '/guides/', label: 'OpenClaw guides and tutorial archive' },
      memoryPost ? { href: memoryPost.url, label: memoryPost.title } : migrationPost ? { href: migrationPost.url, label: migrationPost.title } : localModelsPost ? { href: localModelsPost.url, label: localModelsPost.title } : { href: '/local-models/', label: 'Run OpenClaw with local models and on-device workflows' },
    ],
  };
}

function refreshSearchPanels(html) {
  const searchPanelData = buildSearchPanelData();

  if (html.includes('data-search-shortcut-chips')) {
    html = html.replace(/<div class="mt-4 flex flex-wrap gap-3" data-search-shortcut-chips>[\s\S]*?<\/div>/i, `<div class="mt-4 flex flex-wrap gap-3" data-search-shortcut-chips>${searchPanelData.chips.map((chip) => `\n      <a href="${chip.href}" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">${chip.label}</a>`).join('')}\n    </div>`);
  }

  if (html.includes('data-search-freshness')) {
    const freshnessLinks = searchPanelData.freshness.map((post) => `<a href="${post.url}" class="text-ink-strong hover:text-red-accent font-medium">${post.title}</a>`).join(', ');
    html = html.replace(/<div class="mt-4 rounded-\[min\(0\.3vw,4px\)\] border border-border bg-surface px-4 py-3" data-search-freshness>[\s\S]*?<\/div>/i, `<div class="mt-4 rounded-[min(0.3vw,4px)] border border-border bg-surface px-4 py-3" data-search-freshness>\n      <p class="text-red-accent font-mono text-[0.625rem] font-semibold tracking-wider uppercase">Fresh archive entry points</p>\n      <p class="text-ink-body mt-2 text-sm">Start with ${freshnessLinks || 'the latest OpenClaw coverage'}, then branch into the full archive if you need older context.</p>\n    </div>`);
  }

  if (html.includes('data-search-reader-paths')) {
    html = html.replace(/<ul class="mt-3 space-y-2" data-search-reader-paths>[\s\S]*?<\/ul>/i, `<ul class="mt-3 space-y-2" data-search-reader-paths>${searchPanelData.readerPaths.map((item) => `\n          <li><a href="${item.href}" class="text-ink-strong hover:text-red-accent font-sans text-sm font-medium">${item.label}</a></li>`).join('')}\n        </ul>`);
  }

  return html;
}

function injectLatestTopicSections(html, canonicalUrl) {
  const targets = new Set([`${siteUrl}/`, `${siteUrl}/posts/`]);
  if (!targets.has(canonicalUrl) || html.includes('latest-topic-clusters-heading')) return html;

  const clusters = [
    {
      label: 'Releases',
      title: 'Latest OpenClaw releases and betas',
      href: '/releases/',
      description: 'Fresh stable launches, betas, and hotfix coverage for readers comparing upgrades.',
      posts: allPosts.filter((post) => inferSection(post) === 'Releases').slice(0, 3),
    },
    {
      label: 'Security',
      title: 'Recent OpenClaw security coverage',
      href: '/security/',
      description: 'High-urgency advisories, hardening writeups, and exploit-response reporting.',
      posts: allPosts.filter((post) => inferSection(post) === 'Security').slice(0, 3),
    },
    {
      label: 'Guides',
      title: 'Newest setup and migration guides',
      href: '/guides/',
      description: 'Evergreen tutorials that answer recurring OpenClaw setup and migration searches.',
      posts: allPosts.filter((post) => inferSection(post) === 'Guides').slice(0, 3),
    },
  ].filter((cluster) => cluster.posts.length);

  if (!clusters.length) return html;

  const cards = clusters.map((cluster) => `
                <article class="border-border rounded-[min(0.4vw,6px)] border p-6">
                    <span class="text-red-accent font-mono text-[0.625rem] font-semibold tracking-wider uppercase">${cluster.label}</span>
                    <h3 class="font-display text-ink mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-xl">${cluster.title}</h3>
                    <p class="text-ink-body mt-3 text-[0.9375rem] text-pretty">${cluster.description}</p>
                    <ul class="mt-5 space-y-3">
                        ${cluster.posts.map((post) => `<li><a href="${post.url}" class="text-ink-strong hover:text-red-accent font-sans text-sm font-medium">${post.title}</a></li>`).join('')}
                    </ul>
                    <a href="${cluster.href}" class="mt-5 inline-flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold tracking-wider uppercase text-red-accent transition-colors hover:text-red-vibrant">
                        Open ${cluster.label.toLowerCase()} hub
                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </a>
                </article>`).join('');

  const section = `
        <section class="defer-render mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="latest-topic-clusters-heading">
            <div class="flex items-center gap-3">
                <h2 id="latest-topic-clusters-heading" class="text-ink font-mono text-[0.6875rem] font-semibold tracking-widest uppercase">Latest by topic</h2>
                <div class="bg-border-strong h-px flex-1" aria-hidden="true"></div>
            </div>
            <div class="mt-8 grid gap-6 lg:grid-cols-3 lg:gap-8">${cards}
            </div>
        </section>`;

  if (canonicalUrl === `${siteUrl}/`) {
    return html.replace(/\n\s*<section class="defer-render mx-auto max-w-7xl px-4 pb-12[\s\S]*?<\/section>\n\n\s*<\/main>/i, (match) => `${match.replace(/\n\s*<\/main>$/i, '')}${section}\n\n    </main>`);
  }

  return html.replace(/\n\s*<!-- POSTS_PAGINATION_START -->/i, `${section}\n\n        <!-- POSTS_PAGINATION_START -->`);
}

function injectHubFreshLinks(html, canonicalUrl) {
  const hubConfigs = {
    [`${siteUrl}/releases/`]: {
      headingId: 'latest-release-coverage-heading',
      heading: 'Latest release coverage',
      intro: 'Fresh release posts help this hub surface current stable launches, beta drops, and hotfix coverage faster.',
      filter: (post) => matchesHubTopic(post, 'Releases'),
      label: 'Release',
    },
    [`${siteUrl}/security/`]: {
      headingId: 'latest-security-coverage-heading',
      heading: 'Latest security coverage',
      intro: 'Recent advisories and hardening stories strengthen internal linking for urgent OpenClaw security searches.',
      filter: (post) => matchesHubTopic(post, 'Security'),
      label: 'Security',
    },
    [`${siteUrl}/guides/`]: {
      headingId: 'latest-guides-coverage-heading',
      heading: 'Latest guides and walkthroughs',
      intro: 'Recent tutorials keep this hub fresh for recurring setup, migration, and local-model search intent.',
      filter: (post) => matchesHubTopic(post, 'Guides'),
      label: 'Guide',
    },
    [`${siteUrl}/memory/`]: {
      headingId: 'latest-memory-coverage-heading',
      heading: 'Latest memory coverage',
      intro: 'Recent memory stories reinforce the strongest evergreen OpenClaw memory topics from one crawlable page.',
      filter: (post) => matchesHubTopic(post, 'Memory'),
      label: 'Memory',
    },
    [`${siteUrl}/migrations/`]: {
      headingId: 'latest-migration-coverage-heading',
      heading: 'Latest migration coverage',
      intro: 'Recent migration stories help connect breaking changes, provider moves, and upgrade walkthroughs.',
      filter: (post) => matchesHubTopic(post, 'Migrations'),
      label: 'Migration',
    },
    [`${siteUrl}/local-models/`]: {
      headingId: 'latest-local-model-coverage-heading',
      heading: 'Latest local model coverage',
      intro: 'Recent local-model stories keep this hub current for Ollama, on-device, and self-hosted model workflows.',
      filter: (post) => matchesHubTopic(post, 'Local Models'),
      label: 'Local models',
    },
  };

  const hub = hubConfigs[canonicalUrl];
  if (!hub || html.includes(hub.headingId)) return html;

  const posts = allPosts.filter(hub.filter).slice(0, 3);
  if (!posts.length) return html;

  const cards = posts.map((post) => `
                <article class="border-border rounded-[min(0.3vw,4px)] border p-5">
                    <span class="text-red-accent font-mono text-[0.625rem] font-semibold tracking-wider uppercase">${hub.label}</span>
                    <h3 class="font-display text-ink mt-2 text-xl font-semibold tracking-tight text-balance sm:text-lg"><a href="${post.url}" class="hover:text-red-accent">${post.title}</a></h3>
                    <p class="text-ink-body mt-2 text-[0.9375rem] text-pretty">${post.excerpt}</p>
                    <p class="text-ink-faint mt-3 font-mono text-[0.625rem] tracking-wider uppercase">${post.dateFormatted || ''}</p>
                </article>`).join('');

  const section = `
        <section class="defer-render mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="${hub.headingId}">
            <div class="flex items-center gap-3">
                <h2 id="${hub.headingId}" class="text-ink font-mono text-[0.6875rem] font-semibold tracking-widest uppercase">${hub.heading}</h2>
                <div class="bg-border-strong h-px flex-1" aria-hidden="true"></div>
            </div>
            <p class="text-ink-muted mt-3 max-w-3xl text-sm">${hub.intro}</p>
            <div class="mt-8 grid gap-6 lg:grid-cols-3">${cards}
            </div>
        </section>`;

  return html.replace(/\n\s*<section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="[^"]+-faq-heading">/i, `${section}\n\n        <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="${canonicalUrl.includes('/releases/') ? 'release' : canonicalUrl.includes('/security/') ? 'security' : canonicalUrl.includes('/guides/') ? 'guides' : canonicalUrl.includes('/memory/') ? 'memory' : canonicalUrl.includes('/migrations/') ? 'migration' : 'local-model'}-faq-heading">`);
}

function buildTopicLinkItems(posts, label) {
  return posts.map((post) => `<li><a href="${post.url}" class="text-ink-strong hover:text-red-accent font-sans text-sm font-medium">${post.title}</a></li>`).join('');
}

function refreshHomepageCoverageTracks(html, canonicalUrl) {
  if (canonicalUrl !== `${siteUrl}/`) return html;

  const releasePosts = allPosts.filter((post) => inferSection(post) === 'Releases').slice(0, 3);
  const securityPosts = allPosts.filter((post) => inferSection(post) === 'Security').slice(0, 3);
  const guidePosts = allPosts.filter((post) => inferSection(post) === 'Guides').slice(0, 3);

  if (releasePosts.length) {
    html = html.replace(/(<article id="releases-coverage"[\s\S]*?<ul class="mt-5 space-y-3">)([\s\S]*?)(<\/ul>)/i, `$1${buildTopicLinkItems(releasePosts, 'Release')}$3`);
  }

  if (securityPosts.length) {
    html = html.replace(/(<article id="security-coverage"[\s\S]*?<ul class="mt-5 space-y-3">)([\s\S]*?)(<\/ul>)/i, `$1${buildTopicLinkItems(securityPosts, 'Security')}$3`);
  }

  if (guidePosts.length) {
    html = html.replace(/(<article id="guides-coverage"[\s\S]*?<ul class="mt-5 space-y-3">)([\s\S]*?)(<\/ul>)/i, `$1${buildTopicLinkItems(guidePosts, 'Guide')}$3`);
  }

  return html;
}

function refreshSiteMapLatestCoverage(html, canonicalUrl) {
  if (canonicalUrl !== `${siteUrl}/site-map/`) return html;

  const releasePosts = allPosts.filter((post) => inferSection(post) === 'Releases').slice(0, 2);
  const securityPosts = allPosts.filter((post) => inferSection(post) === 'Security').slice(0, 2);
  const guidePosts = allPosts.filter((post) => inferSection(post) === 'Guides').slice(0, 2);
  const memoryPosts = allPosts.filter((post) => matchesHubTopic(post, 'Memory')).slice(0, 2);
  const migrationPosts = allPosts.filter((post) => matchesHubTopic(post, 'Migrations')).slice(0, 2);
  const localModelPosts = allPosts.filter((post) => matchesHubTopic(post, 'Local Models')).slice(0, 2);

  if (releasePosts.length) {
    html = html.replace(/(<article[\s\S]*?<span class="text-red-accent[^"]*">Releases<\/span>[\s\S]*?<ul class="mt-4 space-y-3">)([\s\S]*?)(<\/ul>)/i, `$1${buildTopicLinkItems([...releasePosts, { url: '/releases/', title: 'Browse all release coverage' }], 'Release')}$3`);
  }

  if (securityPosts.length) {
    html = html.replace(/(<article[\s\S]*?<span class="text-red-accent[^"]*">Security<\/span>[\s\S]*?<ul class="mt-4 space-y-3">)([\s\S]*?)(<\/ul>)/i, `$1${buildTopicLinkItems([...securityPosts, { url: '/security/', title: 'Browse all security coverage' }], 'Security')}$3`);
  }

  if (guidePosts.length) {
    html = html.replace(/(<article[\s\S]*?<span class="text-red-accent[^"]*">Guides<\/span>[\s\S]*?<ul class="mt-4 space-y-3">)([\s\S]*?)(<\/ul>)/i, `$1${buildTopicLinkItems([...guidePosts, { url: '/guides/', title: 'Browse all guides and tutorials' }], 'Guide')}$3`);
  }

  if (releasePosts.length) {
    html = html.replace(/(<h3 class="font-display text-ink text-2xl font-semibold tracking-tight">Release coverage<\/h3>[\s\S]*?<ul class="mt-4 space-y-2">)([\s\S]*?)(<\/ul>)/i, `$1${buildTopicLinkItems([{ url: '/releases/', title: 'Open the releases hub' }, ...releasePosts], 'Release')}$3`);
  }

  if (securityPosts.length) {
    html = html.replace(/(<h3 class="font-display text-ink text-2xl font-semibold tracking-tight">Security coverage<\/h3>[\s\S]*?<ul class="mt-4 space-y-2">)([\s\S]*?)(<\/ul>)/i, `$1${buildTopicLinkItems([{ url: '/security/', title: 'Open the security hub' }, ...securityPosts], 'Security')}$3`);
  }

  if (guidePosts.length) {
    html = html.replace(/(<h3 class="font-display text-ink text-2xl font-semibold tracking-tight">Guides and tutorials<\/h3>[\s\S]*?<ul class="mt-4 space-y-2">)([\s\S]*?)(<\/ul>)/i, `$1${buildTopicLinkItems([{ url: '/guides/', title: 'Open the guides hub' }, { url: '/memory/', title: 'Memory guides and recall workflows' }, ...guidePosts.slice(0, 1), { url: '/migrations/', title: 'Migration help and upgrade notes' }, { url: '/local-models/', title: 'Local model setup coverage' }], 'Guide')}$3`);
  }

  if (memoryPosts.length) {
    html = html.replace(/(<span class="text-red-accent font-mono text-\[0\.625rem\] font-semibold tracking-wider uppercase">Memory<\/span>[\s\S]*?<ul class="mt-4 space-y-3">)([\s\S]*?)(<\/ul>)/i, `$1${buildTopicLinkItems([{ url: '/memory/', title: 'Open the memory hub' }, ...memoryPosts], 'Memory')}$3`);
  }

  if (migrationPosts.length) {
    html = html.replace(/(<span class="text-red-accent font-mono text-\[0\.625rem\] font-semibold tracking-wider uppercase">Migrations<\/span>[\s\S]*?<ul class="mt-4 space-y-3">)([\s\S]*?)(<\/ul>)/i, `$1${buildTopicLinkItems([{ url: '/migrations/', title: 'Open the migration hub' }, ...migrationPosts], 'Migration')}$3`);
  }

  if (localModelPosts.length) {
    html = html.replace(/(<span class="text-red-accent font-mono text-\[0\.625rem\] font-semibold tracking-wider uppercase">Local models<\/span>[\s\S]*?<ul class="mt-4 space-y-3">)([\s\S]*?)(<\/ul>)/i, `$1${buildTopicLinkItems([{ url: '/local-models/', title: 'Open the local models hub' }, ...localModelPosts], 'Local models')}$3`);
  }

  return html;
}

function refreshAboutReaderPaths(html, canonicalUrl) {
  if (canonicalUrl !== `${siteUrl}/about/`) return html;

  const latestRelease = allPosts.find((post) => inferSection(post) === 'Releases');
  const latestSecurity = allPosts.find((post) => inferSection(post) === 'Security');
  const latestGuide = allPosts.find((post) => inferSection(post) === 'Guides');
  const latestLocalModel = allPosts.find((post) => matchesHubTopic(post, 'Local Models'));

  if (latestRelease) {
    html = html.replace(/(<h3 class="mt-0!">If you want the newest OpenClaw shipping details<\/h3>[\s\S]*?<p>[\s\S]*?Start with the <a href="\/releases\/">releases hub<\/a>, then jump into )(?:[\s\S]*?)(<\/p>)/i, `$1<a href="${latestRelease.url}">${latestRelease.title}</a> for the freshest release context.$2`);
  }

  if (latestSecurity) {
    html = html.replace(/(<h3 class="mt-0!">If you need safer self-hosting guidance<\/h3>[\s\S]*?<p>[\s\S]*?Use the <a href="\/security\/">security hub<\/a> and practical response pieces like )(?:[\s\S]*?)(<\/p>)/i, `$1<a href="${latestSecurity.url}">${latestSecurity.title}</a> for the newest hardening or advisory context.$2`);
  }

  if (latestGuide) {
    html = html.replace(/(<h3 class="mt-0!">If you are solving setup, migration, or memory questions<\/h3>[\s\S]*?<p>)(?:[\s\S]*?)(<\/p>)/i, `$1Go straight to the <a href="/guides/">guides hub</a>, then branch into the <a href="/memory/">memory hub</a> or <a href="/migrations/">migration hub</a>, with <a href="${latestGuide.url}">${latestGuide.title}</a> as a strong practical starting point.$2`);
  }

  if (latestLocalModel) {
    html = html.replace(/(<h3 class="mt-0!">If you care about local-first OpenClaw workflows<\/h3>[\s\S]*?<p>)(?:[\s\S]*?)(<\/p>)/i, `$1The <a href="/local-models/">local models hub</a> now points more directly into on-device coverage, including <a href="${latestLocalModel.url}">${latestLocalModel.title}</a> for readers trying to keep more OpenClaw work local.$2`);
  }

  return html;
}

function refreshHubFeaturedContent(html, canonicalUrl) {
  const hubConfigs = {
    [`${siteUrl}/releases/`]: {
      topic: 'Releases',
      label: 'Release',
      listHeading: 'Start here',
      ctaMap: {
        'Latest stable': 'Read the latest release breakdown',
        'Beta tracking': 'See the latest beta coverage',
      },
    },
    [`${siteUrl}/security/`]: {
      topic: 'Security',
      label: 'Security',
      listHeading: 'Key reading',
      ctaMap: {
        'Urgent patches': 'See the latest hardening release',
        'Self-hosting risk': 'Review the latest operator-focused security coverage',
        'Incident response': 'Read the latest incident-style security coverage',
      },
    },
    [`${siteUrl}/guides/`]: {
      topic: 'Guides',
      label: 'Guide',
      listHeading: 'Popular starting points',
      ctaMap: {
        'Memory setup': 'Read the latest memory guide',
        'Migration help': 'See the latest migration walkthrough',
        'Local-first workflows': 'Start with the newest local-model guide',
      },
    },
    [`${siteUrl}/local-models/`]: {
      topic: 'Local Models',
      label: 'Local models',
      listHeading: 'Start here',
      ctaMap: {
        'Portable setups': 'Read the latest Mac or local hardware guide',
        'Ollama troubleshooting': 'Open the latest Ollama or local routing guide',
      },
    },
  };

  const hub = hubConfigs[canonicalUrl];
  if (!hub) return html;

  const matchesTopic = (post) => matchesHubTopic(post, hub.topic);
  const topicPosts = allPosts.filter(matchesTopic);
  if (!topicPosts.length) return html;

  const newest = topicPosts[0];
  const newestStableOrGeneral = hub.topic === 'Releases'
    ? topicPosts.find((post) => /stable|release|hotfix|v2026\./i.test(`${post.title} ${post.excerpt}`)) || newest
    : newest;
  const newestBeta = hub.topic === 'Releases'
    ? topicPosts.find((post) => /beta|preview/i.test(`${post.title} ${post.excerpt}`)) || newest
    : null;
  const newestSecurityOperator = hub.topic === 'Security'
    ? topicPosts.find((post) => /docker|isolation|gateway|self-host|hardening|operator|pairing/i.test(`${post.title} ${post.excerpt}`)) || newest
    : null;
  const newestIncident = hub.topic === 'Security'
    ? topicPosts.find((post) => /incident|response|exposed|exploit|vulnerability|ssrf|cve/i.test(`${post.title} ${post.excerpt}`)) || newest
    : null;
  const newestMemoryGuide = hub.topic === 'Guides'
    ? topicPosts.find((post) => /memory|recall|dreaming|wiki/i.test(`${post.title} ${post.excerpt}`)) || newest
    : null;
  const newestMigrationGuide = hub.topic === 'Guides'
    ? topicPosts.find((post) => /migrate|migration|oauth|upgrade|provider/i.test(`${post.title} ${post.excerpt}`)) || newest
    : null;
  const newestLocalGuide = hub.topic === 'Guides' || hub.topic === 'Local Models'
    ? topicPosts.find((post) => /local|ollama|macbook air|gemma|mlx|wsl2|on-device/i.test(`${post.title} ${post.excerpt}`)) || newest
    : null;

  const listPosts = topicPosts.slice(0, 3);
  html = html.replace(
    new RegExp(`(<span class="text-red-accent[^"]*">${hub.listHeading}<\\/span>[\\s\\S]*?<ul class="mt-3 space-y-3">)([\\s\\S]*?)(<\\/ul>)`, 'i'),
    `$1${buildTopicLinkItems(listPosts, hub.label)}$3`
  );

  const ctaTargets = {
    'Latest stable': newestStableOrGeneral,
    'Beta tracking': newestBeta,
    'Urgent patches': newest,
    'Self-hosting risk': newestSecurityOperator,
    'Incident response': newestIncident,
    'Memory setup': newestMemoryGuide,
    'Migration help': newestMigrationGuide,
    'Local-first workflows': newestLocalGuide,
    'Portable setups': newestLocalGuide,
    'Ollama troubleshooting': newestLocalGuide,
  };

  for (const [heading, label] of Object.entries(hub.ctaMap || {})) {
    const post = ctaTargets[heading];
    if (!post) continue;
    const headingEscaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(
      new RegExp(`(<h3 class="font-display text-ink text-2xl font-semibold tracking-tight">${headingEscaped}<\\/h3>[\\s\\S]*?<a href=")([^"]+)(" class="text-ink-strong hover:text-red-accent mt-4 inline-flex font-sans text-sm font-medium">)([\\s\\S]*?)(<\\/a>)`, 'i'),
      `$1${post.url}$3${label}$5`
    );
  }

  if (canonicalUrl === `${siteUrl}/local-models/`) {
    const spotlightPosts = topicPosts.slice(0, 3);
    const cards = spotlightPosts.map((post) => `
                <article class="border-border rounded-[min(0.3vw,4px)] border p-5">
                    <a href="${post.url}" class="group block">
                        <span class="text-red-accent font-mono text-[0.625rem] font-semibold tracking-wider uppercase">${inferSection(post) === 'Guides' ? 'Guide' : 'Local models'}</span>
                        <h3 class="font-display group-hover:text-red-accent text-ink mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-xl">${post.title}</h3>
                        <p class="text-ink-body mt-3 text-[0.9375rem] text-pretty">${post.excerpt}</p>
                    </a>
                </article>`).join('');

    html = html.replace(/(<h2 id="local-models-heading"[\s\S]*?<div class="mt-8 grid gap-6 lg:grid-cols-3">)([\s\S]*?)(<\/div>\s*<\/section>)/i, `$1${cards}
            $3`);
  }

  return html;
}

function injectArticleToc(html, canonicalUrl) {
  const match = canonicalUrl.match(/\/posts\/([^/]+)\/$/);
  if (!match || html.includes('story-toc-heading')) return html;

  const articleMatch = html.match(/<article class="article-content[^>]*>([\s\S]*?)<\/article>/i);
  if (!articleMatch) return html;

  const usedIds = new Set();
  const headings = [];
  const articleWithIds = articleMatch[1].replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attrs, inner) => {
    const label = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!label) return full;

    let id = slugify(label);
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${slugify(label)}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);
    headings.push({ id, label, level: Number(level) });

    const cleanedAttrs = attrs.replace(/\sid="[^"]*"/i, '');
    return `<h${level}${cleanedAttrs} id="${id}"><a href="#${id}" class="hover:text-red-accent">${inner}</a></h${level}>`;
  });

  if (headings.length < 3) return html;

  const tocItems = headings.map((heading) => `<li class="${heading.level === 3 ? 'ml-4' : ''}"><a href="#${heading.id}" class="text-ink-strong hover:text-red-accent font-sans text-sm">${heading.label}</a></li>`).join('');
  const tocMarkup = `
        <nav class="mx-auto max-w-3xl px-4 pt-8 sm:px-6 lg:px-8" aria-labelledby="story-toc-heading">
            <div class="border-border rounded-[min(0.3vw,4px)] border bg-surface-alt p-5">
                <div class="flex items-center gap-3">
                    <h2 id="story-toc-heading" class="text-ink font-mono text-[0.6875rem] font-semibold tracking-widest uppercase">On this page</h2>
                    <div class="bg-border-strong h-px flex-1" aria-hidden="true"></div>
                </div>
                <ol class="mt-4 space-y-2">${tocItems}</ol>
            </div>
        </nav>`;

  html = html.replace(articleMatch[0], `<article class="article-content mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">${articleWithIds}</article>`);
  html = html.replace(/\n\s*<!-- Article Content -->/i, `${tocMarkup}\n\n        <!-- Article Content -->`);
  return html;
}

function injectRelatedPosts(html, canonicalUrl) {
  const match = canonicalUrl.match(/\/posts\/([^/]+)\/$/);
  if (!match || html.includes('related-posts-heading')) return html;

  const currentSlug = match[1];
  const currentPost = postBySlug.get(currentSlug);
  if (!currentPost) return html;

  const currentSection = inferSection(currentPost);
  const latestSameSection = allPosts
    .filter((post) => post && typeof post.url === 'string' && post.url !== currentPost.url && inferSection(post) === currentSection)
    .slice(0, 2);

  const related = allPosts
    .filter((post) => post && typeof post.url === 'string' && post.url !== currentPost.url)
    .map((post) => ({ post, score: scoreRelatedPosts(currentPost, post) }))
    .sort((a, b) => b.score - a.score || new Date(b.post.date) - new Date(a.post.date))
    .slice(0, 3)
    .map(({ post }) => post);

  if (related.length === 0 && latestSameSection.length === 0) return html;

  const latestCards = latestSameSection.length ? latestSameSection.map((post) => `
                    <article class="border-border rounded-[min(0.3vw,4px)] border p-4">
                        <a href="${post.url}" class="group block">
                            <span class="text-red-accent font-mono text-[0.625rem] font-semibold tracking-wider uppercase">Latest ${currentSection}</span>
                            <h3 class="font-display group-hover:text-red-accent text-ink mt-2 text-xl font-semibold tracking-tight text-balance sm:text-lg">
                                ${post.title}
                            </h3>
                            <p class="text-ink-body mt-2 text-[0.9375rem] text-pretty">${post.excerpt}</p>
                        </a>
                    </article>`).join('') : '';

  const cards = related.map((post) => `
                    <article class="border-border rounded-[min(0.3vw,4px)] border p-4">
                        <a href="${post.url}" class="group block">
                            <span class="text-red-accent font-mono text-[0.625rem] font-semibold tracking-wider uppercase">${inferSection(post)}</span>
                            <h3 class="font-display group-hover:text-red-accent text-ink mt-2 text-xl font-semibold tracking-tight text-balance sm:text-lg">
                                ${post.title}
                            </h3>
                            <p class="text-ink-body mt-2 text-[0.9375rem] text-pretty">${post.excerpt}</p>
                        </a>
                    </article>`).join('');

  const latestSection = latestCards ? `
        <section class="defer-render mx-auto max-w-3xl px-4 pb-8 sm:px-6 lg:px-8" aria-labelledby="latest-section-heading">
            <div class="border-border-strong border-t pt-8">
                <div class="flex items-center gap-3">
                    <h2 id="latest-section-heading" class="text-ink font-mono text-[0.6875rem] font-semibold tracking-widest uppercase">Latest in ${currentSection}</h2>
                    <div class="bg-border-strong h-px flex-1" aria-hidden="true"></div>
                </div>
                <p class="text-ink-muted mt-3 max-w-2xl text-sm">Fresh internal links from the same section help readers and crawlers keep moving through the newest ${currentSection.toLowerCase()} coverage.</p>
                <div class="mt-6 grid gap-4 sm:grid-cols-2">${latestCards}
                </div>
            </div>
        </section>` : '';

  const section = `
        ${latestSection}
        <section class="defer-render mx-auto max-w-3xl px-4 pb-10 sm:px-6 lg:px-8" aria-labelledby="related-posts-heading">
            <div class="border-border-strong border-t pt-8">
                <div class="flex items-center gap-3">
                    <h2 id="related-posts-heading" class="text-ink font-mono text-[0.6875rem] font-semibold tracking-widest uppercase">Related OpenClaw coverage</h2>
                    <div class="bg-border-strong h-px flex-1" aria-hidden="true"></div>
                </div>
                <p class="text-ink-muted mt-3 max-w-2xl text-sm">Keep exploring the same topic cluster with nearby release notes, security context, and practical follow-up coverage.</p>
                <div class="mt-6 grid gap-4 sm:grid-cols-3">${cards}
                </div>
            </div>
        </section>`;

  return html.replace(/\n\s*<section[^>]*aria-labelledby="continue-reading-heading"[^>]*>/i, `${section}\n\n        <section class="defer-render mx-auto max-w-3xl px-4 pb-10 sm:px-6 lg:px-8" aria-labelledby="continue-reading-heading">`);
}

function injectArticlePagination(html, canonicalUrl) {
  const match = canonicalUrl.match(/\/posts\/([^/]+)\/$/);
  if (!match) return html;

  const currentPost = postBySlug.get(match[1]);
  if (!currentPost) return html;

  const currentIndex = allPosts.findIndex((post) => post && post.url === currentPost.url);
  if (currentIndex === -1) return html;

  const newerPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const olderPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  html = html.replace(/\s*<link rel="prev" href="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/\s*<link rel="next" href="[^"]*"\s*\/?>/gi, '');

  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
  let linkTags = canonicalTag;
  if (newerPost) {
    linkTags += `\n    <link rel="prev" href="${siteUrl}${newerPost.url}" />`;
  }
  if (olderPost) {
    linkTags += `\n    <link rel="next" href="${siteUrl}${olderPost.url}" />`;
  }
  html = html.replace(canonicalTag, linkTags);

  const paginationRegex = /<div id="story-pagination" class="mt-6 grid gap-4 sm:grid-cols-2">[\s\S]*?<\/div>/i;
  if (!paginationRegex.test(html)) return html;

  const card = (post, direction, label) => {
    if (!post) {
      return `<div class="border-border rounded-[min(0.3vw,4px)] border p-4 opacity-60">
                    <span class="text-ink-faint font-mono text-[0.625rem] font-semibold tracking-wider uppercase">${label}</span>
                    <p class="text-ink-muted mt-2 text-sm">No ${direction} story available yet.</p>
                </div>`;
    }

    return `<a href="${post.url}" class="group border-border rounded-[min(0.3vw,4px)] border p-4 transition-colors hover:border-red-accent/40">
                <span class="text-red-accent font-mono text-[0.625rem] font-semibold tracking-wider uppercase">${label}</span>
                <h3 class="font-display group-hover:text-red-accent text-ink mt-2 text-xl font-semibold tracking-tight text-balance sm:text-lg">${post.title}</h3>
                <p class="text-ink-body mt-2 text-[0.9375rem] text-pretty">${post.excerpt}</p>
                <p class="text-ink-faint mt-3 font-mono text-[0.625rem] tracking-wider uppercase">${post.dateFormatted || ''}</p>
            </a>`;
  };

  const markup = `${card(newerPost, 'newer', 'Newer story')}${card(olderPost, 'older', 'Older story')}`;
  return html.replace(paginationRegex, `<div id="story-pagination" class="mt-6 grid gap-4 sm:grid-cols-2">${markup}</div>`);
}

function decorateActiveNavigation(html, canonicalUrl) {
  const navTargets = ['/', '/posts/', '/releases/', '/security/', '/guides/', '/migrations/', '/memory/', '/local-models/', '/site-map/', '/about/', '/feed.xml', '/feed.json'];

  let currentPath = canonicalUrl.replace(siteUrl, '');
  if (!currentPath.startsWith('/')) currentPath = `/${currentPath}`;
  if (currentPath === '') currentPath = '/';

  let activePath = currentPath;
  if (/^\/posts\/[^/]+\/$/.test(currentPath)) {
    const slug = currentPath.split('/').filter(Boolean).pop();
    const post = postBySlug.get(slug);
    const section = post ? inferSection(post) : 'OpenClaw News';
    activePath = sectionMeta(section).href.replace(siteUrl, '');
  } else if (/^\/posts\/\d+\/$/.test(currentPath)) {
    activePath = '/posts/';
  }

  for (const target of navTargets) {
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`<a([^>]*?)href="${escaped}"([^>]*)>`, 'g');
    html = html.replace(regex, (full, before, after) => {
      const normalizedBefore = before.replace(/\saria-current="page"/gi, '');
      const normalizedAfter = after.replace(/\saria-current="page"/gi, '');
      if (target !== activePath) return `<a${normalizedBefore}href="${target}"${normalizedAfter}>`;
      return `<a${normalizedBefore}href="${target}"${normalizedAfter} aria-current="page">`;
    });
  }

  return html;
}

function injectFreshnessSignals(html, canonicalUrl) {
  const hubMatchers = [
    {
      test: canonicalUrl === `${siteUrl}/`,
      posts: allPosts,
      headline: 'Updated from the latest OpenClaw coverage',
      detailPrefix: 'Latest archive update',
    },
    {
      test: /^https:\/\/openclawchronicles\.com\/posts\/(\d+\/)?$/.test(canonicalUrl),
      posts: allPosts,
      headline: 'Fresh archive path',
      detailPrefix: 'Latest archive update',
    },
    {
      test: canonicalUrl === `${siteUrl}/about/`,
      posts: allPosts,
      headline: 'Editorial workflow is kept current',
      detailPrefix: 'Latest site coverage refresh',
    },
    {
      test: canonicalUrl === `${siteUrl}/site-map/`,
      posts: allPosts,
      headline: 'Crawl paths refreshed from current coverage',
      detailPrefix: 'Latest archive update',
    },
    {
      test: canonicalUrl === `${siteUrl}/releases/`,
      posts: allPosts.filter((post) => matchesHubTopic(post, 'Releases')),
      headline: 'Release hub refreshed from current OpenClaw shipping news',
      detailPrefix: 'Latest release update',
    },
    {
      test: canonicalUrl === `${siteUrl}/security/`,
      posts: allPosts.filter((post) => matchesHubTopic(post, 'Security')),
      headline: 'Security hub refreshed from current advisories and hardening coverage',
      detailPrefix: 'Latest security update',
    },
    {
      test: canonicalUrl === `${siteUrl}/guides/`,
      posts: allPosts.filter((post) => matchesHubTopic(post, 'Guides')),
      headline: 'Guides hub refreshed from current tutorial coverage',
      detailPrefix: 'Latest guide update',
    },
    {
      test: canonicalUrl === `${siteUrl}/memory/`,
      posts: allPosts.filter((post) => matchesHubTopic(post, 'Memory')),
      headline: 'Memory hub refreshed from current recall and workflow coverage',
      detailPrefix: 'Latest memory update',
    },
    {
      test: canonicalUrl === `${siteUrl}/migrations/`,
      posts: allPosts.filter((post) => matchesHubTopic(post, 'Migrations')),
      headline: 'Migration hub refreshed from current provider and upgrade coverage',
      detailPrefix: 'Latest migration update',
    },
    {
      test: canonicalUrl === `${siteUrl}/local-models/`,
      posts: allPosts.filter((post) => matchesHubTopic(post, 'Local Models')),
      headline: 'Local models hub refreshed from current on-device coverage',
      detailPrefix: 'Latest local-model update',
    },
  ];

  const target = hubMatchers.find((entry) => entry.test);
  if (!target || html.includes('data-freshness-signal')) return html;

  const latestPost = (target.posts || []).slice().sort((a, b) => new Date(b.modified || b.date) - new Date(a.modified || a.date))[0];
  if (!latestPost) return html;

  const updatedLabel = formatUtcDate(latestPost.modified || latestPost.date);
  if (!updatedLabel) return html;

  const badge = `
        <div data-freshness-signal class="mt-5 inline-flex max-w-3xl flex-wrap items-center gap-2 rounded-[min(0.3vw,4px)] border border-border bg-surface-alt px-3 py-2 text-left">
            <span class="text-red-accent font-mono text-[0.625rem] font-semibold tracking-wider uppercase">${target.headline}</span>
            <span class="text-ink-muted font-sans text-xs">${target.detailPrefix}: <a href="${latestPost.url}" class="text-ink-strong hover:text-red-accent font-medium">${latestPost.title}</a> on ${updatedLabel}.</span>
        </div>`;

  return html.replace(/(<p class="font-body text-ink-muted mt-3 max-w-3xl text-lg italic">[\s\S]*?<\/p>|<p class="font-body text-ink-muted mt-4 text-lg italic">[\s\S]*?<\/p>)/i, `$1${badge}`);
}

function injectIntentHubLinks(html, canonicalUrl) {
  const match = canonicalUrl.match(/\/posts\/([^/]+)\/$/);
  if (!match) return html;

  const post = postBySlug.get(match[1]);
  if (!post) return html;

  const section = inferSection(post);
  const haystack = `${post.title} ${post.excerpt} ${post.content}`.toLowerCase();
  const links = [];
  const pushLink = (href, label) => {
    if (!links.find((link) => link.href === href)) links.push({ href, label });
  };

  pushLink(sectionMeta(section).href.replace(siteUrl, ''), `Filed under ${sectionMeta(section).label}`);
  pushLink('/posts/', 'Full archive');

  if (section === 'Releases') {
    pushLink('/security/', 'Security follow-up');
    pushLink('/migrations/', 'Upgrade and migration help');
  }
  if (section === 'Security') {
    pushLink('/releases/', 'Related release coverage');
    pushLink('/guides/', 'Hardening and setup guides');
  }
  if (section === 'Guides') {
    pushLink('/guides/', 'Guides and tutorials');
    if (/memory|recall|dreaming|wiki/.test(haystack)) pushLink('/memory/', 'Memory workflows');
    if (/migrate|migration|oauth|upgrade|provider/.test(haystack)) pushLink('/migrations/', 'Migration help');
    if (/ollama|local|mlx|macbook air|gemma|on-device/.test(haystack)) pushLink('/local-models/', 'Local model guides');
    pushLink('/releases/', 'Latest release coverage');
  }

  pushLink('/security/', 'Security coverage');
  pushLink('/guides/', 'Guides and tutorials');
  pushLink('/memory/', 'Memory guides');
  pushLink('/local-models/', 'Local models');

  const limitedLinks = links.slice(0, 6).map((link) => `<a href="${link.href}" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">${link.label}</a>`).join('');
  const intro = section === 'Security'
    ? 'Keep crawling into the security context, the related release path, and the strongest OpenClaw setup hubs.'
    : section === 'Releases'
      ? 'Keep crawling into the release timeline, upgrade guidance, and follow-up security coverage.'
      : 'Keep crawling into the strongest OpenClaw clusters that match this workflow, plus the broader archive.';

  return html.replace(/<nav class="mx-auto max-w-3xl px-4 pb-4 sm:px-6 lg:px-8" aria-label="Explore topic hubs">[\s\S]*?<\/nav>/i, `<nav class="mx-auto max-w-3xl px-4 pb-4 sm:px-6 lg:px-8" aria-label="Explore topic hubs">\n            <div class="border-border rounded-[min(0.3vw,4px)] border bg-surface-alt p-4">\n                <p class="text-ink-faint font-mono text-[0.625rem] font-semibold tracking-wider uppercase">Explore next-best paths</p>\n                <p class="text-ink-body mt-2 text-sm">${intro}</p>\n                <div class="mt-3 flex flex-wrap gap-3">${limitedLinks}</div>\n            </div>\n        </nav>`);
}

function optimizeDeferredSections(html) {
  return html.replace(/<(section|div)([^>]*class="[^"]*\bdefer-render\b[^"]*"[^>]*)>/gi, (full, tag, attrs) => {
    if (/content-visibility\s*:/.test(attrs)) return full;
    if (/\sstyle="/.test(attrs)) {
      return `<${tag}${attrs.replace(/\sstyle="([^"]*)"/, ' style="$1;content-visibility:auto;contain-intrinsic-size:1px 960px"')}>`;
    }
    return `<${tag}${attrs} style="content-visibility:auto;contain-intrinsic-size:1px 960px">`;
  });
}

function hardenExternalLinks(html) {
  return html.replace(/<a\b([^>]*?)href="(https?:\/\/[^">]+)"([^>]*)>/gi, (full, before, href, after) => {
    let attrs = `${before}href="${href}"${after}`;

    if (/\btarget="_blank"/i.test(attrs) && !/\brel=/i.test(attrs)) {
      attrs += ' rel="noopener noreferrer"';
    }

    if (/\btarget="_blank"/i.test(attrs) && /\brel="([^"]*)"/i.test(attrs)) {
      attrs = attrs.replace(/\brel="([^"]*)"/i, (match, relValue) => {
        const parts = relValue.split(/\s+/).filter(Boolean);
        for (const token of ['noopener', 'noreferrer']) {
          if (!parts.includes(token)) parts.push(token);
        }
        if (/hatchery\.so/i.test(href) && !parts.includes('sponsored')) parts.push('sponsored');
        return `rel="${parts.join(' ')}"`;
      });
    }

    return `<a${attrs}>`;
  });
}

function injectArticleMetaSummary(html, canonicalUrl) {
  const match = canonicalUrl.match(/\/posts\/([^/]+)\/$/);
  if (!match || html.includes('story-meta-summary')) return html;

  const post = postBySlug.get(match[1]);
  if (!post) return html;

  const section = inferSection(post);
  const sectionInfo = sectionMeta(section);
  const wordCount = String(post.content || '').split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 220));
  const updatedDate = new Date(post.modified || post.date);
  const updatedLabel = Number.isNaN(updatedDate.getTime())
    ? null
    : updatedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

  const summaryMarkup = `
            <div id="story-meta-summary" class="mt-5 flex flex-wrap items-center gap-2.5" aria-label="Story details">
                <a href="${sectionInfo.href.replace(siteUrl, '') || '/'}" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">Filed under ${sectionInfo.label}</a>
                <span class="border-border text-ink-muted rounded-full border px-3 py-1.5 font-sans text-xs">${readTime} min read</span>
                ${updatedLabel ? `<span class="border-border text-ink-muted rounded-full border px-3 py-1.5 font-sans text-xs">Updated ${updatedLabel}</span>` : ''}
            </div>`;

  return html.replace(/(<p class="font-body text-ink-muted mt-4 text-lg italic">[\s\S]*?<\/p>)/i, `$1${summaryMarkup}`);
}

function fixArticleMetadata(html, canonicalUrl) {
  const match = canonicalUrl.match(/\/posts\/([^/]+)\/$/);
  if (!match) return html;

  const post = postBySlug.get(match[1]);
  if (!post) return html;

  html = stripArticleOnlyMeta(html);

  const section = inferSection(post);
  const sectionInfo = sectionMeta(section);
  const words = String(post.content || '').replace(/[`*_>#\-\[\]\(\)]/g, ' ').split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const keywords = [...new Set(tokenize(`${post.title} ${post.excerpt}`))].slice(0, 8);
  const topKeywords = postKeywords(post, 3);
  const timeRequired = Math.max(1, Math.ceil(wordCount / 220));
  const schemaType = section === 'Releases' ? 'TechArticle' : 'NewsArticle';

  html = html.replace(/<meta property="article:modified_time" content="\{frontmatter\.dateModified\}"\s*\/?\s*>/i, `<meta property="article:modified_time" content="${post.modified}" />`);
  html = html.replace(/<meta property="og:updated_time" content="\{frontmatter\.dateModified\}"\s*\/?\s*>/i, `<meta property="og:updated_time" content="${post.modified}" />`);
  html = html.replace(/<meta property="og:url" content="\{frontmatter\.url\}"\s*\/?\s*>/i, `<meta property="og:url" content="${canonicalUrl}" />`);

  html = html.replace(/<meta property="og:type" content="[^\"]*"\s*\/?\s*>/i, '<meta property="og:type" content="article" />');
  html = html.replace(
    /<meta property="og:site_name" content="OpenClaw Chronicles"\s*\/?\s*>/i,
    `<meta property="og:site_name" content="OpenClaw Chronicles" />\n    <meta property="article:published_time" content="${post.date}" />\n    <meta property="article:modified_time" content="${post.modified}" />\n    <meta property="article:author" content="${post.authorName}" />\n    <meta property="article:section" content="${section}" />\n    ${topKeywords.map((keyword) => `<meta property="article:tag" content="${keyword}" />`).join('\n    ')}`
  );

  html = injectOrReplace(
    html,
    /<meta name="author" content="[^"]*"\s*\/?\s*>/i,
    `<meta name="author" content="${post.authorName}" />\n    <meta name="date" content="${post.date}" />\n    <meta name="last-modified" content="${post.modified}" />\n    <meta name="keywords" content="${keywords.join(', ')}" />\n    <meta name="news_keywords" content="${keywords.join(', ')}" />`
  );

  html = html.replace(
    /<nav class="flex items-center gap-2 font-mono text-\[0\.625rem\] tracking-wider uppercase">[\s\S]*?<\/nav>/i,
    `<nav class="flex items-center gap-2 font-mono text-[0.625rem] tracking-wider uppercase">\n                <a href="/" class="text-ink-muted hover:text-red-accent">Home</a>\n                <span class="text-ink-faint">/</span>\n                <a href="${sectionInfo.href.replace(siteUrl, '')}" class="text-ink-muted hover:text-red-accent">${sectionInfo.label}</a>\n                <span class="text-ink-faint">/</span>\n                <span class="text-ink-strong truncate max-w-[20ch]">${post.title}</span>\n            </nav>`
  );

  html = html.replace(
    /<span class="text-red-accent font-mono text-\[0\.625rem\] font-semibold tracking-wider uppercase">Article<\/span>/i,
    `<span class="text-red-accent font-mono text-[0.625rem] font-semibold tracking-wider uppercase">${section}</span>`
  );

  const topicChipMarkup = `
            <div class="mt-5 flex flex-wrap gap-2" aria-label="Filed under">
                <a href="${sectionInfo.href.replace(siteUrl, '')}" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">Filed under ${sectionInfo.label}</a>
                ${topKeywords.map((keyword) => `<a href="${sectionInfo.href.replace(siteUrl, '')}" class="border-border text-ink-muted hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">${keyword}</a>`).join('')}
            </div>`;

  html = html.replace(
    /(<p class="font-body text-ink-muted mt-4 text-lg italic">[\s\S]*?<\/p>)/i,
    `$1${topicChipMarkup}`
  );

  const articleSchema = `<!-- JSON-LD Article Schema -->\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "${schemaType}",\n      "headline": ${JSON.stringify(post.title)},\n      "description": ${JSON.stringify(post.excerpt)},\n      "image": {\n        "@type": "ImageObject",\n        "url": ${JSON.stringify(`${siteUrl}${post.ogImageUrl}`)},\n        "width": 1200,\n        "height": 630\n      },\n      "thumbnailUrl": ${JSON.stringify(`${siteUrl}${post.ogImageUrl}`)},\n      "url": ${JSON.stringify(canonicalUrl)},\n      "mainEntityOfPage": {\n        "@type": "WebPage",\n        "@id": ${JSON.stringify(canonicalUrl)}\n      },\n      "isPartOf": {\n        "@type": "WebSite",\n        "name": "OpenClaw Chronicles",\n        "url": ${JSON.stringify(siteUrl)}\n      },\n      "articleSection": ${JSON.stringify(section)},\n      "keywords": ${JSON.stringify(keywords)},\n      "isAccessibleForFree": true,\n      "about": [\n        {\n          "@type": "Thing",\n          "name": "OpenClaw"\n        },\n        {\n          "@type": "Thing",\n          "name": ${JSON.stringify(section)}\n        }\n      ],\n      "wordCount": ${wordCount},\n      "timeRequired": "PT${timeRequired}M",\n      "speakable": {\n        "@type": "SpeakableSpecification",\n        "cssSelector": [\n          "h1",\n          ".article-content h2",\n          ".article-content p"\n        ]\n      },\n      "author": {\n        "@type": "Person",\n        "name": ${JSON.stringify(post.authorName)},\n        "url": ${JSON.stringify(`${siteUrl}/about/#about-cody`)},\n        "image": ${JSON.stringify(`${siteUrl}/assets/images/authors/cody.jpg`)},\n        "jobTitle": "AI Journalist"\n      },\n      "publisher": {\n        "@type": "NewsMediaOrganization",\n        "name": "OpenClaw Chronicles",\n        "url": ${JSON.stringify(siteUrl)},\n        "logo": {\n          "@type": "ImageObject",\n          "url": ${JSON.stringify(`${siteUrl}/icon-512.png`)},\n          "width": 512,\n          "height": 512\n        },\n        "sameAs": [\n          "https://x.com/openclawai",\n          "https://github.com/tnylea/openclawchronicles"\n        ],\n        "publishingPrinciples": ${JSON.stringify(`${siteUrl}/about/#editorial-standards`)},\n        "ethicsPolicy": ${JSON.stringify(`${siteUrl}/about/#editorial-standards`)},\n        "correctionsPolicy": ${JSON.stringify(`${siteUrl}/about/#corrections-policy`)}\n      },\n      "datePublished": ${JSON.stringify(post.date)},\n      "dateModified": ${JSON.stringify(post.modified)},\n      "inLanguage": "en-US"\n    }\n    </script>${buildArticleBreadcrumbSchema(post, sectionInfo, canonicalUrl)}${buildHowToSchema(post, html)}`;

  html = html.replace(/<!-- JSON-LD Article Schema -->[\s\S]*?<script type="application\/ld\+json">[\s\S]*?<\/script>[\s\S]*?(?=\n    <script type="application\/ld\+json">\n    \{\n      "@context": "https:\/\/schema\.org",\n      "@type": "NewsMediaOrganization"|\n    <!-- Google Analytics -->)/i, articleSchema);

  return html;
}

function buildResponsiveWebpSrcset(src) {
  return buildResponsiveModernSrcset(src, 'webp');
}

function wrapImagesWithPicture(html) {
  return html.replace(/<img\b([^>]*?)\s*\/?>/gi, (full, attrs, offset) => {
    const previousPictureOpen = html.lastIndexOf('<picture', offset);
    const previousPictureClose = html.lastIndexOf('</picture>', offset);
    if (previousPictureOpen > previousPictureClose) return full;
    if (/data:|srcset=/i.test(full)) return full;

    const srcMatch = attrs.match(/\ssrc="([^"]+)"/i);
    if (!srcMatch) return full;

    const src = srcMatch[1];
    if (!/^\/assets\/images\//.test(src)) return full;
    if (/\.webp(?:$|\?)/i.test(src)) return full;
    if (/cody\.jpg|icon-|favicon|apple-touch-icon/i.test(src)) return full;

    const sizesMatch = attrs.match(/\ssizes="([^"]+)"/i);
    const sizesAttr = sizesMatch ? ` sizes="${sizesMatch[1]}"` : '';

    const sources = [
      { extension: 'avif', type: 'image/avif' },
      { extension: 'webp', type: 'image/webp' },
    ].map((format) => {
      const modernSrc = src.replace(/\.(png|jpe?g)(\?.*)?$/i, `.${format.extension}$2`);
      const modernPath = path.join(siteDir, modernSrc.replace(/^\//, '').split('?')[0]);
      if (!fs.existsSync(modernPath)) return null;

      const srcset = buildResponsiveModernSrcset(src, format.extension);
      const srcsetAttr = srcset ? ` srcset="${srcset}"` : ` srcset="${modernSrc}"`;
      return `<source${srcsetAttr}${sizesAttr} type="${format.type}">`;
    }).filter(Boolean);

    if (!sources.length) return full;

    return `<picture>${sources.join('')}${full}</picture>`;
  });
}

function optimizeImages(html) {
  let seenContentImage = false;

  return html.replace(/<img\b([^>]*?)(\s*\/?)>/gi, (full, attrs, closingSlash) => {
    let updated = attrs.replace(/\s+$/, '');
    const srcMatch = updated.match(/\ssrc="([^"]+)"/i);
    const src = srcMatch ? srcMatch[1] : '';
    const isAuthorAvatar = /cody\.jpg|rounded-full/.test(attrs);
    const isSiteIcon = /icon-|favicon|apple-touch-icon/.test(attrs);
    const isAdImage = /ad-leaderboard/i.test(src) || /house_ad/i.test(full);
    const isExplicitHero = /\bdata-seo-hero\b/i.test(attrs);
    const isLikelyHero = isExplicitHero || (!seenContentImage && !isAuthorAvatar && !isSiteIcon && !isAdImage);

    updated = updated.replace(/\sdecoding="[^"]*"/gi, '');
    updated = updated.replace(/\sloading="[^"]*"/gi, '');
    updated = updated.replace(/\sfetchpriority="[^"]*"/gi, '');
    updated = updated.replace(/\ssizes="[^"]*"/gi, '');

    if (!/\balt=/.test(updated)) updated += ' alt=""';
    if (!/\bwidth=/.test(updated) && !/\bheight=/.test(updated)) {
      if (isAuthorAvatar) updated += ' width="48" height="48"';
      else if (/\/assets\/images\/posts\//.test(src)) updated += ' width="1200" height="630"';
      else if (/about-banner\.(png|jpg|webp)$/i.test(src)) updated += ' width="1200" height="630"';
      else if (/^https:\/\/img\.youtube\.com\/vi\//i.test(src)) updated += ' width="480" height="360"';
    }
    updated += ' decoding="async"';

    if (!/\bsizes=/.test(updated)) {
      if (/aspect-16\/9/.test(attrs)) updated += ' sizes="(min-width: 1280px) 1200px, 100vw"';
      else if (/aspect-16\/10/.test(attrs)) updated += ' sizes="(min-width: 1024px) 50vw, 100vw"';
      else if (/aspect-4\/3/.test(attrs)) updated += ' sizes="(min-width: 640px) 50vw, 100vw"';
      else if (/aspect-3\/2/.test(attrs)) updated += ' sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"';
      else if (/rounded-full/.test(attrs)) updated += ' sizes="48px"';
    }

    if (isLikelyHero) {
      seenContentImage = true;
      updated += ' loading="eager" fetchpriority="high"';
    } else {
      updated += ' loading="lazy" fetchpriority="low"';
    }

    if (isAdImage) {
      updated = updated.replace(/\sloading="[^"]*"/i, ' loading="lazy"');
      updated = updated.replace(/\sfetchpriority="[^"]*"/i, ' fetchpriority="low"');
    }

    return `<img${updated}${closingSlash || ''}>`;
  });
}

for (const file of walk(siteDir)) {
  let html = fs.readFileSync(file, 'utf8');
  const canonicalUrl = normalizedUrlFromFile(file);

  html = updateCanonicalAndUrls(html, canonicalUrl);
  html = refreshSearchPanels(html);
  html = fixHomepageMetadata(html, canonicalUrl);
  html = fixAboutPageMetadata(html, canonicalUrl);
  html = fixPostsArchiveMetadata(html, canonicalUrl);
  html = fixSiteMapMetadata(html, canonicalUrl);
  html = fixTopicHubMetadata(html, canonicalUrl);
  html = injectImagePreload(html);

  const paginatedMatch = file.match(/_site\/posts\/(\d+)\/index\.html$/);
  if (paginatedMatch) {
    html = updatePaginatedArchiveLinks(html, canonicalUrl, Number(paginatedMatch[1]));
  }

  if (/_site\/posts\/index\.html$/.test(file)) {
    const nextPage = path.join(siteDir, 'posts', '2', 'index.html');
    html = html.replace(/\s*<link rel="prev" href="[^"]*"\s*\/?>/gi, '');
    html = html.replace(/\s*<link rel="next" href="[^"]*"\s*\/?>/gi, '');
    if (fs.existsSync(nextPage)) {
      html = html.replace(
        `<link rel="canonical" href="${canonicalUrl}" />`,
        `<link rel="canonical" href="${canonicalUrl}" />\n    <link rel="next" href="${siteUrl}/posts/2/" />`
      );
    }
  }

  html = fixArticleMetadata(html, canonicalUrl);
  html = injectFreshnessSignals(html, canonicalUrl);
  html = injectArticleMetaSummary(html, canonicalUrl);
  html = injectSectionAnchorsAndToc(html, canonicalUrl);
  html = injectIntentHubLinks(html, canonicalUrl);
  html = injectLatestTopicSections(html, canonicalUrl);
  html = injectHubFreshLinks(html, canonicalUrl);
  html = refreshHubFeaturedContent(html, canonicalUrl);
  html = refreshHomepageCoverageTracks(html, canonicalUrl);
  html = refreshSiteMapLatestCoverage(html, canonicalUrl);
  html = refreshAboutReaderPaths(html, canonicalUrl);
  html = injectArticleToc(html, canonicalUrl);
  html = injectRelatedPosts(html, canonicalUrl);
  html = injectArticlePagination(html, canonicalUrl);
  html = decorateActiveNavigation(html, canonicalUrl);
  html = normalizeInternalPostLinks(html);
  html = optimizeDeferredSections(html);
  html = hardenExternalLinks(html);
  html = wrapImagesWithPicture(html);
  html = optimizeImages(html);
  html = resolveResidualTemplateTokens(html, canonicalUrl);
  fs.writeFileSync(file, html);
}

console.log('Applied post-build SEO fixes to generated HTML');
