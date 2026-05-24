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
      var lastFocused = null;

      function menuFocusables() {
        return Array.from(dialog.querySelectorAll('a[href], button:not([disabled])')).filter(function (node) {
          return !node.hasAttribute('hidden');
        });
      }

      function syncExpanded(expanded) {
        openers.forEach(function (button) {
          button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        });
      }

      function closeMenu() {
        dialog.hidden = true;
        document.body.classList.remove('overflow-hidden');
        syncExpanded(false);
        if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
      }

      function openMenu(event) {
        lastFocused = event && event.currentTarget ? event.currentTarget : document.activeElement;
        dialog.hidden = false;
        document.body.classList.add('overflow-hidden');
        syncExpanded(true);
        var focusables = menuFocusables();
        if (focusables.length) focusables[0].focus();
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
        if (event.key === 'Escape' && !dialog.hidden) {
          closeMenu();
          return;
        }

        if (event.key !== 'Tab' || dialog.hidden) return;
        var focusables = menuFocusables();
        if (!focusables.length) return;

        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });

      syncExpanded(false);
    });
  }

  function bindHomeHeader() {
    var homeHeader = document.querySelector('[data-home-header]');
    if (!homeHeader) return;

    var compactBrand = homeHeader.querySelector('[data-compact-brand]');
    var ticking = false;

    var updateScrollState = function () {
      ticking = false;
      var scrolled = window.scrollY > 400;
      homeHeader.classList.toggle('bg-nav-scrolled', scrolled);
      homeHeader.classList.toggle('backdrop-blur-md', scrolled);
      homeHeader.classList.toggle('bg-surface', !scrolled);
      if (compactBrand) compactBrand.hidden = !scrolled;
    };

    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener('scroll', onScroll, { passive: true });
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

  function bindMoreDropdowns() {
    document.querySelectorAll('[data-more-dropdown]').forEach(function (root) {
      var toggle = root.querySelector('[data-more-toggle]');
      var panel = root.querySelector('[data-more-panel]');
      var chevron = root.querySelector('[data-more-chevron]');
      if (!toggle || !panel) return;

      function panelLinks() {
        return Array.from(panel.querySelectorAll('a[href]'));
      }

      function open(focusFirst) {
        panel.classList.remove('hidden');
        panel.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
        if (focusFirst) {
          var links = panelLinks();
          if (links.length) links[0].focus();
        }
      }

      function close() {
        panel.classList.add('hidden');
        panel.setAttribute('hidden', 'hidden');
        toggle.setAttribute('aria-expanded', 'false');
        if (chevron) chevron.style.transform = '';
      }

      toggle.addEventListener('click', function (event) {
        event.stopPropagation();
        if (panel.classList.contains('hidden')) open(false);
        else close();
      });

      toggle.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(true);
        }
      });

      panel.addEventListener('keydown', function (event) {
        var links = panelLinks();
        var currentIndex = links.indexOf(document.activeElement);

        if (event.key === 'Escape') {
          close();
          toggle.focus();
          return;
        }

        if (!links.length) return;

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          links[(currentIndex + 1 + links.length) % links.length].focus();
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          links[(currentIndex - 1 + links.length) % links.length].focus();
          return;
        }

        if (event.key === 'Home') {
          event.preventDefault();
          links[0].focus();
          return;
        }

        if (event.key === 'End') {
          event.preventDefault();
          links[links.length - 1].focus();
        }
      });

      root.addEventListener('focusout', function () {
        window.setTimeout(function () {
          if (!root.contains(document.activeElement)) close();
        }, 0);
      });

      document.addEventListener('click', function (event) {
        if (!root.contains(event.target)) close();
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') close();
      });

      close();
    });
  }

  function runWhenIdle(callback) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout: 1200 });
      return;
    }

    window.setTimeout(callback, 1);
  }

  var enhancementsBound = false;

  function bindNonCriticalEnhancements() {
    if (enhancementsBound) return;
    enhancementsBound = true;
    bindMobileMenus();
    bindHomeHeader();
    bindMastheadMeta();
    bindCurrentDate();
    bindMoreDropdowns();
  }

  function scheduleEnhancements() {
    runWhenIdle(bindNonCriticalEnhancements);

    ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(function (eventName) {
      window.addEventListener(eventName, bindNonCriticalEnhancements, { once: true, passive: true });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindThemeButtons();
    scheduleEnhancements();
  });

  darkModeQuery.addEventListener('change', function () {
    if (currentTheme() === 'system') applyTheme('system');
  });
})();
