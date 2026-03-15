/* js/repo-indexer.js
  ------------------
  1) Lee cada carpeta listada en LAB_CONFIG.sections usando GitHub API (contents)
  2) Para cada archivo .html descarga file.download_url y parsea metadatos
  3) Metadatos soportados (en el <head> del html):
      <meta name="title" content="...">
      <meta name="description" content="...">
      <meta name="tags" content="tag1, tag2">
      <meta name="year" content="2025">
      <meta name="featured" content="true">
  4) Genera: featured, buscador, filtros por tags/años
*/

(async function(){
  if(!window.LAB_CONFIG) {
    console.error("Lab config no encontrado. Asegúrate de cargar config/lab-config.js");
    return;
  }

  const user = LAB_CONFIG.githubUser;
  const repo = LAB_CONFIG.githubRepo;
  const maxItems = LAB_CONFIG.maxItemsPerSection || 100;

  // Contenedores globales
  const allItems = []; // array de objetos
  const featuredContainer = document.getElementById("featured-row");
  const searchResults = document.getElementById("search-results");

  // sets para filtros
  const tagSet = new Set();
  const yearSet = new Set();

  // Helper: parse meta tags desde html string
function parseMetaFromHtml(htmlText){
  const meta = {};
  // busca <meta name="..." content="..."> (comillas simples o dobles)
  const re = /<meta\s+name=["']?([\w-]+)["']?\s+content=["']([\s\S]*?)["']\s*\/?>/ig;
  let m;
  while((m = re.exec(htmlText)) !== null){
    meta[m[1].toLowerCase()] = m[2];
  }
  // fallback: <title>
  const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(htmlText);
  if(titleMatch && !meta.title) meta.title = titleMatch[1].trim();
  return meta;
}

  // Helper: fetch folder contents via contents API
  async function listFolder(folder){
    const url = `https://api.github.com/repos/${user}/${repo}/contents/${folder}`;
    try{
      const res = await fetch(url);
      if(!res.ok) {
        console.warn(`Error listing ${folder}:`, res.status);
        return [];
      }
      const data = await res.json();
      return data; // array of file objects
    } catch(err){
      console.error("listFolder error", err);
      return [];
    }
  }

  // Helper: fetch raw file (download_url)
  async function fetchFileRaw(download_url){
    try{
      const res = await fetch(download_url);
      if(!res.ok) return null;
      return await res.text();
    } catch(err){
      console.warn("fetchFileRaw error", err);
      return null;
    }
  }

  // Build item list for one section
  async function buildSection(section){
    const files = await listFolder(section.folder);
    if(!Array.isArray(files)) return [];

    const htmlFiles = files.filter(f => f.type === "file" && f.name.toLowerCase().endsWith(".html"));
    const items = [];

    for(const f of htmlFiles.slice(0, maxItems)){
      // descargar contenido
      const raw = await fetchFileRaw(f.download_url);
      if(!raw) continue;

      const meta = parseMetaFromHtml(raw);

      const title = meta.title || f.name.replace(".html","").replace(/[-_]/g," ");
      const description = meta.description || "";
      const tags = (meta.tags || "").split(",").map(s=>s.trim()).filter(Boolean);
      const year = meta.year || "";
      const featured = String(meta.featured || "").toLowerCase() === "true";

      // agregar sets para filtros
      tags.forEach(t => tagSet.add(t));
      if(year) yearSet.add(year);

      const item = {
        title,
        description,
        tags,
        year,
        featured,
        section: section.name,
        url: `${section.folder}/${f.name}`,
        rawFilename: f.name
      };

      items.push(item);
      allItems.push(item);
    }
    return items;
  }

  // Render helpers
  function renderSectionItems(section, items){
    const container = document.getElementById(section.elementId);
    if(!container) { console.warn("No container:", section.elementId); return; }
    UI.clearChildren(container);
    items.forEach(it=>{
      const li = document.createElement("li");
      li.className = "list-item";
      li.appendChild(UI.makeCard(it));
      container.appendChild(li);
    });
  }

  function renderFeatured(items){
    if(!featuredContainer) return;
    UI.clearChildren(featuredContainer);
    items.forEach(it=>{
      const node = UI.makeCard(it);
      featuredContainer.appendChild(node);
    });
  }

  // Build everything
  async function init(){
    // 1) build per-section
    for(const section of LAB_CONFIG.sections){
      const items = await buildSection(section);
      // si showFeaturedFirst, se will render later filtered
      // renderSectionItems(section, items); -> we'll render later after filtering/sorting
      renderSectionItems(section, items);
    }

    // 2) featured row
    const featured = allItems.filter(i=>i.featured);
    if(LAB_CONFIG.showFeaturedFirst) {
      renderFeatured(featured);
    } else {
      // if none, show most recent or popular (fallback: first items)
      renderFeatured(allItems.slice(0,6));
    }

    // 3) build filters UI
    UI.renderFilters(tagSet, yearSet, applyFilter);

    // 4) init search
    if(LAB_CONFIG.enableSearch){
      UI.initSearch(q => applySearch(q));
    }

    // 5) theme toggle
    UI.initThemeToggle();

    // initial: clear search results
    UI.clearChildren(searchResults);
  }

  // filter callback
  function applyFilter(criteria){
    // criteria: { tag } or { year } or null
    // render sections with filtered items, and results list
    if(!criteria){
      // no filter: restore original rendering
      LAB_CONFIG.sections.forEach(section=>{
        const items = allItems.filter(i=> i.section === section.name);
        renderSectionItems(section, items);
      });
      // clear results
      UI.clearChildren(searchResults);
      return;
    }

    const filtered = allItems.filter(i => {
      if(criteria.tag) return (i.tags||[]).includes(criteria.tag);
      if(criteria.year) return (i.year||"") === String(criteria.year);
      return true;
    });

    // render filtered items into results
    UI.clearChildren(searchResults);
    if(filtered.length===0){
      const li = document.createElement("li");
      li.textContent = "No se encontraron resultados.";
      searchResults.appendChild(li);
    } else {
      filtered.forEach(it=>{
        const li = document.createElement("li");
        li.className = "list-item";
        li.appendChild(UI.makeCard(it));
        searchResults.appendChild(li);
      });
    }
  }

  // search callback
  function applySearch(query){
    const q = (query||"").trim().toLowerCase();
    if(!q){
      UI.clearChildren(searchResults);
      return;
    }
    const results = allItems.filter(i => {
      const hay = [
        i.title,
        i.description,
        (i.tags||[]).join(" "),
        i.section,
        i.year
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });

    UI.clearChildren(searchResults);
    if(results.length === 0){
      const li = document.createElement("li");
      li.textContent = "No se encontraron resultados para: " + query;
      searchResults.appendChild(li);
    } else {
      results.forEach(it=>{
        const li = document.createElement("li");
        li.className = "list-item";
        li.appendChild(UI.makeCard(it));
        searchResults.appendChild(li);
      });
    }
  }

  // start
  init();

})();
