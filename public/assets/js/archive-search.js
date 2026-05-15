(function () {
  function bindArchiveSearch() {
    var form = document.querySelector('[data-archive-search-form]');
    if (!form) return;

    var input = form.querySelector('[data-archive-search-input]');
    var clearButton = form.querySelector('[data-archive-search-clear]');
    var status = document.querySelector('[data-archive-search-status]');
    var emptyState = document.querySelector('[data-archive-empty]');
    var heading = document.querySelector('[data-archive-search-heading]');
    var description = document.querySelector('[data-archive-search-description]');
    var titleTemplate = document.querySelector('meta[name="archive-default-title"]');
    var descriptionTemplate = document.querySelector('meta[name="archive-default-description"]');
    var cards = Array.from(document.querySelectorAll('[data-archive-card]'));
    var params = new URLSearchParams(window.location.search);
    var defaultTitle = titleTemplate ? titleTemplate.content : document.title;
    var defaultDescription = descriptionTemplate ? descriptionTemplate.content : '';
    var defaultHeading = heading ? heading.textContent : 'All Posts';
    var defaultHeadingDescription = description ? description.textContent : defaultDescription;
    var defaultOgTitle = (document.querySelector('meta[property="og:title"]') || {}).content || defaultTitle;
    var defaultOgDescription = (document.querySelector('meta[property="og:description"]') || {}).content || defaultDescription;
    var defaultTwitterTitle = (document.querySelector('meta[name="twitter:title"]') || {}).content || defaultTitle;
    var defaultTwitterDescription = (document.querySelector('meta[name="twitter:description"]') || {}).content || defaultDescription;

    function normalize(value) {
      return String(value || '').trim().toLowerCase();
    }

    function upsertMeta(name, content) {
      var node = document.querySelector('meta[name="' + name + '"]');
      if (!node) {
        node = document.createElement('meta');
        node.setAttribute('name', name);
        document.head.appendChild(node);
      }
      node.setAttribute('content', content);
    }

    function upsertProperty(property, content) {
      var node = document.querySelector('meta[property="' + property + '"]');
      if (!node) {
        node = document.createElement('meta');
        node.setAttribute('property', property);
        document.head.appendChild(node);
      }
      node.setAttribute('content', content);
    }

    function syncSearchMetadata(query, visibleCount) {
      var canonical = document.querySelector('link[rel="canonical"]');
      var trimmed = query.trim();

      if (!trimmed) {
        document.title = defaultTitle;
        if (heading) heading.textContent = defaultHeading;
        if (description) description.textContent = defaultHeadingDescription;
        if (defaultDescription) upsertMeta('description', defaultDescription);
        upsertMeta('robots', 'index,follow,max-image-preview:large');
        upsertMeta('googlebot', 'index,follow,max-image-preview:large');
        upsertProperty('og:title', defaultOgTitle);
        upsertProperty('og:description', defaultOgDescription);
        upsertProperty('og:url', 'https://openclawchronicles.com/posts/');
        upsertMeta('twitter:title', defaultTwitterTitle);
        upsertMeta('twitter:description', defaultTwitterDescription);
        if (canonical) canonical.setAttribute('href', 'https://openclawchronicles.com/posts/');
        return;
      }

      var searchTitle = 'Search OpenClaw Chronicles for “' + trimmed + '”';
      var searchDescription = 'Filtered OpenClaw Chronicles archive results for ' + trimmed + '. Search pages stay crawl-friendly for users but are marked noindex to avoid thin query URLs in search results.';
      var searchHeading = 'Search results for “' + trimmed + '”';
      var searchHeadingDescription = visibleCount + ' OpenClaw ' + (visibleCount === 1 ? 'story matches' : 'stories match') + ' this archive search. Refine the query or jump into releases, security, guides, memory, and migration coverage from here.';

      document.title = searchTitle;
      if (heading) heading.textContent = searchHeading;
      if (description) description.textContent = searchHeadingDescription;
      upsertMeta('description', searchDescription);
      upsertMeta('robots', 'noindex,follow');
      upsertMeta('googlebot', 'noindex,follow');
      upsertProperty('og:title', searchTitle);
      upsertProperty('og:description', searchDescription);
      upsertProperty('og:url', window.location.href);
      upsertMeta('twitter:title', searchTitle);
      upsertMeta('twitter:description', searchDescription);
      if (canonical) canonical.setAttribute('href', 'https://openclawchronicles.com/posts/');

      if (status) {
        status.setAttribute('data-result-count', String(visibleCount));
      }
    }

    function updateUrl(query) {
      var url = new URL(window.location.href);
      if (query) url.searchParams.set('q', query);
      else url.searchParams.delete('q');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }

    function applySearch(rawQuery, syncUrl) {
      var query = normalize(rawQuery);
      var visibleCount = 0;

      cards.forEach(function (card) {
        var haystack = normalize(card.getAttribute('data-archive-search-text'));
        var matches = !query || haystack.indexOf(query) !== -1;
        card.hidden = !matches;
        if (matches) visibleCount += 1;
      });

      if (status) {
        status.textContent = query
          ? 'Showing ' + visibleCount + ' post' + (visibleCount === 1 ? '' : 's') + ' for “' + rawQuery.trim() + '”.'
          : 'Showing the newest OpenClaw stories.';
      }

      syncSearchMetadata(rawQuery, visibleCount);
      if (emptyState) emptyState.hidden = visibleCount !== 0;
      if (clearButton) clearButton.hidden = !query;
      if (syncUrl) updateUrl(rawQuery.trim());
    }

    input.value = params.get('q') || '';
    applySearch(input.value, false);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      applySearch(input.value, true);
    });

    input.addEventListener('input', function () {
      applySearch(input.value, true);
    });

    if (clearButton) {
      clearButton.addEventListener('click', function () {
        input.value = '';
        applySearch('', true);
        input.focus();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindArchiveSearch);
  } else {
    bindArchiveSearch();
  }
})();
