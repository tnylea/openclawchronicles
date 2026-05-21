const fs = require('fs');
const path = require('path');

const siteDir = path.join(__dirname, '..', '_site');
const postsDir = path.join(siteDir, 'posts');
const sourceHtmlPath = path.join(postsDir, 'index.html');
const collectionPath = path.join(__dirname, '..', 'collections', 'content', 'posts.json');

const perPage = 15;
const raw = fs.readFileSync(sourceHtmlPath, 'utf8');
const posts = JSON.parse(fs.readFileSync(collectionPath, 'utf8'))
  .sort((a, b) => new Date(b.date) - new Date(a.date));

const totalPages = Math.max(1, Math.ceil(posts.length / perPage));

function postCard(post) {
  return `
                    <article>
                        <a href="${post.link}" class="group">
                            <div class="overflow-hidden rounded-[min(0.3vw,4px)]">
                                <img
                                    src="${post.coverImage}"
                                    alt="${post.title}"
                                    width="1200"
                                    height="800"
                                    class="outline-img-outline aspect-3/2 w-full object-cover outline-1 -outline-offset-1 transition-transform duration-300 group-hover:scale-105" />
                            </div>
                            <div class="mt-4">
                                <span class="text-red-accent font-mono text-[0.625rem] font-semibold tracking-wider uppercase">Article</span>
                                <h3 class="font-display group-hover:text-red-accent text-ink mt-1 text-xl font-semibold tracking-tight text-balance">
                                    ${post.title}
                                </h3>
                                <p class="font-body text-ink-body mt-2 text-[0.9375rem] text-pretty">
                                    ${post.excerpt}
                                </p>
                                <div class="mt-4 flex items-center gap-3">
                                    <img src="${post.authorPicture}" class="size-8 rounded-full" alt="${post.authorName}" width="32" height="32" loading="lazy" decoding="async" />
                                    <span class="text-ink-strong font-sans text-[0.8125rem] font-semibold">${post.authorName}</span>
                                    <span class="text-ink-faint font-mono text-[0.625rem] tracking-wider uppercase">${post.dateFormatted}</span>
                                </div>
                            </div>
                        </a>
                    </article>`;
}

function pageHref(page) {
  return page === 1 ? '/posts/' : `/posts/${page}/`;
}

function visiblePages(currentPage) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set([1, 2, totalPages - 1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

function paginationNumbers(page) {
  const pages = visiblePages(page);
  const parts = [];

  pages.forEach((n, index) => {
    if (index > 0 && n - pages[index - 1] > 1) {
      parts.push('<span class="px-1 font-mono text-[0.625rem] font-semibold tracking-wider text-ink-faint" aria-hidden="true">…</span>');
    }

    const active = n === page;
    parts.push(`<a href="${pageHref(n)}" ${active ? 'aria-current="page"' : ''} aria-label="Archive page ${n}" class="min-w-[1.75rem] h-7 px-1.5 rounded font-mono text-[0.625rem] font-semibold tracking-wider transition-colors inline-flex items-center justify-center ${active ? 'bg-red-accent text-white' : 'text-ink-muted hover:text-ink'}">${n}</a>`);
  });

  return parts.join('\n                            ');
}

function pagination(page) {
  if (totalPages <= 1) return '';

  const prevDisabled = page === 1;
  const nextDisabled = page === totalPages;
  const prevHref = prevDisabled ? '#' : pageHref(page - 1);
  const nextHref = nextDisabled ? '#' : pageHref(page + 1);

  const numbers = paginationNumbers(page);
  const firstLink = page > 3
    ? `<a href="${pageHref(1)}" aria-label="Go to the first archive page" class="inline-flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold tracking-wider uppercase text-ink-muted hover:text-ink transition-colors">First</a>`
    : '';
  const lastLink = page < totalPages - 2
    ? `<a href="${pageHref(totalPages)}" aria-label="Go to the last archive page" class="inline-flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold tracking-wider uppercase text-ink-muted hover:text-ink transition-colors">Last</a>`
    : '';

  return `
            <nav class="mt-10 border-border border-t pt-8" aria-label="Archive pagination">
                <div class="flex items-center justify-between gap-4">
                    ${prevDisabled
                      ? `<span class="inline-flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold tracking-wider uppercase text-ink-muted opacity-30">Prev</span>`
                      : `<a href="${prevHref}" rel="prev" aria-label="Go to archive page ${page - 1}" class="inline-flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold tracking-wider uppercase text-ink-muted hover:text-ink transition-colors">Prev</a>`}

                    <div class="flex items-center gap-1" aria-label="Archive page numbers">
                                ${firstLink}
                                ${numbers}
                                ${lastLink}
                    </div>

                    ${nextDisabled
                      ? `<span class="inline-flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold tracking-wider uppercase text-ink-muted opacity-30">Next</span>`
                      : `<a href="${nextHref}" rel="next" aria-label="Go to archive page ${page + 1}" class="inline-flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold tracking-wider uppercase text-ink-muted hover:text-ink transition-colors">Next</a>`}
                </div>
            </nav>`;
}

function buildSection(page) {
  const start = (page - 1) * perPage;
  const chunk = posts.slice(start, start + perPage);
  const cards = chunk.map(postCard).join('\n');

  return `<!-- POSTS_PAGINATION_START -->
        <section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div class="mb-6 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p class="text-red-accent font-mono text-[0.625rem] font-semibold tracking-wider uppercase">Archive navigation</p>
                    <p class="text-ink-muted mt-2 max-w-2xl text-sm">Page ${page} of ${totalPages}. Browse older OpenClaw releases, security advisories, tutorials, and ecosystem coverage through the full archive.</p>
                </div>
                <a href="/site-map/" class="inline-flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold tracking-wider uppercase text-red-accent transition-colors hover:text-red-vibrant">Browse topic hubs and evergreen links</a>
            </div>
            <div class="mb-8 grid gap-4 lg:grid-cols-2">
                <article class="border-border rounded-[min(0.3vw,4px)] border bg-surface-alt p-4">
                    <p class="text-red-accent font-mono text-[0.625rem] font-semibold tracking-wider uppercase">Jump by topic</p>
                    <div class="mt-3 flex flex-wrap gap-3">
                        <a href="/releases/" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">Releases</a>
                        <a href="/security/" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">Security</a>
                        <a href="/guides/" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">Guides</a>
                        <a href="/memory/" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">Memory</a>
                        <a href="/migrations/" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">Migrations</a>
                        <a href="/local-models/" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">Local models</a>
                    </div>
                </article>
                <article class="border-border rounded-[min(0.3vw,4px)] border bg-surface-alt p-4">
                    <p class="text-red-accent font-mono text-[0.625rem] font-semibold tracking-wider uppercase">Popular searches</p>
                    <div class="mt-3 flex flex-wrap gap-3">
                        <a href="/posts/?q=release" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">Release notes</a>
                        <a href="/posts/?q=security" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">Security fixes</a>
                        <a href="/posts/?q=memory" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">Memory guides</a>
                        <a href="/posts/?q=migration" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">Migration help</a>
                        <a href="/posts/?q=local+model" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">Local models</a>
                        <a href="/posts/?q=discord+voice" class="border-border text-ink-strong hover:text-red-accent rounded-full border px-3 py-1.5 font-sans text-xs font-medium">Discord voice</a>
                    </div>
                </article>
            </div>
            <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
${cards}
            </div>
${pagination(page)}
        </section>
        <!-- POSTS_PAGINATION_END -->`;
}

function replaceSection(html, page) {
  return html.replace(/<!-- POSTS_PAGINATION_START -->[\s\S]*?<!-- POSTS_PAGINATION_END -->/, buildSection(page));
}

for (let page = 1; page <= totalPages; page++) {
  const html = replaceSection(raw, page);
  const outDir = page === 1 ? postsDir : path.join(postsDir, String(page));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

console.log(`Generated paginated post archives: ${totalPages} page(s)`);
