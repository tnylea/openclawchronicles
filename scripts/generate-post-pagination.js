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
                                    <img src="${post.authorPicture}" class="size-8 rounded-full" alt="${post.authorName}" />
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

function pagination(page) {
  if (totalPages <= 1) return '';

  const prevDisabled = page === 1;
  const nextDisabled = page === totalPages;
  const prevHref = prevDisabled ? '#' : pageHref(page - 1);
  const nextHref = nextDisabled ? '#' : pageHref(page + 1);

  const numbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .map((n) => {
      const active = n === page;
      return `<a href="${pageHref(n)}" class="min-w-[1.75rem] h-7 px-1.5 rounded font-mono text-[0.625rem] font-semibold tracking-wider transition-colors inline-flex items-center justify-center ${active ? 'bg-red-accent text-white' : 'text-ink-muted hover:text-ink'}">${n}</a>`;
    })
    .join('\n                            ');

  return `
            <div class="mt-10 flex items-center justify-between gap-4 border-border border-t pt-8">
                ${prevDisabled
                  ? `<span class="inline-flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold tracking-wider uppercase text-ink-muted opacity-30">Prev</span>`
                  : `<a href="${prevHref}" class="inline-flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold tracking-wider uppercase text-ink-muted hover:text-ink transition-colors">Prev</a>`}

                <div class="flex items-center gap-1">
                            ${numbers}
                </div>

                ${nextDisabled
                  ? `<span class="inline-flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold tracking-wider uppercase text-ink-muted opacity-30">Next</span>`
                  : `<a href="${nextHref}" class="inline-flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold tracking-wider uppercase text-ink-muted hover:text-ink transition-colors">Next</a>`}
            </div>`;
}

function buildSection(page) {
  const start = (page - 1) * perPage;
  const chunk = posts.slice(start, start + perPage);
  const cards = chunk.map(postCard).join('\n');

  return `<!-- POSTS_PAGINATION_START -->
        <section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
