// scripts/build-index.js
// Node script to build data/index.json and data/graph.json
// Run: node scripts/build-index.js
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'data');
const SECTIONS = ['research','projects','experiments','notes','papers','infographics'];

// Ensure out dir
if(!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Helper: read file and extract metas
function parseMeta(html) {
  const meta = {};
  // <meta name="key" content="value">
  const re = /<meta\s+name=["']?([\w-]+)["']?\s+content=["']([\s\S]*?)["']\s*\/?>/ig;
  let m;
  while((m = re.exec(html)) !== null){
    meta[m[1].toLowerCase()] = m[2].trim();
  }
  // title fallback
  const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(html);
  if(titleMatch && !meta.title) meta.title = titleMatch[1].trim();
  return meta;
}

// Traverse section folders
const items = [];

SECTIONS.forEach(section => {
  const folder = path.join(ROOT, section);
  if(!fs.existsSync(folder)) return;
  const files = fs.readdirSync(folder).filter(f => f.toLowerCase().endsWith('.html'));
  files.forEach(fname => {
    const full = path.join(folder, fname);
    try {
      const raw = fs.readFileSync(full, 'utf8');
      const meta = parseMeta(raw);
      const tags = (meta.tags || '').split(',').map(s=>s.trim()).filter(Boolean);
      const item = {
        title: meta.title || fname.replace('.html','').replace(/[-_]/g,' '),
        description: meta.description || '',
        tags,
        year: meta.year || '',
        featured: String(meta.featured||'').toLowerCase() === 'true',
        type: meta.type || section,
        path: `${section}/${fname}`,
        filename: fname
      };
      items.push(item);
    } catch(err){
      console.warn("error parsing", full, err.message);
    }
  });
});

// Write index.json
const index = { generated_at: new Date().toISOString(), items };
fs.writeFileSync(path.join(OUT_DIR,'index.json'), JSON.stringify(index, null, 2), 'utf8');
console.log("Wrote data/index.json with", items.length, "items");

// Build a simple graph: nodes = items, edges between items sharing >=1 tag
const nodes = items.map((it, i) => ({ id: i, title: it.title, path: it.path, type: it.type }));
const edges = [];

for(let i=0;i<nodes.length;i++){
  for(let j=i+1;j<nodes.length;j++){
    const a = items[i], b = items[j];
    const common = a.tags.filter(t => b.tags.includes(t));
    if(common.length > 0){
      edges.push({ source: i, target: j, sharedTags: common });
    }
  }
}
const graph = { generated_at: new Date().toISOString(), nodes, edges };
fs.writeFileSync(path.join(OUT_DIR,'graph.json'), JSON.stringify(graph, null, 2), 'utf8');
console.log("Wrote data/graph.json with", nodes.length, "nodes and", edges.length, "edges");