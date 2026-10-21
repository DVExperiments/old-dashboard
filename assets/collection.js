/* DV Experiments v1.6.2 — presentation rules shared by gallery, details and Cover Manager. */
(() => {
  'use strict';
  const GROUPS = [
    'Simulations & Worlds', 'Tools & Utilities', 'Games & Interactive',
    'Data & Visualisation', 'Creative Experiments'
  ];
  const FALLBACK = {
    'Simulations & Worlds': 'assets/project-covers/fallback-simulations.svg',
    'Tools & Utilities': 'assets/project-covers/fallback-tools.svg',
    'Games & Interactive': 'assets/project-covers/fallback-games.svg',
    'Data & Visualisation': 'assets/project-covers/fallback-data.svg',
    'Creative Experiments': 'assets/project-covers/fallback-creative.svg'
  };
  const validCover = v => typeof v === 'string' && (
    /^https:\/\/[^\s<>"']+$/i.test(v) ||
    /^(?!\/|\.\/)(?!.*\.\.)(?:[a-z0-9_.-]+\/)*[a-z0-9_.-]+\.(?:png|jpe?g|webp|gif|svg)$/i.test(v)
  );
  const slugify = v => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const generic = v => !v || /(?:^|\/)cover-default\.svg$/i.test(v) || /(?:^|\/)fallback-(?:simulations|tools|games|data|creative)\.svg$/i.test(v);
  const repoName = p => {
    const fromUrl = String(p.repoUrl || '').match(/^https:\/\/github\.com\/DVExperiments\/([^/?#]+)/i);
    return (p._repoName || (fromUrl && decodeURIComponent(fromUrl[1])) || p.slug || '').toLowerCase();
  };
  function groupFor(category) {
    const s = String(category || '').trim().toLowerCase();
    if (GROUPS.some(g => g.toLowerCase() === s)) return GROUPS.find(g => g.toLowerCase() === s);
    if (/simulat|ecosystem|world|management/.test(s)) return GROUPS[0];
    if (/tool|utility|productiv|dashboard|educat/.test(s)) return GROUPS[1];
    if (/game|interact|virtual.pet/.test(s)) return GROUPS[2];
    if (/data|visual|news|research|map|analytic/.test(s)) return GROUPS[3];
    return GROUPS[4];
  }
  function platformFor(p) {
    const value = String(p.platform || '').toLowerCase();
    const browser = /browser|web|html|javascript|github pages|online/.test(value) || p.status === 'live';
    const desktop = /desktop|windows|macos|linux|pygame|pyside|qt/.test(value);
    return browser && desktop ? 'Browser + Desktop' : browser ? 'Browser' : desktop ? 'Desktop' : 'Other';
  }
  let config = {version:1, projects:{}};
  function setConfig(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return;
    config = {version:1, ...data, projects: data.projects && typeof data.projects === 'object' && !Array.isArray(data.projects) ? data.projects : {}};
  }
  function overrideFor(p) {
    const entries = config.projects;
    const keys = [repoName(p), String(p.slug || '').toLowerCase(), slugify(repoName(p))];
    for (const key of keys) if (Object.prototype.hasOwnProperty.call(entries,key) && entries[key] && typeof entries[key] === 'object') return entries[key];
    return {};
  }
  function prepare(p) {
    if (!p || typeof p !== 'object') return p;
    const rawImage = p._sourceImage ?? p.image;
    const rawCategory = p._sourceCategory ?? p.category;
    const rawFeatured = p._sourceFeatured ?? p.featured;
    const override = overrideFor(p);
    const group = groupFor(override.category || rawCategory);
    const identity = repoName(p);
    const featuredOrder = Array.isArray(config.featuredOrder) ? config.featuredOrder : null;
    const rank = featuredOrder ? featuredOrder.indexOf(identity) : -1;
    const isFeatured = featuredOrder ? rank >= 0 : typeof override.featured === 'boolean' ? override.featured : Boolean(rawFeatured);
    const mapped = validCover(override.cover) ? override.cover : '';
    const original = validCover(rawImage) && !generic(rawImage) ? rawImage : '';
    // The curator can deliberately override an existing per-repository or bundled cover.
    const image = mapped || original || FALLBACK[group];
    const imageSource = mapped ? 'curated' : original ? 'project' : 'fallback';
    return {...p, _sourceImage:rawImage, _sourceCategory:rawCategory, _sourceFeatured:rawFeatured,
      title: typeof override.title === 'string' && override.title.trim() ? override.title.trim() : p.title,
      category:group, categoryGroup:group,
      featured:isFeatured, featuredRank:rank >= 0 ? rank : Number.MAX_SAFE_INTEGER,
      image, imageSource, platformGroup:platformFor(p),
      imageAlt:typeof override.imageAlt === 'string' && override.imageAlt.trim() ? override.imageAlt.trim() : (p.imageAlt || `Cover artwork for ${p.title || 'project'}`)};
  }
  window.DV_COLLECTION = {GROUPS, FALLBACK, groupFor, platformFor, validCover, generic, repoName, slugify, prepare, setConfig, getConfig:() => config, overrideFor};
})();
