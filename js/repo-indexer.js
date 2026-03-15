/**
 * repo-indexer.js — DragonKael Research Lab
 * Soporta carpetas de primer nivel Y subcarpetas (recursivo).
 * Cada carpeta con archivos aparece como grupo con su ruta completa.
 */

const REPO_OWNER = 'DragonKael';
const REPO_NAME  = 'DragonKael.github.io';
const PAGES_BASE = 'https://dragonkael.github.io';
const RAW_BASE   = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main`;
const API_BASE   = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

// Carpetas de primer nivel que el dashboard indexa
const ROOT_SECTIONS = ['research', 'projects', 'experiments', 'notes', 'papers', 'infographics'];

// Extensiones que se ignorarán (archivos de soporte, no de contenido)
const IGNORE_EXTS = new Set(['gitkeep', 'gitignore', 'ds_store']);

// Máxima profundidad de recursión (evita loops infinitos)
const MAX_DEPTH = 3;

/**
 * Retorna la URL pública de un archivo.
 *   .html → GitHub Pages (navegable en browser)
 *   otros → raw de GitHub (descarga / vista)
 */
function getFileUrl(path) {
  const ext = path.split('.').pop().toLowerCase();
  if (ext === 'html') return `${PAGES_BASE}/${path}`;
  return `${RAW_BASE}/${path}`;
}

/**
 * Fetch del API de GitHub para una ruta dada.
 * Lanza error con mensaje amigable si hay rate limit.
 */
async function apiFetch(path) {
  const res = await fetch(`${API_BASE}/${path}`, {
    headers: { Accept: 'application/vnd.github.v3+json' }
  });
  if (res.status === 404) return null;         // carpeta/archivo no existe
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get('X-RateLimit-Reset');
    const mins  = reset ? Math.ceil((+reset * 1000 - Date.now()) / 60000) : '?';
    throw new Error(`Rate limit de GitHub API. Espera ~${mins} min y recarga.`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} al acceder "${path}"`);
  return res.json();
}

/**
 * Escanea recursivamente una carpeta y retorna un array de "grupos":
 *   { path, label, files: [{name, path, openUrl, ext, size}] }
 *
 * Si la carpeta solo tiene archivos → 1 grupo con esos archivos.
 * Si tiene subcarpetas → grupos adicionales por cada subcarpeta con archivos.
 */
async function scanFolder(folderPath, label, depth = 0) {
  if (depth > MAX_DEPTH) return [];

  const data = await apiFetch(folderPath);
  if (!data || !Array.isArray(data)) return [];

  const files   = [];
  const subdirs = [];

  for (const item of data) {
    if (item.type === 'file') {
      const ext = item.name.split('.').pop().toLowerCase();
      if (IGNORE_EXTS.has(ext)) continue;
      files.push({
        name:    item.name,
        path:    item.path,
        openUrl: getFileUrl(item.path),
        rawUrl:  item.download_url,
        ext,
        size: item.size,
      });
    } else if (item.type === 'dir') {
      subdirs.push({ name: item.name, path: item.path });
    }
  }

  const groups = [];

  // Grupo de archivos en esta misma carpeta (si hay)
  if (files.length > 0) {
    groups.push({ path: folderPath, label, files });
  }

  // Grupos de subcarpetas (recursivo)
  for (const sub of subdirs) {
    const subLabel = `${label} / ${sub.name}`;
    const subGroups = await scanFolder(sub.path, subLabel, depth + 1);
    groups.push(...subGroups);
  }

  return groups;
}

/**
 * Escanea todas las secciones raíz en paralelo.
 * Retorna Map<sectionId, { groups | error }>
 *
 * Cada sección puede tener múltiples grupos si tiene subcarpetas.
 */
async function fetchAllSections() {
  const results = new Map();

  await Promise.allSettled(
    ROOT_SECTIONS.map(async (id) => {
      try {
        const groups = await scanFolder(id, id);
        results.set(id, { groups });
      } catch (err) {
        results.set(id, { error: err.message });
      }
    })
  );

  return results;
}

// ── Exports ──
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fetchAllSections, scanFolder, getFileUrl, ROOT_SECTIONS };
}
