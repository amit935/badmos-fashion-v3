/**
 * Composable for fetching collection data from the Vendure API.
 * TODO: Implement actual API calls.
 */
export function useQueryCollection() {
  async function fetchCollection(slug) {
    // Stub: return a minimal object so the header renders without errors
    return { name: slug, children: [] };
  }

  return { fetchCollection };
}
