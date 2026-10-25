import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    locales: [],
  },
  register(app: StrapiApp) {
    app.customFields.register({
      name: 'vendure-product-selector',
      type: 'json',
      intlLabel: {
        id: 'vendure-product-selector.label',
        defaultMessage: 'Vendure Product Selector',
      },
      intlDescription: {
        id: 'vendure-product-selector.description',
        defaultMessage: 'Search Vendure products by name, collection, or facet and select product slug pointers',
      },
      components: {
        Input: async () => import('./components/VendureProductSelector'),
      },
      options: {},
    });
  },
  bootstrap(app: StrapiApp) {},
};
