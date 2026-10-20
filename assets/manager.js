/* DV Experiments Cover Manager: zero credentials, zero server-side writes. */
(() => {
  'use strict';
  const C = window.DV_COLLECTION;
  const $ = selector => document.querySelector(selector);
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const local = Array.isArray(window.DV_PROJECTS) ? window.DV_PROJECTS : [];
  const stage = new Map(); // key -> {blob, url, path}
  const badImages = new Set();
  const checkedImages = new Set();
  let projects = local.map(C.prepare);
  let config = {version:1, projects:{}};
  let modified = false;
  let liveStatus = 'Loading public projects…';

  function theme(value) {
    document.documentElement.dataset.theme = value;
    $('.theme-icon').textContent = value === 'light' ? '☾' : '☀';
    $('.theme-toggle').setAttribute('aria-label', `Switch to ${value === 'light' ? 'dark' : 'light'} theme`);
  }
  let initialTheme = 'dark';
  try { initialTheme = localStorage.getItem('dv-theme') === 'light' ? 'light' : 'dark'; } catch (_) {}
  theme(initialTheme);
  $('.theme-toggle').addEventListener('click', () => {
    const value = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    theme(value);
    try { localStorage.setItem('dv-theme', value); } catch (_) {}
  });

  function projectKey(p) { return C.repoName(p) || p.slug; }
  function patchFor(key) {
    if (!config.projects || typeof config.projects !== 'object') config.projects = {};
    if (!config.projects[key]) config.projects[key] = {};
    return config.projects[key];
  }
  function apply() {
    C.setConfig(config);
    projects = projects.map(C.prepare);
  }
  function quality(p) {
    const key = projectKey(p);
    return badImages.has(key) ? 'broken' : stage.has(key) ? 'staged' : p.imageSource === 'fallback' ? 'fallback' : p.imageSource || 'project';
  }
  function tally() {
    $('#m-total').textContent = projects.length;
    $('#m-fallback').textContent = projects.filter(p => quality(p) === 'fallback').length;
    $('#m-custom').textContent = projects.filter(p => !['fallback','broken'].includes(quality(p))).length;
    $('#m-broken').textContent = badImages.size;
    $('#m-pending').textContent = `${stage.size} new ${stage.size === 1 ? 'cover' : 'covers'} · ${modified ? 'mapping edited' : 'no mapping edits'}`;
    $('#m-sync').textContent = liveStatus;
  }
  function imageSrc(p) { return stage.get(projectKey(p))?.url || p.image; }
  function item(p) {
    const key = projectKey(p);
    const q = quality(p);
    const description = p.description || '';
    const metadata = !description || /public project in the dv experiments collection/i.test(description) ? ' · Description needs attention' : '';
    const status = q === 'staged' ? 'Ready to export' : q === 'fallback' ? 'Needs custom cover' : q === 'broken' ? 'Broken image: replacement needed' : q === 'curated' ? 'Central cover assigned' : 'Existing project artwork';
    return `<article class="manager-item ${q === 'staged' ? 'is-staged' : ''}" data-project="${safe(key)}">
      <div class="manager-thumb"><img src="${safe(imageSrc(p))}" alt="" loading="lazy" data-project-image="${safe(key)}"><span>${safe(p.status === 'live' ? 'LIVE' : (p.status || 'PROJECT').toUpperCase())}</span></div>
      <div class="manager-details"><strong>${safe(p.title)}</strong><span class="manager-quality ${safe(q)}">${safe(status)}</span><small>${safe(p.platform || 'Unspecified platform')}${safe(metadata)}</small>${p.repoUrl ? `<a target="_blank" rel="noopener noreferrer" href="${safe(p.repoUrl)}">Repository ↗</a>` : `<small>Local-only project</small>`}</div>
      <div class="manager-inputs"><label>Category<select data-category-select="${safe(key)}">${C.GROUPS.map(g => `<option value="${safe(g)}" ${p.category === g ? 'selected' : ''}>${safe(g)}</option>`).join('')}</select></label>
        <div class="manager-quick"><label class="is-featured"><input type="checkbox" data-featured="${safe(key)}" ${p.featured ? 'checked' : ''}> Featured</label>
        <label class="manager-upload">Choose image<input type="file" accept="image/png,image/jpeg,image/webp" data-cover="${safe(key)}" aria-label="Choose cover image for ${safe(p.title)}"></label>
        <button class="manager-remove" type="button" data-remove="${safe(key)}" title="Clear custom cover assignment">Clear cover</button></div>
      </div>
    </article>`;
  }
  function render() {
    const text = $('#m-search').value.trim().toLowerCase();
    const filter = $('#m-filter').value;
    const filtered = projects.filter(p => {
      const q = quality(p);
      return (!text || [p.title,p.description,p.category,p.platform,projectKey(p)].join(' ').toLowerCase().includes(text)) &&
        (filter === 'all' || (filter === 'missing' && (q === 'fallback' || q === 'broken')) ||
        (filter === 'broken' && q === 'broken') || (filter === 'staged' && q === 'staged'));
    }).sort((a,b) => {
      const rank = p => quality(p) === 'broken' ? 0 : quality(p) === 'fallback' ? 1 : quality(p) === 'staged' ? 2 : 3;
      return rank(a) - rank(b) || String(a.title).localeCompare(String(b.title));
    });
    $('#m-result').textContent = `${filtered.length} of ${projects.length} projects`;
    $('#m-grid').innerHTML = filtered.length ? filtered.map(item).join('') : '<div class="manager-empty">No projects match this filter.</div>';
    tally();
  }
  function merge(primary, secondary) {
    const found = new Set();
    return [...primary,...secondary].filter(p => {
      if (!p || typeof p.slug !== 'string') return false;
      const key = projectKey(p);
      if (found.has(key)) return false;
      found.add(key); return true;
    });
  }
  async function load() {
    try {
      const response = await fetch('data/project-curation.json', {cache:'no-cache'});
      if (!response.ok) throw new Error('Missing mapping');
      const json = await response.json();
      if (json && typeof json === 'object' && !Array.isArray(json)) config = json;
    } catch (_) { liveStatus = 'Mapping unavailable; starting from empty mapping'; }
    apply(); render();
    try {
      const response = await fetch('data/projects-catalogue.json', {cache:'no-cache'});
      if (response.ok) {
        const json = await response.json();
        if (Array.isArray(json.projects)) projects = merge(json.projects, projects);
      }
    } catch (_) { /* Local-only gallery is usable */ }
    apply(); liveStatus = 'Saved catalogue loaded'; render();
    try {
      const current = await window.DV_SYNC.discover(projects);
      projects = merge(current, projects);
      apply(); liveStatus = 'Synced with public GitHub repos'; render();
    } catch (_) { liveStatus = 'GitHub unavailable; using saved catalogue'; render(); }
  }

  function updateEntry(key, field, value) {
    patchFor(key)[field] = value;
    modified = true;
    apply(); render();
  }
  function convertFile(file) {
    if (!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG or WebP image.');
    if (file.size > 15*1024*1024) throw new Error('The image is larger than 15 MB.');
    return new Promise((resolve,reject) => {
      const tmp = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const target = document.createElement('canvas'); target.width = 1200; target.height = 675;
          const ctx = target.getContext('2d'); if (!ctx) throw new Error('Canvas unavailable');
          ctx.fillStyle = '#101a2c'; ctx.fillRect(0,0,1200,675);
          const scale = Math.max(1200 / img.naturalWidth, 675 / img.naturalHeight);
          const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
          ctx.drawImage(img,(1200-w)/2,(675-h)/2,w,h);
          target.toBlob(blob => blob ? resolve(blob) : reject(new Error('This browser could not export a WebP image.')), 'image/webp', .87);
        } catch (e) { reject(e); }
        finally { URL.revokeObjectURL(tmp); }
      };
      img.onerror = () => { URL.revokeObjectURL(tmp); reject(new Error('This image could not be read.')); };
      img.src = tmp;
    });
  }
  $('#m-grid').addEventListener('change', async e => {
    const target = e.target;
    if (target.matches('[data-category-select]')) { updateEntry(target.dataset.categorySelect, 'category', target.value); return; }
    if (target.matches('[data-featured]')) { updateEntry(target.dataset.featured, 'featured', target.checked); return; }
    if (target.matches('[data-cover]')) {
      const key = target.dataset.cover;
      const file = target.files?.[0]; if (!file) return;
      try {
        const blob = await convertFile(file);
        const name = C.slugify(key) || 'cover';
        const path = `assets/project-covers/${name}.webp`;
        if (stage.has(key)) URL.revokeObjectURL(stage.get(key).url);
        stage.set(key,{blob,path,url:URL.createObjectURL(blob)});
        patchFor(key).cover = path;
        modified = true; badImages.delete(key);
        apply(); render();
      } catch (err) { window.alert(err.message); }
    }
  });
  $('#m-grid').addEventListener('click', e => {
    const b = e.target.closest('[data-remove]'); if (!b) return;
    const key = b.dataset.remove;
    if (stage.has(key)) { URL.revokeObjectURL(stage.get(key).url); stage.delete(key); }
    const patch = patchFor(key);
    // Explicitly clearing a cover falls back to any per-repository artwork.
    delete patch.cover;
    modified = true; badImages.delete(key);
    apply(); render();
  });
  $('#m-search').addEventListener('input',render);
  $('#m-filter').addEventListener('change',render);
  async function imageWorks(url) {
    return new Promise(resolve => {
      const img = new Image(); let done = false;
      const end = ok => { if (done) return; done = true; clearTimeout(timer); img.onload = null; img.onerror = null; resolve(ok); };
      const timer = setTimeout(() => end(false), 9500);
      img.onload = () => end(true); img.onerror = () => end(false); img.src = url;
    });
  }
  $('#m-check').addEventListener('click',async () => {
    const b = $('#m-check'); b.disabled = true; b.textContent = 'Checking…';
    badImages.clear(); checkedImages.clear();
    let next = 0;
    const tasks = Array.from({length: Math.min(6, projects.length)},async () => {
      while (next < projects.length) {
        const p = projects[next++]; const key = projectKey(p);
        const ok = await imageWorks(imageSrc(p));
        checkedImages.add(key); if (!ok) badImages.add(key);
        $('#m-sync').textContent = `Checked ${checkedImages.size}/${projects.length} images`;
      }
    });
    try { await Promise.all(tasks); liveStatus = `Image check complete: ${badImages.size} errors`; }
    finally { b.disabled = false; b.textContent = 'Check all images'; render(); }
  });
  function mappingJSON() { return JSON.stringify(config,null,2) + '\n'; }
  function download(name,blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url),60000);
  }
  $('#m-download-json').addEventListener('click', () => download('project-curation.json',new Blob([mappingJSON()],{type:'application/json'})));

  // Small standards-compliant ZIP (stored entries, no library or external CDN).
  // ZIP paths are relative to repository root, not nested under a parent folder.
  const encoder = new TextEncoder();
  const table = new Uint32Array(256);
  for (let n=0;n<256;n++) { let c=n; for (let k=0;k<8;k++) c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1); table[n]=c>>>0; }
  const crc32 = bytes => { let c=0xffffffff; for (let i=0;i<bytes.length;i++) c=table[(c^bytes[i])&255]^(c>>>8); return (c^0xffffffff)>>>0; };
  async function zipFiles(files) {
    const parts = [], dirs = []; let offset=0;
    const push=(view) => { parts.push(view); offset+=view.byteLength; };
    for (const [name, source] of files) {
      const filename=encoder.encode(name);
      const bytes = source instanceof Uint8Array ? source : new Uint8Array(await source.arrayBuffer());
      const crc=crc32(bytes), start=offset;
      const local=new Uint8Array(30+filename.byteLength), d=new DataView(local.buffer);
      d.setUint32(0,0x04034b50,true); d.setUint16(4,20,true); d.setUint16(6,0x0800,true);
      d.setUint16(8,0,true); d.setUint16(10,0,true); d.setUint16(12,0,true);
      d.setUint32(14,crc,true); d.setUint32(18,bytes.length,true); d.setUint32(22,bytes.length,true);
      d.setUint16(26,filename.length,true); d.setUint16(28,0,true); local.set(filename,30);
      push(local); push(bytes);
      const central=new Uint8Array(46+filename.length), cd=new DataView(central.buffer);
      cd.setUint32(0,0x02014b50,true); cd.setUint16(4,20,true); cd.setUint16(6,20,true); cd.setUint16(8,0x0800,true);
      cd.setUint16(10,0,true); cd.setUint16(12,0,true); cd.setUint16(14,0,true);
      cd.setUint32(16,crc,true); cd.setUint32(20,bytes.length,true); cd.setUint32(24,bytes.length,true);
      cd.setUint16(28,filename.length,true); cd.setUint16(30,0,true); cd.setUint16(32,0,true);
      cd.setUint16(34,0,true); cd.setUint16(36,0,true); cd.setUint32(38,0,true);
      cd.setUint32(42,start,true); central.set(filename,46); dirs.push(central);
    }
    const centralOffset=offset;
    for (const data of dirs) push(data);
    const end=new Uint8Array(22), ed=new DataView(end.buffer);
    ed.setUint32(0,0x06054b50,true); ed.setUint16(8,dirs.length,true); ed.setUint16(10,dirs.length,true);
    ed.setUint32(12,offset-centralOffset,true); ed.setUint32(16,centralOffset,true);
    push(end);
    return new Blob(parts,{type:'application/zip'});
  }
  $('#m-export').addEventListener('click',async () => {
    const button=$('#m-export'); button.disabled=true; button.textContent='Preparing ZIP…';
    try {
      const text = 'DV EXPERIMENTS COVER UPDATE\n\n1. Extract this ZIP on your computer.\n2. Copy its data/project-curation.json into the SAME path in your GitHub repository.\n3. Upload any included assets/project-covers/*.webp into that matching folder.\n4. Commit changes and reload your dashboard (Ctrl+F5).\n\nNote: GitHub web uploads DO NOT extract ZIP files automatically. Upload the extracted files, not the ZIP itself.\n';
      const files=[['data/project-curation.json',encoder.encode(mappingJSON())]];
      for (const item of stage.values()) files.push([item.path,item.blob]);
      files.push(['HOW_TO_UPLOAD.txt',encoder.encode(text)]);
      const zip=await zipFiles(files);
      download('DVExperiments_Cover_Update.zip',zip);
    } catch (e) { window.alert('Could not export the ZIP: '+e.message); }
    finally { button.disabled=false; button.textContent='Export GitHub update ZIP ↗'; }
  });
  render(); load();
})();
