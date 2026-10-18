/* DVExperiments LUMIN project-detail embed. Add as a deferred script on project.html. */
(() => {
  const PROJECT_SLUG = 'lumin';
  const PROJECT_URL = 'https://dvexperiments.github.io/LUMIN/';
  const REPORT_URL = 'https://dvexperiments.github.io/LUMIN/report/';
  if (!new URLSearchParams(location.search).get('slug')?.toLowerCase().includes(PROJECT_SLUG)) return;
  const target = document.getElementById('project-detail');
  if (!target) return;
  let injected = false;
  function insert() {
    if (injected || !target.querySelector('.detail-content')) return;
    injected = true;
    const section = document.createElement('section');
    section.className = 'lumin-project-embed';
    const h = document.createElement('h2'); h.textContent = 'Explore LUMIN';
    const p = document.createElement('p'); p.textContent = 'Interact with the living organism directly here, or open the full-screen experience.';
    const frame = document.createElement('iframe');
    frame.title = 'LUMIN — Interactive weather organism';
    frame.src = PROJECT_URL;
    frame.loading = 'lazy'; frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    const links = document.createElement('div'); links.className = 'lumin-embed-links';
    for (const [label, url] of [['Launch full screen ↗', PROJECT_URL], ['Read development journey ↗', REPORT_URL]]) {
      const a = document.createElement('a'); a.href=url; a.textContent=label; a.target='_blank'; a.rel='noopener noreferrer'; links.appendChild(a);
    }
    section.append(h,p,frame,links);
    target.appendChild(section);
  }
  const observer = new MutationObserver(() => { if (!document.contains(target.querySelector('.lumin-project-embed'))) injected = false; insert(); });
  observer.observe(target, {childList:true}); insert();
})();
