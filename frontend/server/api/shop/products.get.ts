/**
 * Resolves Vendure products for listings and Strapi sections.
 * Every product is returned with a canonical hierarchical `path`.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const rawSlugs = query.slugs || query.ids;
  const rawCollections = query.collections;
  const rawTerm = query.term;
  const rawLimit = query.limit;

  const slugs = typeof rawSlugs === 'string'
    ? rawSlugs.split(',').map(s => s.trim()).filter(Boolean)
    : Array.isArray(rawSlugs) ? rawSlugs : [];

  const collections = typeof rawCollections === 'string'
    ? rawCollections.split(',').map(c => c.trim()).filter(Boolean)
    : Array.isArray(rawCollections) ? rawCollections : [];

  const term = typeof rawTerm === 'string' ? rawTerm : '';
  const limit = rawLimit ? parseInt(String(rawLimit), 10) : 20;

  const config = useRuntimeConfig();
  const vendureApiUrl = config.public?.apiUrl || 'http://127.0.0.1:3000/shop-api';

  const searchQuery = `
    query SearchProducts($input: SearchInput!) {
      search(input: $input) {
        totalItems
        items {
          productId
          productName
          slug
          productAsset { id preview }
          priceWithTax {
            ... on SinglePrice { value }
            ... on PriceRange { min max }
          }
          currencyCode
        }
      }
    }
  `;

  try {
    // One search per collection slug (or one unfiltered search), then merge
    const searchTargets: (string | null)[] = collections.length ? collections : [null];

    const results = await Promise.all(
      searchTargets.map(async (collectionSlug) => {
        const input: Record<string, any> = { take: limit, groupByProduct: true };
        if (term) input.term = term;
        if (collectionSlug) input.collectionSlug = collectionSlug;

        const res: any = await $fetch(vendureApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { query: searchQuery, variables: { input } },
        }).catch(() => null);

        return res?.data?.search?.items || [];
      })
    );

    // Merge and de-duplicate by product slug
    const seen = new Set<string>();
    const searchItems = results.flat().filter((item: any) => {
      if (seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    });

    if (searchItems.length === 0) return { products: [] };

    const fullProducts = await fetchFullProducts(
      vendureApiUrl,
      searchItems.map((i: any) => i.slug)
    );

    let mappedProducts = searchItems.map((item: any) => {
      const full = fullProducts.get(item.slug);
      const fallbackPrice = item.priceWithTax?.value || item.priceWithTax?.min || 0;

      return {
        id: item.productId,
        slug: item.slug,
        name: item.productName,
        path: buildProductPath(full?.collections, item.slug), // canonical URL
        currencyCode: item.currencyCode || full?.variants?.[0]?.currencyCode,
        priceWithTax: fallbackPrice,
        variants: full?.variants || [{ id: `v-${item.productId}`, priceWithTax: fallbackPrice }],
        assets: full?.assets?.length
          ? full.assets.map((a: any) => ({ id: a.id, preview: a.preview }))
          : item.productAsset?.preview
            ? [{ preview: item.productAsset.preview }]
            : [],
        optionGroups: full?.optionGroups || [],
      };
    });

    // Strapi hand-picked slugs: keep only those, in the order Strapi listed them
    if (slugs.length > 0) {
      const bySlug = new Map(mappedProducts.map((p: any) => [p.slug, p]));
      const ordered = slugs.map((s) => bySlug.get(s)).filter(Boolean);
      if (ordered.length) mappedProducts = ordered as any[];
    }

    return { products: mappedProducts };
  } catch (err) {
    console.warn('Error querying Vendure product API:', err);
    return { products: [] };
  }
});

async function fetchFullProducts(vendureApiUrl: string, slugs: string[]): Promise<Map<string, any>> {
  const results = new Map<string, any>();

  const productDetailQuery = `
    query GetProduct($slug: String!) {
      product(slug: $slug) {
        id
        slug
        name
        assets { id preview }
        collections {
          slug
          breadcrumbs { slug }
        }
        optionGroups {
          id code name
          options { id code name }
        }
        variants {
          id name priceWithTax currencyCode
          options {
            id code name
            group { id code name }
          }
        }
      }
    }
  `;

  await Promise.all(
    slugs.map(async (slug) => {
      try {
        const res: any = await $fetch(vendureApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { query: productDetailQuery, variables: { slug } },
        });
        if (res?.data?.product) results.set(slug, res.data.product);
      } catch (e) {
        console.warn(`Failed to fetch product details for slug: ${slug}`, e);
      }
    })
  );

  return results;
}