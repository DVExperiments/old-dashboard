(() => {
  'use strict';
  const CACHE_KEY = 'dv-project-catalogue-v4';
  const LEGACY_CACHE_KEY = 'dv-project-catalogue-v3';
  const bundled = Array.isArray(window.DV_PROJECTS) ? [...window.DV_PROJECTS] : [];
  const collection = window.DV_COLLECTION;
  let cached = [];
  try {
    const value = JSON.parse(localStorage.getItem(CACHE_KEY) || localStorage.getItem(LEGACY_CACHE_KEY) || 'null');
    if (Array.isArray(value?.projects) && value.projects.length) cached = value.projects.filter(x => x && typeof x.slug === 'string');
  } catch (_) { /* Local storage unavailable: fall back to bundled entries */ }
  function combine(primary, fallback) {
    const found = new Set();
    return [...primary, ...fallback].filter(p => {
      if (!p || typeof p.slug !== 'string' || found.has(p.slug)) return false;
      found.add(p.slug); return true;
    });
  }
  const repairedProject = p => collection ? collection.prepare(p) : p;
  // Recover gracefully from a deleted remote cover or invalid assigned path.
  // This also covers images in Live Lab and the single-project view.
  document.addEventListener('error', event => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    const fallback = img.dataset.fallback || 'assets/project-covers/fallback-creative.svg';
    if (img.dataset.fallbackAttempted === '1' || img.getAttribute('src') === fallback) {
      img.style.visibility = 'hidden';
      img.closest('.project-card')?.classList.add('is-image-broken');
      return;
    }
    img.dataset.fallbackAttempted = '1';
    img.src = fallback;
    img.closest('.project-card')?.classList.add('is-image-broken');
  }, true);
  let projects = combine(cached, bundled).map(repairedProject);
  function saveCatalogue(items) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({savedAt:Date.now(),projects:items})); } catch (_) {}
  }
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = (input) => String(input ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validExternal = (url) => typeof url === 'string' && /^https:\/\//i.test(url) ? url : '';
  const detailUrl = (p) => `project.html?slug=${encodeURIComponent(p.slug)}`;
  const statusText = {live:'Live online', repository:'On GitHub', development:'In development'};
  const page = document.body.dataset.page;

  function initialiseTheme() {
    let saved = 'dark';
    try { saved = localStorage.getItem('dv-theme') || 'dark'; } catch (_) { /* file:// restrictions */ }
    setTheme(saved === 'light' ? 'light' : 'dark', false);
    $$('.theme-toggle').forEach(btn => btn.addEventListener('click', () => {
      setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light', true);
    }));
  }
  function setTheme(theme, persist) {
    document.documentElement.dataset.theme = theme;
    $$('.theme-toggle').forEach(btn => {
      btn.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`);
      btn.setAttribute('title', `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`);
      const ico = $('.theme-icon', btn);
      if (ico) ico.textContent = theme === 'light' ? '☾' : '☀';
    });
    if (persist) { try { localStorage.setItem('dv-theme', theme); } catch (_) {} }
  }
  function pill(p) {
    const dot = p.status === 'live' ? '<span class="pulse-dot" aria-hidden="true"></span>' : '<span class="status-dot" aria-hidden="true"></span>';
    return `<span class="status-pill status-${escapeHTML(p.status)}">${dot}${escapeHTML(statusText[p.status] || 'Experiment')}</span>`;
  }
  function cardMarkup(p) {
    const fallback = collection.FALLBACK[p.category] || collection.FALLBACK['Creative Experiments'];
    const badge = p.platformGroup === 'Browser' ? 'WEB' : p.platformGroup === 'Desktop' ? 'DESKTOP' : p.platformGroup === 'Browser + Desktop' ? 'WEB + DESKTOP' : 'PROJECT';
    return `<article class="project-card" data-project-slug="${escapeHTML(p.slug)}" data-image-source="${escapeHTML(p.imageSource || '')}">
      <a href="${detailUrl(p)}" class="card-visual" aria-label="Explore ${escapeHTML(p.title)}">
        <img src="${escapeHTML(p.image)}" data-fallback="${escapeHTML(fallback)}" alt="${escapeHTML(p.imageAlt || '')}" loading="lazy">
        <span class="visual-arrow" aria-hidden="true">↗</span>
        <span class="card-platform">${badge}</span>
      </a>
      <div class="card-body"><div class="card-meta">${pill(p)}<span>${escapeHTML(p.category.toUpperCase())}</span></div>
      <a href="${detailUrl(p)}" class="card-title-link"><h3>${escapeHTML(p.title)}</h3><span aria-hidden="true">↗</span></a>
      <p>${escapeHTML(p.description)}</p>
      <div class="card-bottom"><span>${escapeHTML(p.platform)}</span><a href="${detailUrl(p)}" aria-label="View ${escapeHTML(p.title)} details">VIEW PROJECT →</a></div></div></article>`;
  }

  function initialiseHome() {
    let category = 'all';
    let view = 'grid';
    try { view = localStorage.getItem('dv-gallery-view') === 'list' ? 'list' : 'grid'; } catch (_) {}
    const search = $('#project-search');
    const availability = $('#project-availability');
    const platform = $('#project-platform');
    const order = $('#project-sort');
    const grid = $('#project-grid');
    const featuredGrid = $('#featured-projects');
    const emptyState = $('#empty-state');
    const count = $('#result-count');
    const filters = $('.filter-chips');
    const catalogueSync = $('#catalogue-sync');
    function renderFilters() {
      const categories = collection.GROUPS.filter(c => projects.some(p => p.category === c));
      if (category !== 'all' && !categories.includes(category)) category = 'all';
      filters.innerHTML = [['all','All projects'],...categories.map(c => [c,c])].map(([value,label]) => {
        const n = value === 'all' ? projects.length : projects.filter(p => p.category === value).length;
        return `<button class="filter-chip ${category===value?'is-active':''}" type="button" data-category="${escapeHTML(value)}" aria-pressed="${String(category===value)}">${escapeHTML(label)} <span class="filter-count">${n}</span></button>`;
      }).join('');
    }
    function ordered(items) {
      const list = items.slice();
      const byTitle = (a,b) => String(a.title).localeCompare(String(b.title));
      switch (order.value) {
        case 'az': return list.sort(byTitle);
        case 'za': return list.sort((a,b) => byTitle(b,a));
        case 'recent': return list.sort((a,b) => (Date.parse(b.updatedAt || '') || 0) - (Date.parse(a.updatedAt || '') || 0) || byTitle(a,b));
        case 'oldest': return list.sort((a,b) => (Date.parse(a.updatedAt || '') || Infinity) - (Date.parse(b.updatedAt || '') || Infinity) || byTitle(a,b));
        default: return list.sort((a,b) => Number(Boolean(b.featured))-Number(Boolean(a.featured)) || a.featuredRank-b.featuredRank || Number(b.status === 'live')-Number(a.status === 'live') || byTitle(a,b));
      }
    }
    function renderFeatured() {
      const selected = projects.filter(p => p.featured).sort((a,b) => a.featuredRank - b.featuredRank || a.title.localeCompare(b.title)).slice(0,6);
      featuredGrid.innerHTML = selected.map(p => `<a class="featured-mini" href="${detailUrl(p)}"><img loading="lazy" src="${escapeHTML(p.image)}" data-fallback="${escapeHTML(collection.FALLBACK[p.category])}" alt=""><span class="featured-mini-body"><span class="featured-mini-kicker">${escapeHTML(p.category)} ↗</span><strong>${escapeHTML(p.title)}</strong><span>${escapeHTML(p.tagline || '')}</span></span></a>`).join('');
      $('#featured-section').hidden = selected.length === 0;
    }
    function render() {
      const q = search.value.trim().toLocaleLowerCase();
      const status = availability.value;
      const platformValue = platform.value;
      const results = ordered(projects.filter(p => {
        const categoryMatches = category === 'all' || p.category === category;
        const statusMatches = status === 'all' || p.status === status;
        const platformMatches = platformValue === 'all' || p.platformGroup === platformValue ||
          (platformValue === 'Browser' && p.platformGroup === 'Browser + Desktop') ||
          (platformValue === 'Desktop' && p.platformGroup === 'Browser + Desktop');
        const blob = [p.title, p.tagline, p.description, p.category, p.platform, ...(p.tags || [])].join(' ').toLocaleLowerCase();
        return categoryMatches && statusMatches && platformMatches && (!q || blob.includes(q));
      }));
      grid.classList.toggle('is-list-view', view === 'list');
      $$('.view-choice').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.view === view);
        btn.setAttribute('aria-pressed', String(btn.dataset.view === view));
      });
      grid.innerHTML = results.map(cardMarkup).join('');
      emptyState.hidden = results.length > 0;
      count.textContent = `${results.length} of ${projects.length} ${projects.length === 1 ? 'experiment' : 'experiments'}`;
    }
    // Site-level curatorial choice: project metadata cannot unexpectedly displace NZ EcoSim.
    const DEFAULT_FEATURED = 'nz-ecosim';
    let activeLiveSlug = DEFAULT_FEATURED;
    let loadedEmbed = null; // {slug, url}; retain a running embed during GitHub metadata refresh.
    const preview = $('#live-preview');
    const simulation = $('#live-simulation');
    const loadButton = $('#live-load');
    const stopButton = $('#live-unload');

    function embeddableUrl(url) {
      if (!validExternal(url)) return '';
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.github.io') || parsed.username || parsed.password) return '';
        return parsed.href;
      } catch (_) { return ''; }
    }
    // A curated, first-party Lab entry is always available, regardless of
    // GitHub API availability, incomplete repo metadata or async sync ordering.
    // Only the gallery cards use GitHub's dynamic Pages detection.
    const PINNED_LAB_URL = 'https://dvexperiments.github.io/nz-ecosim/';
    function pinnedLiveProject() {
      const repo = projects.find(p => p.slug === DEFAULT_FEATURED) || {};
      return {
        ...repo,
        slug: DEFAULT_FEATURED,
        title: 'NZ EcoSim',
        tagline: repo.tagline || 'Build an island. Watch an ecosystem change. Discover the consequences.',
        description: repo.description || 'Explore an evolving Aotearoa-inspired ecosystem in your browser.',
        image: repo.image || 'assets/cover-nz-ecosim.svg',
        imageAlt: repo.imageAlt || 'Artwork depicting NZ EcoSim',
        status: 'live',
        embed: true,
        liveUrl: PINNED_LAB_URL
      };
    }
    function optionsForLab() {
      // Always list NZ EcoSim first; other opted-in projects remain optional.
      const others = projects.filter(p => p.slug !== DEFAULT_FEATURED &&
        p.embed === true && p.status === 'live' && embeddableUrl(p.liveUrl));
      return [pinnedLiveProject(), ...others];
    }
    function stopEmbed() {
      loadedEmbed = null;
      simulation.replaceChildren();
      simulation.hidden = true;
      preview.hidden = false;
      stopButton.hidden = true;
      $('#live-frame-status').textContent = 'READY TO EXPLORE';
    }
    function showLiveProject(p) {
      const url = embeddableUrl(p.liveUrl);
      const changed = activeLiveSlug !== p.slug;
      activeLiveSlug = p.slug;
      if (changed || (loadedEmbed && loadedEmbed.url !== url)) stopEmbed();
      $('#live-title').textContent = p.tagline || p.title;
      $('#live-description').textContent = p.description;
      $('#live-cover').dataset.fallbackAttempted = '0';
      $('#live-cover').style.visibility = '';
      $('#live-cover').src = p.image;
      $('#live-cover').dataset.fallback = collection.FALLBACK[p.category] || collection.FALLBACK['Creative Experiments'];
      $('#live-cover').alt = p.imageAlt || `Cover image for ${p.title}`;
      $('#live-embed-heading').textContent = `${p.title.toUpperCase()} / LIVE INTERACTIVE PREVIEW`;
      loadButton.textContent = `▶ Load ${p.title}`;
      loadButton.disabled = !url;
      $('#live-load-note').textContent = url
        ? 'The simulation starts when you choose to load it. Click inside to use keyboard controls. First load may take a moment.'
        : 'The browser edition is not currently available. See the project details instead.';
      const launch = $('#live-launch');
      launch.href = url || detailUrl(p);
      launch.target = url ? '_blank' : '_self';
      launch.rel = url ? 'noopener noreferrer' : '';
      launch.innerHTML = `${url ? 'Open' : 'View'} ${escapeHTML(p.title)} ${url ? 'full-screen' : 'details'} <span aria-hidden="true">↗</span>`;
      $('#live-learn').href = detailUrl(p);
      if (loadedEmbed && loadedEmbed.slug === p.slug && loadedEmbed.url === url) {
        preview.hidden = true;
        simulation.hidden = false;
        stopButton.hidden = false;
      }
    }
    function updateLiveChoices() {
      const list = optionsForLab();
      const existing = list.find(p => p.slug === activeLiveSlug);
      // Initial selection is always NZ EcoSim; explicit visitor choices are
      // preserved if the background GitHub catalogue refreshes.
      const selected = existing || list[0];
      const choices = $('#live-choices');
      choices.innerHTML = list.map(p => `<button type="button" class="live-choice ${selected?.slug === p.slug ? 'is-active' : ''}" data-live-slug="${escapeHTML(p.slug)}" aria-pressed="${String(selected?.slug === p.slug)}">${escapeHTML(p.title)}</button>`).join('');
      choices.hidden = list.length < 2;
      if (selected) showLiveProject(selected);
    }
    $('#live-choices').addEventListener('click', e => {
      const choice = e.target.closest('[data-live-slug]');
      if (!choice) return;
      const p = optionsForLab().find(x => x.slug === choice.dataset.liveSlug);
      if (!p) return;
      showLiveProject(p);
      updateLiveChoices();
    });
    loadButton.addEventListener('click', () => {
      const p = optionsForLab().find(x => x.slug === activeLiveSlug);
      if (!p) return;
      const url = embeddableUrl(p.liveUrl);
      if (!url) return;
      if (loadedEmbed?.slug === p.slug && loadedEmbed?.url === url) return;
      stopEmbed();
      const iframe = document.createElement('iframe');
      iframe.title = `${p.title} — interactive browser experiment`;
      iframe.src = url;
      iframe.loading = 'eager';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.setAttribute('allow', 'fullscreen');
      // Host only explicitly opted-in GitHub Pages apps, not arbitrary repo URLs.
      // Do not sandbox same-origin Pyodide apps with scripts+same-origin (ineffective isolation).
      simulation.appendChild(iframe);
      preview.hidden = true;
      simulation.hidden = false;
      stopButton.hidden = false;
      $('#live-frame-status').textContent = 'STARTING BROWSER SIMULATION';
      iframe.addEventListener('load', () => {
        if (loadedEmbed?.slug === p.slug) $('#live-frame-status').textContent = 'SITE LOADED · WAIT FOR SIMULATION';
      });
      iframe.addEventListener('error', () => {
        if (loadedEmbed?.slug === p.slug) $('#live-frame-status').textContent = 'FAILED TO LOAD · OPEN FULL-SCREEN';
      });
      loadedEmbed = {slug:p.slug, url};
    });
    stopButton.addEventListener('click', stopEmbed);

    function refresh(syncState) {
      // #1 in the editor's ordered selection controls the hero artwork.
      // The separately curated Live Lab below remains pinned to NZ EcoSim.
      const featured = projects.filter(p => p.featured).sort((a,b) => a.featuredRank-b.featuredRank)[0] || pinnedLiveProject();
      if (featured) {
        $('#hero-featured-image').src = featured.image;
        $('#hero-featured-image').dataset.fallback = collection.FALLBACK[featured.category] || collection.FALLBACK['Creative Experiments'];
        $('#hero-featured-image').alt = featured.imageAlt;
        $('#hero-featured-title').textContent = featured.title;
        $('#hero-featured-link').href = detailUrl(featured);
        $('#hero-featured-link').setAttribute('aria-label', `View ${featured.title} project`);
        $('#hero-featured-image-link').href = detailUrl(featured);
        const liveText = $('#featured-hero .live-indicator');
        if (liveText) liveText.innerHTML = featured.status === 'live'
          ? '<span class="pulse-dot"></span> OPEN IN BROWSER'
          : '<span class="status-dot"></span> FEATURED EXPERIMENT';
      }
      updateLiveChoices();
      $('#stat-projects').textContent = String(projects.length).padStart(2, '0');
      $('#stat-live').textContent = String(projects.filter(p => p.status === 'live').length).padStart(2, '0');
      catalogueSync.textContent = syncState === 'success' ? '↻ SYNCED WITH PUBLIC GITHUB REPOS'
        : syncState === 'error' ? 'OFFLINE / SHOWING SAVED PROJECT LIST' : 'CHECKING PUBLIC REPOSITORIES…';
      renderFeatured(); renderFilters(); render();
    }
    filters.addEventListener('click', event => {
      const chip = event.target.closest('.filter-chip');
      if (!chip) return;
      category = chip.dataset.category;
      renderFilters(); render();
    });
    search.addEventListener('input', render);
    availability.addEventListener('change', render);
    platform.addEventListener('change', render);
    order.addEventListener('change', render);
    $$('.view-choice').forEach(btn => btn.addEventListener('click', () => {
      view = btn.dataset.view === 'list' ? 'list' : 'grid';
      try { localStorage.setItem('dv-gallery-view', view); } catch (_) {}
      render();
    }));
    $('#reset-filters').addEventListener('click', () => {
      search.value = ''; availability.value = 'all'; platform.value = 'all'; order.value = 'featured'; category = 'all';
      renderFilters(); render(); search.focus();
    });
    $$('.random-project').forEach(btn => btn.addEventListener('click', () => {
      if (!projects.length) return;
      const index = Math.floor(Math.random() * projects.length);
      window.location.href = detailUrl(projects[index]);
    }));
    refresh('loading');
    return refresh;
  }

  function initialiseProject() {
    function refresh(loading) {
    const slug = new URLSearchParams(window.location.search).get('slug');
    const p = projects.find(p => p.slug === slug);
    const main = $('#project-detail');
    const related = $('#related-grid');
    if (!p) {
      if (loading) return;
      document.title = 'Project not found — DV Experiments';
      main.innerHTML = `<div class="not-found"><p class="section-kicker">404 / UNDISCOVERED</p><h1>No experiment found<span class="period">.</span></h1><p>That project may have moved, or the link isn't quite right.</p><a class="button button-primary" href="./#projects">Return to the collection ↗</a></div>`;
      $('#more-projects').hidden = true;
      return;
    }
    document.title = `${p.title} — DV Experiments`;
    $('meta[name="description"]').setAttribute('content', p.description);
    const launchUrl = validExternal(p.liveUrl);
    const repoUrl = validExternal(p.repoUrl);
    let actions = '';
    if (launchUrl) actions += `<a class="button button-primary" href="${escapeHTML(launchUrl)}" target="_blank" rel="noopener noreferrer">Launch in browser <span aria-hidden="true">↗</span></a>`;
    if (repoUrl) actions += `<a class="button ${launchUrl ? 'button-outline' : 'button-primary'}" href="${escapeHTML(repoUrl)}" target="_blank" rel="noopener noreferrer">View on GitHub <span aria-hidden="true">↗</span></a>`;
    if (!actions) actions = `<span class="unavailable-note">Public release link coming when the project is published.</span>`;
    main.innerHTML = `<section class="detail-heading" aria-labelledby="detail-title"><p class="section-kicker">EXPERIMENT / ${String(projects.indexOf(p) + 1).padStart(2, '0')} · ${escapeHTML(p.year)}</p><div class="detail-title-row"><div><div class="detail-status">${pill(p)}<span>${escapeHTML(p.category)} / ${escapeHTML(p.platform)}</span></div><h1 id="detail-title">${escapeHTML(p.title)}<span class="period">.</span></h1><p class="detail-tagline">${escapeHTML(p.tagline)}</p></div><span class="detail-asterisk" aria-hidden="true">✳</span></div></section>
      <figure class="detail-cover"><img src="${escapeHTML(p.image)}" data-fallback="${escapeHTML(collection.FALLBACK[p.category])}" alt="${escapeHTML(p.imageAlt)}"><figcaption>PROJECT ARTWORK · ILLUSTRATIVE VISUAL</figcaption></figure>
      <div class="detail-content"><div class="detail-left"><div class="detail-actions">${actions}</div><p class="detail-label">THE SHORT VERSION</p><p class="detail-intro">${escapeHTML(p.description)}</p><div class="tag-list" aria-label="Project tags">${(p.tags || []).map(tag => `<span>${escapeHTML(tag)}</span>`).join('')}</div></div><div class="detail-right"><div class="detail-section"><p class="detail-label">ABOUT THE EXPERIMENT</p>${(p.overview || []).map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join('')}</div>${(p.highlights || []).length ? `<div class="detail-section"><p class="detail-label">THINGS TO EXPLORE</p><ul class="highlight-list">${p.highlights.map(text => `<li><span aria-hidden="true">↗</span>${escapeHTML(text)}</li>`).join('')}</ul></div>` : ''}${p.notice ? `<div class="project-note"><strong>A note on availability</strong><p>${escapeHTML(p.notice)}</p></div>` : ''}</div></div>`;
    const other = projects.filter(x => x.slug !== p.slug).sort((a,b) => Number(b.category === p.category) - Number(a.category === p.category)).slice(0, 2);
    related.innerHTML = other.map(cardMarkup).join('');
    }
    refresh(true);
    return refresh;
  }

  initialiseTheme();
  $$('.current-year').forEach(x => { x.textContent = String(new Date().getFullYear()); });
  const update = page === 'home' ? initialiseHome() : page === 'project' ? initialiseProject() : null;
  // A complete prebuilt catalogue from GitHub Actions is independent of each visitor's
  // GitHub API rate limit. Load it before attempting optional live discovery.
  const configReady = fetch('data/project-curation.json', {cache:'no-cache'})
    .then(async response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      collection.setConfig(await response.json());
      projects = projects.map(repairedProject);
      if (update) update(page === 'home' ? 'loading' : true);
    }).catch(error => console.warn('Curation file unavailable; using default artwork:', error.message));
  const snapshotReady = configReady.then(() => fetch('data/projects-catalogue.json', {cache:'no-cache'}))
    .then(async response => {
      if (!response.ok) return;
      const snapshot = await response.json();
      if (!Array.isArray(snapshot.projects) || snapshot.projects.length === 0) return;
      projects = combine(snapshot.projects, projects).map(repairedProject);
      saveCatalogue(projects);
      if (update) update(page === 'home' ? 'success' : false);
    }).catch(error => console.warn('Static project snapshot unavailable:', error.message));
  if (update && window.DV_SYNC) {
    snapshotReady.then(() => window.DV_SYNC.discover(projects)).then(latest => {
      projects = combine(latest, projects).map(repairedProject);
      saveCatalogue(projects);
      update(page === 'home' ? 'success' : false);
    }).catch(error => {
      console.warn('GitHub sync unavailable; showing saved catalogue:', error.message);
      update(page === 'home' ? 'error' : false);
    });
  }
  // Public gallery shares identical curation rules with the private Cover Manager.
  window.DV_GET_PROJECTS = () => projects.slice();
  window.DV_CATALOGUE_READY = snapshotReady;
})();
