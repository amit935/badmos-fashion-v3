import { buildBreadcrumbs } from "~~/server/utils/productPath";

export default defineEventHandler(async (event) => {
  const { path } = getQuery(event);
  const segments = String(path || '').split('/').filter(Boolean);
  const slug = segments[segments.length - 1];
  if (!slug) return { type: 'none' };

  const config = useRuntimeConfig();
  const url = config.public?.apiUrl || 'http://127.0.0.1:3000/shop-api';

  const res: any = await $fetch(url, {
    method: 'POST',
    body: {
      query: `
        query Resolve($slug: String!) {
          collection(slug: $slug) { id name slug description breadcrumbs { name slug } }
          product(slug: $slug) {
            id name slug description
            assets { id preview }
            optionGroups { id code name options { id code name } }
            variants {
              id name sku price priceWithTax currencyCode stockLevel
              taxCategory { name }
              taxRateApplied { name value }
              options { id code name group { id code name } }
            }
            collections { slug breadcrumbs { slug } }
          }
        }`,
      variables: { slug },
    },
  }).catch(() => null);

  const { collection, product } = res?.data || {};
  const requested = '/' + segments.join('/');

  if (collection) {
    return { type: 'collection', collection, crumbs: buildBreadcrumbs(collection), canonical: buildCollectionPath(collection), requested };
  }
  if (product) {
    return { type: 'product', product, canonical: buildProductPath(product.collections, product.slug), requested };
  }
  return { type: 'none' };
});