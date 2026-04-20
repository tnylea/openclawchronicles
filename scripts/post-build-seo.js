const fs = require('fs');
const path = require('path');

const siteDir = path.join(__dirname, '..', '_site');
const siteUrl = 'https://openclawchronicles.com';
const postsDir = path.join(__dirname, '..', 'content', 'posts');

function parseFrontmatter(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

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

function updateCanonicalAndUrls(html, canonicalUrl) {
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?\s*>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:url" content="${canonicalUrl}" />`);

  html = html.replace(/"url":\s*"https:\/\/openclawchronicles\.com\{frontmatter\.url\}"/g, `"url": "${canonicalUrl}"`);
  html = html.replace(/"item":\s*"https:\/\/openclawchronicles\.com\{frontmatter\.url\}"/g, `"item": "${canonicalUrl}"`);
  html = html.replace(/"@id":\s*"https:\/\/openclawchronicles\.com\{frontmatter\.url\}"/g, `"@id": "${canonicalUrl}"`);
  html = html.replace(/"url":\s*"https:\/\/openclawchronicles\.com\/"/g, (match, offset) => {
    const around = html.slice(Math.max(0, offset - 120), Math.min(html.length, offset + 120));
    if (around.includes('"@type": "WebSite"')) return match;
    return `"url": "${canonicalUrl}"`;
  });

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

  html = html.replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/i, `<meta name="description" content="${description}" />`);
  html = html.replace(/<meta name="author" content="[^"]*"\s*\/?\s*>/i, '<meta name="author" content="Cody" />');
  html = html.replace(/<meta property="og:type" content="[^"]*"\s*\/?\s*>/i, '<meta property="og:type" content="website" />');
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?\s*>/i, '<meta property="og:title" content="About OpenClaw Chronicles" />');
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:description" content="${description}" />`);
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:image" content="${ogImage}" />`);
  html = html.replace(/<meta property="og:image:alt" content="[^"]*"\s*\/?\s*>/i, '<meta property="og:image:alt" content="OpenClaw Chronicles newsroom illustration" />');
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?\s*>/i, '<meta name="twitter:title" content="About OpenClaw Chronicles" />');
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:description" content="${description}" />`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:image" content="${ogImage}" />`);
  html = html.replace(/<meta name="twitter:image:alt" content="[^"]*"\s*\/?\s*>/i, '<meta name="twitter:image:alt" content="OpenClaw Chronicles newsroom illustration" />');

  html = html.replace(
    /<!-- JSON-LD Article Schema -->[\s\S]*?<!-- Google Analytics -->/i,
    `<!-- JSON-LD Article Schema -->\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "AboutPage",\n      "name": "About OpenClaw Chronicles",\n      "url": "${canonicalUrl}",\n      "description": "${description}",\n      "mainEntity": {\n        "@type": "Organization",\n        "name": "OpenClaw Chronicles",\n        "url": "${siteUrl}",\n        "logo": "${siteUrl}/icon-512.png",\n        "sameAs": [\n          "https://x.com/openclawai",\n          "https://github.com/tnylea/openclawchronicles"\n        ]\n      }\n    }\n    </script>\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "BreadcrumbList",\n      "itemListElement": [\n        {\n          "@type": "ListItem",\n          "position": 1,\n          "name": "Home",\n          "item": "${siteUrl}/"\n        },\n        {\n          "@type": "ListItem",\n          "position": 2,\n          "name": "About",\n          "item": "${canonicalUrl}"\n        }\n      ]\n    }\n    </script>\n    <!-- Google Analytics -->`
  );

  return html;
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

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/i, `<meta name="description" content="${description}" />`);
  html = html.replace(/<meta name="author" content="[^"]*"\s*\/?\s*>/i, '<meta name="author" content="Cody" />');
  html = html.replace(/<meta property="og:type" content="[^"]*"\s*\/?\s*>/i, '<meta property="og:type" content="website" />');
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:title" content="${title}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:description" content="${description}" />`);
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:image" content="${ogImage}" />`);
  html = html.replace(/<meta property="og:image:alt" content="[^"]*"\s*\/?\s*>/i, '<meta property="og:image:alt" content="OpenClaw Chronicles archive page" />');
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:title" content="${title}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:description" content="${description}" />`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:image" content="${ogImage}" />`);
  html = html.replace(/<meta name="twitter:image:alt" content="[^"]*"\s*\/?\s*>/i, '<meta name="twitter:image:alt" content="OpenClaw Chronicles archive page" />');

  const topPosts = allPosts.slice((pageNumber - 1) * 15, (pageNumber - 1) * 15 + 10);
  const itemList = topPosts.map((post, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${siteUrl}${post.url}`,
    name: post.title,
  }));

  html = html.replace(
    /<!-- JSON-LD WebSite Schema -->[\s\S]*?<!-- Google Analytics -->/i,
    `<!-- JSON-LD WebSite Schema -->\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "CollectionPage",\n      "name": "${title.replace(/"/g, '&quot;')}",\n      "url": "${canonicalUrl}",\n      "description": "${description}",\n      "isPartOf": {\n        "@type": "WebSite",\n        "name": "OpenClaw Chronicles",\n        "url": "${siteUrl}"\n      },\n      "mainEntity": {\n        "@type": "ItemList",\n        "itemListElement": ${JSON.stringify(itemList, null, 8)}\n      }\n    }\n    </script>\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "BreadcrumbList",\n      "itemListElement": [\n        {\n          "@type": "ListItem",\n          "position": 1,\n          "name": "Home",\n          "item": "${siteUrl}/"\n        },\n        {\n          "@type": "ListItem",\n          "position": 2,\n          "name": "Posts",\n          "item": "${siteUrl}/posts/"\n        }${pageNumber > 1 ? `,\n        {\n          "@type": "ListItem",\n          "position": 3,\n          "name": "Page ${pageNumber}",\n          "item": "${canonicalUrl}"\n        }` : ''}\n      ]\n    }\n    </script>\n    <!-- Google Analytics -->`
  );

  return html;
}

function fixHomepageMetadata(html, canonicalUrl) {
  if (canonicalUrl !== `${siteUrl}/`) return html;

  const title = 'OpenClaw Chronicles, OpenClaw News, Releases, Security, and Guides';
  const description = 'OpenClaw Chronicles covers OpenClaw releases, security alerts, migration guides, tutorials, and ecosystem news with a fast, crawlable archive.';
  const ogImage = `${siteUrl}/assets/images/about-banner.jpg`;
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
  html = html.replace(/<meta property="og:image:alt" content="[^"]*"\s*\/?\s*>/i, '<meta property="og:image:alt" content="OpenClaw Chronicles homepage" />');
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:title" content="${title}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:description" content="${description}" />`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/?\s*>/i, `<meta name="twitter:image" content="${ogImage}" />`);
  html = html.replace(/<meta name="twitter:image:alt" content="[^"]*"\s*\/?\s*>/i, '<meta name="twitter:image:alt" content="OpenClaw Chronicles homepage" />');

  html = html.replace(
    /<!-- JSON-LD WebSite Schema -->[\s\S]*?<!-- Google Analytics -->/i,
    `<!-- JSON-LD WebSite Schema -->\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "WebSite",\n      "name": "OpenClaw Chronicles",\n      "url": "${canonicalUrl}",\n      "description": "${description}",\n      "publisher": {\n        "@type": "Organization",\n        "name": "OpenClaw Chronicles",\n        "url": "${siteUrl}",\n        "logo": {\n          "@type": "ImageObject",\n          "url": "${siteUrl}/icon-512.png",\n          "width": 512,\n          "height": 512\n        }\n      }\n    }\n    </script>\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "CollectionPage",\n      "name": "OpenClaw Chronicles homepage",\n      "url": "${canonicalUrl}",\n      "description": "${description}",\n      "mainEntity": {\n        "@type": "ItemList",\n        "itemListElement": ${JSON.stringify(topPosts, null, 8)}\n      }\n    }\n    </script>\n    <!-- Google Analytics -->`
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

function inferSection(post) {
  const haystack = `${post.title} ${post.excerpt} ${post.content}`.toLowerCase();
  if (/security|cve|hardening|ssrf|redos|vulnerability|exploit/.test(haystack)) return 'Security';
  if (/guide|tutorial|migrate|migration|setup|install|how to/.test(haystack)) return 'Guides';
  if (/release|beta|hotfix|changelog|shipped|stable/.test(haystack)) return 'Releases';
  return 'OpenClaw News';
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

function injectRelatedPosts(html, canonicalUrl) {
  const match = canonicalUrl.match(/\/posts\/([^/]+)\/$/);
  if (!match) return html;

  const currentSlug = match[1];
  const currentPost = postBySlug.get(currentSlug);
  if (!currentPost) return html;

  const related = allPosts
    .filter((post) => post && typeof post.url === 'string' && !post.url.includes(`/${currentSlug}/`))
    .map((post) => ({ post, score: scoreRelatedPosts(currentPost, post) }))
    .sort((a, b) => b.score - a.score || new Date(b.post.date) - new Date(a.post.date))
    .slice(0, 3)
    .map(({ post }) => post);

  if (related.length === 0 || html.includes('related-posts-heading')) return html;

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

  const section = `
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

  return html.replace(/\s*<section[^>]*aria-labelledby="continue-reading-heading"[^>]*>/i, `\n${section}\n\n        <section class="defer-render mx-auto max-w-3xl px-4 pb-10 sm:px-6 lg:px-8" aria-labelledby="continue-reading-heading">`);
}

function fixArticleMetadata(html, canonicalUrl) {
  const match = canonicalUrl.match(/\/posts\/([^/]+)\/$/);
  if (!match) return html;

  const post = postBySlug.get(match[1]);
  if (!post) return html;

  const section = inferSection(post);
  const words = String(post.content || '').replace(/[`*_>#\-\[\]\(\)]/g, ' ').split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const keywords = [...new Set(tokenize(`${post.title} ${post.excerpt}`))].slice(0, 8);
  const timeRequired = Math.max(1, Math.ceil(wordCount / 220));
  const schemaType = section === 'Releases' ? 'TechArticle' : 'NewsArticle';

  html = html.replace(/<meta property="og:type" content="[^\"]*"\s*\/?\s*>/i, '<meta property="og:type" content="article" />');
  html = html.replace(
    /<meta property="og:site_name" content="OpenClaw Chronicles"\s*\/?\s*>/i,
    `<meta property="og:site_name" content="OpenClaw Chronicles" />\n    <meta property="article:published_time" content="${post.date}" />\n    <meta property="article:modified_time" content="${post.date}" />\n    <meta property="article:section" content="${section}" />`
  );

  const articleSchema = `<!-- JSON-LD Article Schema -->\n    <script type="application/ld+json">\n    {\n      "@context": "https://schema.org",\n      "@type": "${schemaType}",\n      "headline": ${JSON.stringify(post.title)},\n      "description": ${JSON.stringify(post.excerpt)},\n      "image": {\n        "@type": "ImageObject",\n        "url": ${JSON.stringify(`${siteUrl}${post.ogImageUrl}`)},\n        "width": 1200,\n        "height": 630\n      },\n      "url": ${JSON.stringify(canonicalUrl)},\n      "mainEntityOfPage": {\n        "@type": "WebPage",\n        "@id": ${JSON.stringify(canonicalUrl)}\n      },\n      "articleSection": ${JSON.stringify(section)},\n      "keywords": ${JSON.stringify(keywords)},\n      "wordCount": ${wordCount},\n      "timeRequired": "PT${timeRequired}M",\n      "author": {\n        "@type": "Person",\n        "name": ${JSON.stringify(post.authorName)}\n      },\n      "publisher": {\n        "@type": "Organization",\n        "name": "OpenClaw Chronicles",\n        "url": ${JSON.stringify(siteUrl)},\n        "logo": {\n          "@type": "ImageObject",\n          "url": ${JSON.stringify(`${siteUrl}/icon-512.png`)},\n          "width": 512,\n          "height": 512\n        }\n      },\n      "datePublished": ${JSON.stringify(post.date)},\n      "dateModified": ${JSON.stringify(post.date)}\n    }\n    </script>`;

  html = html.replace(/<!-- JSON-LD Article Schema -->[\s\S]*?<script type="application\/ld\+json">[\s\S]*?<\/script>/i, articleSchema);

  return html;
}

function optimizeImages(html) {
  let seenContentImage = false;

  return html.replace(/<img\b([^>]*?)(\s*\/?)>/gi, (full, attrs, closingSlash) => {
    let updated = attrs.replace(/\s+$/, '');
    const isAuthorAvatar = /cody\.jpg|rounded-full/.test(attrs);
    const isSiteIcon = /icon-|favicon|apple-touch-icon/.test(attrs);
    const isLikelyHero = !seenContentImage && !isAuthorAvatar && !isSiteIcon;

    updated = updated.replace(/\sdecoding="[^"]*"/gi, '');
    updated = updated.replace(/\sloading="[^"]*"/gi, '');
    updated = updated.replace(/\sfetchpriority="[^"]*"/gi, '');

    if (!/\balt=/.test(updated)) updated += ' alt=""';
    updated += ' decoding="async"';

    if (isLikelyHero) {
      seenContentImage = true;
      updated += ' loading="eager" fetchpriority="high"';
    } else {
      updated += ' loading="lazy"';
    }

    return `<img${updated}${closingSlash || ''}>`;
  });
}

for (const file of walk(siteDir)) {
  let html = fs.readFileSync(file, 'utf8');
  const canonicalUrl = normalizedUrlFromFile(file);

  html = updateCanonicalAndUrls(html, canonicalUrl);
  html = fixHomepageMetadata(html, canonicalUrl);
  html = fixAboutPageMetadata(html, canonicalUrl);
  html = fixPostsArchiveMetadata(html, canonicalUrl);

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
  html = injectRelatedPosts(html, canonicalUrl);
  html = optimizeImages(html);
  fs.writeFileSync(file, html);
}

console.log('Applied post-build SEO fixes to generated HTML');
