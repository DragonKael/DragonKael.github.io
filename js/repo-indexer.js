/**
 * repo-indexer.js — DragonKael Research Lab
 * Fetches file listings from GitHub API and exposes them to ui.js
 */

const REPO_OWNER  = 'DragonKael';
const REPO_NAME   = 'DragonKael.github.io';
const PAGES_BASE  = 'https://dragonkael.github.io';
const RAW_BASE    = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main`;
const API_BASE    = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

const SECTION_IDS = ['research', 'projects', 'experiments', 'notes', 'papers', 'infographics'];

/**
 * Returns the public URL for a file in a section.
 * HTML files → served by GitHub Pages (navigable in browser)
 * Other files → raw GitHub URL (download/view)
 */
function getFileUrl(sectionId, filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'html') {
    return `${PAGES_BASE}/${sectionId}/${filename}`;
  }
  return `${RAW_BASE}/${sectionId}/${filename}`;
}

/**
 * Fetches all files in a repository folder via the GitHub Contents API.
 * Returns an array of { name, url, openUrl, ext, size } objects.
 */
async function fetchSectionFiles(sectionId) {
  const res = await fetch(`${API_BASE}/${sectionId}`, {
    headers: { 'Accept': 'application/vnd.github.v3+json' }
  });

  if (res.status === 404) {
    return [];  // Folder doesn't exist yet
  }

  if (!res.ok) {
    const remaining = res.headers.get('X-RateLimit-Remaining');
    if (remaining === '0') {
      throw new Error('Límite de rate de GitHub API alcanzado. Espera un momento y recarga.');
    }
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data
    .filter(item => item.type === 'file')
    .map(item => ({
      name:    item.name,
      path:    item.path,
      url:     item.html_url,
      openUrl: getFileUrl(sectionId, item.name),
      rawUrl:  item.download_url,
      ext:     item.name.split('.').pop().toLowerCase(),
      size:    item.size,
      sha:     item.sha,
    }));
}

/**
 * Fetches all sections in parallel. Returns a Map<sectionId, files[]>.
 * Errors per-section are captured and stored as { error: string }.
 */
async function fetchAllSections() {
  const results = new Map();

  await Promise.allSettled(
    SECTION_IDS.map(async id => {
      try {
        const files = await fetchSectionFiles(id);
        results.set(id, files);
      } catch (err) {
        results.set(id, { error: err.message });
      }
    })
  );

  return results;
}

// Export for use in index.html or ui.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fetchSectionFiles, fetchAllSections, getFileUrl, SECTION_IDS };
}
