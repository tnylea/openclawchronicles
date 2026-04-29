(function () {
  var storageKey = 'theme';
  var mobileBreakpoint = window.matchMedia('(min-width: 1024px)');
  var darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    return localStorage.getItem(storageKey) || 'system';
  }

  function resolveDark(mode) {
    return mode === 'dark' || (mode === 'system' && darkModeQuery.matches);
  }

  function applyTheme(mode) {
    document.documentElement.classList.toggle('dark', resolveDark(mode));
    document.querySelectorAll('[data-theme-button]').forEach(function (button) {
      var active = button.getAttribute('data-theme-button') === mode;
      button.classList.toggle('bg-switcher-active', active);
      button.classList.toggle('text-switcher-icon-active', active);
      button.classList.toggle('shadow-sm', active);
      button.classList.toggle('text-switcher-icon', !active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function setTheme(mode) {
    localStorage.setItem(storageKey, mode);
    applyTheme(mode);
  }

  function bindThemeButtons() {
    document.querySelectorAll('[data-theme-button]').forEach(function (button) {
      button.addEventListener('click', function () {
        setTheme(button.getAttribute('data-theme-button'));
      });
    });
    applyTheme(currentTheme());
  }

  function bindMobileMenus() {
    document.querySelectorAll('[data-menu-root]').forEach(function (root) {
      var dialog = root.querySelector('[data-menu-panel]');
      if (!dialog) return;

      var openers = root.querySelectorAll('[data-menu-open]');
      var closers = root.querySelectorAll('[data-menu-close]');

      function closeMenu() {
        dialog.hidden = true;
        document.body.classList.remove('overflow-hidden');
      }

      function openMenu() {
        dialog.hidden = false;
        document.body.classList.add('overflow-hidden');
      }

      openers.forEach(function (button) {
        button.addEventListener('click', openMenu);
      });

      closers.forEach(function (button) {
        button.addEventListener('click', closeMenu);
      });

      root.querySelectorAll('[data-menu-link]').forEach(function (link) {
        link.addEventListener('click', closeMenu);
      });

      mobileBreakpoint.addEventListener('change', function (event) {
        if (event.matches) closeMenu();
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !dialog.hidden) closeMenu();
      });
    });
  }

  function bindHomeHeader() {
    var homeHeader = document.querySelector('[data-home-header]');
    if (!homeHeader) return;

    var compactBrand = homeHeader.querySelector('[data-compact-brand]');
    var updateScroll = function () {
      var scrolled = window.scrollY > 400;
      homeHeader.classList.toggle('bg-nav-scrolled', scrolled);
      homeHeader.classList.toggle('backdrop-blur-md', scrolled);
      homeHeader.classList.toggle('bg-surface', !scrolled);
      if (compactBrand) compactBrand.hidden = !scrolled;
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
  }

  function bindMastheadMeta() {
    var masthead = document.querySelector('[data-masthead-meta]');
    if (!masthead) return;

    var estYearNode = masthead.querySelector('[data-est-year]');
    var issueNode = masthead.querySelector('[data-issue-number]');
    var romanNode = masthead.querySelector('[data-roman-volume]');
    var currentYear = new Date().getFullYear();
    var dates = Array.from(document.querySelectorAll('[data-post-date]'))
      .map(function (node) { return node.getAttribute('data-post-date'); })
      .filter(Boolean)
      .map(function (date) { return new Date(date); })
      .filter(function (date) { return !Number.isNaN(date.getTime()); });

    var estYear = dates.length ? Math.min.apply(null, dates.map(function (date) { return date.getFullYear(); })) : currentYear;
    var currentYearPosts = dates.filter(function (date) { return date.getFullYear() === currentYear; }).length;

    function romanize(number) {
      var numerals = [['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]];
      var output = '';
      numerals.forEach(function (entry) {
        while (number >= entry[1]) {
          output += entry[0];
          number -= entry[1];
        }
      });
      return output;
    }

    if (estYearNode) estYearNode.textContent = String(estYear);
    if (issueNode) issueNode.textContent = String(Math.max(currentYearPosts, 1)).padStart(3, '0');
    if (romanNode) romanNode.textContent = romanize((currentYear - estYear) + 1);
  }

  function bindCurrentDate() {
    var nodes = document.querySelectorAll('[data-current-date]');
    if (!nodes.length) return;

    var now = new Date();
    var iso = now.toISOString().split('T')[0];
    var label = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(now);

    nodes.forEach(function (node) {
      node.textContent = label;
      node.setAttribute('datetime', iso);
    });
  }

  function bindActiveNav() {
    var currentPath = window.location.pathname.replace(/index\.html$/, '');
    if (currentPath.length > 1 && currentPath.endsWith('/')) currentPath = currentPath.slice(0, -1);

    document.querySelectorAll('a[href^="/"]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href === '/') return;

      var normalizedHref = href.replace(/index\.html$/, '');
      if (normalizedHref.length > 1 && normalizedHref.endsWith('/')) normalizedHref = normalizedHref.slice(0, -1);

      if (normalizedHref === currentPath) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function bindArchiveSearch() {
    var form = document.querySelector('[data-archive-search-form]');
    if (!form) return;

    var input = form.querySelector('[data-archive-search-input]');
    var clearButton = form.querySelector('[data-archive-search-clear]');
    var status = document.querySelector('[data-archive-search-status]');
    var emptyState = document.querySelector('[data-archive-empty]');
    var cards = Array.from(document.querySelectorAll('[data-archive-card]'));
    var params = new URLSearchParams(window.location.search);

    function normalize(value) {
      return String(value || '').trim().toLowerCase();
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

  document.addEventListener('DOMContentLoaded', function () {
    bindThemeButtons();
    bindMobileMenus();
    bindHomeHeader();
    bindMastheadMeta();
    bindCurrentDate();
    bindActiveNav();
    bindArchiveSearch();
  });

  darkModeQuery.addEventListener('change', function () {
    if (currentTheme() === 'system') applyTheme('system');
  });
})();
