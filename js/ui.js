/* js/ui.js
   UI helpers: render cards/items, search & filters, theme toggle.
   EDITABLE: cambiar textos, labels o comportamientos visuales.
*/

const UI = (() => {

  function makeCard(item) {
    // item: { title, description, url, tags:[], year, section, featured }
    const el = document.createElement("article");
    el.className = "card";
    if(item.featured) el.classList.add("featured");

    el.innerHTML = `
      <a class="card-link" href="${item.url}">
        <div class="card-body">
          <h4 class="card-title">${escapeHtml(item.title)}</h4>
          <p class="card-desc">${escapeHtml(item.description || '')}</p>
          <div class="meta">
            <span class="tag-list">${(item.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join(' ')}</span>
            <span class="year">${item.year || ''}</span>
            <span class="section">${escapeHtml(item.section)}</span>
          </div>
        </div>
      </a>
    `;
    return el;
  }

  function escapeHtml(s){
    if(!s) return "";
    return s.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function clearChildren(node){
    while(node.firstChild) node.removeChild(node.firstChild);
  }

  // Crear filtro visual (tags/years) y callbacks
  function renderFilters(tagSet, yearSet, onFilterSelected){
    const container = document.getElementById("filter-bar");
    clearChildren(container);

    // tags
    const tagWrap = document.createElement("div"); tagWrap.className = "filter-group";
    tagWrap.innerHTML = "<strong>Tags:</strong>";
    Array.from(tagSet).sort().forEach(tag=>{
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.textContent = tag;
      btn.onclick = ()=> onFilterSelected({ tag });
      tagWrap.appendChild(btn);
    });
    container.appendChild(tagWrap);

    // years
    const yearWrap = document.createElement("div"); yearWrap.className = "filter-group";
    yearWrap.innerHTML = "<strong>Años:</strong>";
    Array.from(yearSet).sort((a,b)=>b-a).forEach(y=>{
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.textContent = y;
      btn.onclick = ()=> onFilterSelected({ year: y });
      yearWrap.appendChild(btn);
    });
    container.appendChild(yearWrap);

    // reset
    const reset = document.createElement("button");
    reset.className = "filter-reset";
    reset.textContent = "Limpiar filtros";
    reset.onclick = ()=> onFilterSelected(null);
    container.appendChild(reset);
  }

  // Theme toggle
  function initThemeToggle(){
    const btn = document.getElementById("theme-toggle");
    const root = document.documentElement;
    const stored = localStorage.getItem("dk_theme");
    if(stored === "dark") root.classList.add("dark");
    btn.addEventListener("click", ()=>{
      root.classList.toggle("dark");
      localStorage.setItem("dk_theme", root.classList.contains("dark") ? "dark":"light");
    });
  }

  // attach search box behavior
  function initSearch(onQuery){
    const search = document.getElementById("global-search");
    search.addEventListener("input", e=>{
      const q = e.target.value.trim().toLowerCase();
      onQuery(q);
    });
  }

  return {
    makeCard, clearChildren, renderFilters, initThemeToggle, initSearch
  };

})();