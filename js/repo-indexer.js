// js/repo-indexer.js
// Try to load data/index.json first; if 404, fallback to GitHub API contents
(async function(){
  const INDEX_URL = '/data/index.json';
  let index = null;
  try {
    const res = await fetch(INDEX_URL);
    if(res.ok) {
      index = await res.json();
      console.log("Loaded index.json", index.items?.length||0);
    } else {
      console.log("index.json not found, falling back to GitHub API");
    }
  } catch(e){
    console.warn("Error loading index.json", e);
  }

  // if index not loaded, fallback: fetch via GitHub API (original behavior)
  if(!index) {
    // original fallback: list folders from config via GitHub API (kept from earlier implementation)
    if(!window.LAB_CONFIG) {
      console.error("LAB_CONFIG missing");
      return;
    }
    const user = LAB_CONFIG.githubUser;
    const repo = LAB_CONFIG.githubRepo;
    const items = [];
    for(const section of LAB_CONFIG.sections){
      const url = `https://api.github.com/repos/${user}/${repo}/contents/${section.folder}`;
      try {
        const r = await fetch(url);
        if(!r.ok) continue;
        const files = await r.json();
        for(const f of files){
          if(f.type === 'file' && f.name.endsWith('.html')){
            // fetch raw and parse meta
            const rawRes = await fetch(f.download_url);
            if(!rawRes.ok) continue;
            const raw = await rawRes.text();
            const meta = (function(html){
              const m = {};
              const re = /<meta\s+name=["']?([\w-]+)["']?\s+content=["']([\s\S]*?)["']\s*\/?>/ig;
              let mm;
              while((mm = re.exec(html)) !== null) m[mm[1].toLowerCase()] = mm[2];
              const t = /<title>([\s\S]*?)<\/title>/i.exec(html);
              if(t && !m.title) m.title = t[1];
              return m;
            })(raw);
            items.push({
              title: meta.title || f.name.replace('.html','').replace(/[-_]/g,' '),
              description: meta.description || '',
              tags: (meta.tags||'').split(',').map(s=>s.trim()).filter(Boolean),
              year: meta.year || '',
              featured: String(meta.featured||'').toLowerCase()==='true',
              type: section.name,
              path: `${section.folder}/${f.name}`
            });
          }
        }
      } catch(err){ console.warn("fallback error", err) }
    }
    index = { generated_at: new Date().toISOString(), items };
  }

  // Now we have index, render UI (search, sections, featured)
  window.LAB_INDEX = index; // expose for debug

  // Basic render: sections into DOM (element IDs must match config)
  function clear(node){ while(node && node.firstChild) node.removeChild(node.firstChild); }

  const featuredContainer = document.getElementById('featured-row');
  const searchResults = document.getElementById('search-results');

  // Collect tags & years
  const tagSet = new Set();
  const yearSet = new Set();

  index.items.forEach(it=>{
    (it.tags||[]).forEach(t=>tagSet.add(t));
    if(it.year) yearSet.add(it.year);
  });

  // Render sections
  if(window.LAB_CONFIG && Array.isArray(window.LAB_CONFIG.sections)){
    window.LAB_CONFIG.sections.forEach(section=>{
      const el = document.getElementById(section.elementId);
      if(!el) return;
      clear(el);
      const items = index.items.filter(i => i.type.toLowerCase() === section.name.toLowerCase());
      items.forEach(it=>{
        const li = document.createElement('li');
        li.className = 'list-item';
        li.innerHTML = `
          <a class="card-link" href="${it.path}">
            <div class="card">
              <h4>${escapeHtml(it.title)}</h4>
              <p>${escapeHtml(it.description || '')}</p>
              <div class="meta">${(it.tags||[]).slice(0,4).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join(' ')} <span class="year">${it.year||''}</span></div>
            </div>
          </a>
        `;
        el.appendChild(li);
      });
    });
  }

  // Featured
  clear(featuredContainer);
  (index.items.filter(i=>i.featured).slice(0,6)).forEach(it=>{
    const node = document.createElement('div');
    node.className = 'card featured';
    node.innerHTML = `<a class="card-link" href="${it.path}"><div class="card-body"><h4>${escapeHtml(it.title)}</h4><p>${escapeHtml(it.description||'')}</p></div></a>`;
    featuredContainer.appendChild(node);
  });

  // search logic (uses global input)
  const searchInput = document.getElementById('global-search');
  if(searchInput){
    searchInput.addEventListener('input', e=>{
      const q = e.target.value.trim().toLowerCase();
      clear(searchResults);
      if(!q) return;
      const results = index.items.filter(i => {
        const hay = [i.title, i.description, (i.tags||[]).join(' '), i.type, i.year].join(' ').toLowerCase();
        return hay.includes(q);
      });
      if(results.length===0){ const li = document.createElement('li'); li.textContent = 'No results'; searchResults.appendChild(li); }
      results.forEach(it=>{
        const li = document.createElement('li');
        li.className = 'list-item';
        li.appendChild(createCard(it));
        searchResults.appendChild(li);
      });
    });
  }

  function createCard(it){
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.innerHTML = `<a class="card-link" href="${it.path}"><div class="card-body"><h4>${escapeHtml(it.title)}</h4><p>${escapeHtml(it.description||'')}</p><div class="meta">${(it.tags||[]).slice(0,5).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join(' ')} <span class="year">${it.year||''}</span></div></div></a>`;
    return wrapper;
  }

  // small helper: escapeHtml (safe)
  function escapeHtml(s){
    if(!s) return "";
    return s.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

})();