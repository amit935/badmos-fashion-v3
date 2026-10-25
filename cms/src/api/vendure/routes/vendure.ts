/**
 * Route configuration for Vendure API integration in Strapi
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/vendure/products',
      handler: 'vendure.searchProducts',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/vendure/collections',
      handler: 'vendure.getCollections',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/vendure/facets',
      handler: 'vendure.getFacets',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/vendure/resolve-slugs',
      handler: 'vendure.resolveSlugs',
      config: {
        policies: [],
        auth: false,
      },
    },
  ],
};
