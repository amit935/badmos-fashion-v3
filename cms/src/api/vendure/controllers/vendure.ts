/**
 * Vendure API Controller for Strapi
 * Exposes endpoints for searching Vendure products, fetching collections/facets,
 * and resolving product slug pointers.
 */

export default {
  /**
   * GET /api/vendure/products
   * Search Vendure products with filters: productName, collectionSlug, facets, limit
   */
  async searchProducts(ctx: any) {
    try {
      const { term, collectionSlug, facets, limit } = ctx.query;

      const facetValueIds = typeof facets === 'string' 
        ? facets.split(',').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(facets) ? facets : [];

      const vendureService = strapi.service('api::vendure.vendure');
      const result = await vendureService.searchVendureProducts({
        term: typeof term === 'string' ? term : undefined,
        collectionSlug: typeof collectionSlug === 'string' ? collectionSlug : undefined,
        facetValueIds,
        limit: limit ? parseInt(limit, 10) : 20,
      });

      ctx.send(result);
    } catch (err: any) {
      ctx.badRequest('Failed to search Vendure products', { error: err.message });
    }
  },

  /**
   * GET /api/vendure/collections
   * Fetch list of available collections from Vendure
   */
  async getCollections(ctx: any) {
    try {
      const vendureService = strapi.service('api::vendure.vendure');
      const collections = await vendureService.getVendureCollections();
      ctx.send({ data: collections });
    } catch (err: any) {
      ctx.badRequest('Failed to fetch Vendure collections', { error: err.message });
    }
  },

  /**
   * GET /api/vendure/facets
   * Fetch list of available facets from Vendure
   */
  async getFacets(ctx: any) {
    try {
      const vendureService = strapi.service('api::vendure.vendure');
      const facets = await vendureService.getVendureFacets();
      ctx.send({ data: facets });
    } catch (err: any) {
      ctx.badRequest('Failed to fetch Vendure facets', { error: err.message });
    }
  },

  /**
   * GET /api/vendure/resolve-slugs
   * Resolve array of product slug pointers to preview information
   */
  async resolveSlugs(ctx: any) {
    try {
      const { slugs } = ctx.query;
      const slugList = typeof slugs === 'string' 
        ? slugs.split(',').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(slugs) ? slugs : [];

      const vendureService = strapi.service('api::vendure.vendure');
      const resolved = await vendureService.resolveSlugs(slugList);
      ctx.send({ data: resolved });
    } catch (err: any) {
      ctx.badRequest('Failed to resolve product slugs', { error: err.message });
    }
  }
};
