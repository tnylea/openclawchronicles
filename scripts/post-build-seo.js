const fs = require('fs');
const path = require('path');

const siteDir = path.join(__dirname, '..', '_site');
const siteUrl = 'https://openclawchronicles.com';

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

  html = optimizeImages(html);
  fs.writeFileSync(file, html);
}

console.log('Applied post-build SEO fixes to generated HTML');
