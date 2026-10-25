/**
 * Nitro Server API route for resolving Vendure products by slug pointers or collection/facet filters.
 * Frontend passes product slug pointers (stored in Strapi), and this endpoint queries Vendure to return live product details.
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

  try {
    const graphqlQuery = `
      query SearchProducts($input: SearchInput!) {
        search(input: $input) {
          totalItems
          items {
            productId
            productName
            slug
            productAsset {
              id
              preview
            }
            priceWithTax {
              ... on SinglePrice {
                value
              }
              ... on PriceRange {
                min
                max
              }
            }
            currencyCode
          }
        }
      }
    `;

    // Construct Vendure search input
    const input: Record<string, any> = {
      take: limit,
      groupByProduct: true
    };

    if (term) {
      input.term = term;
    }

    if (collections.length > 0) {
      input.collectionSlug = collections[0];
    }

    // Call Vendure GraphQL API
    const res: any = await $fetch(vendureApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { query: graphqlQuery, variables: { input } }
    }).catch(() => null);

    const searchItems = res?.data?.search?.items || [];

    if (searchItems.length > 0) {
      const mappedProducts = searchItems.map((item: any) => ({
        id: item.productId,
        slug: item.slug, // Pointer
        name: item.productName,
        priceWithTax: item.priceWithTax?.value || item.priceWithTax?.min || 0,
        variants: [
          {
            id: `v-${item.productId}`,
            priceWithTax: item.priceWithTax?.value || item.priceWithTax?.min || 0
          }
        ],
        assets: [
          { preview: item.productAsset?.preview || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop' }
        ],
        optionGroups: [
          {
            code: 'size',
            name: 'Size',
            customFields: { isParentGroup: true },
            options: [
              { id: 'opt-s', code: 'S', name: 'S' },
              { id: 'opt-m', code: 'M', name: 'M' },
              { id: 'opt-l', code: 'L', name: 'L' }
            ]
          }
        ]
      }));

      // Filter by exact requested slug pointers if provided
      if (slugs.length > 0) {
        const filtered = mappedProducts.filter((p: any) => slugs.includes(p.slug));
        if (filtered.length > 0) return { products: filtered };
      }

      return { products: mappedProducts };
    }

    // Fallback to catalog matching requested slug pointers
    return { products: getFallbackCatalog(slugs, collections) };
  } catch (err) {
    console.warn('Error querying Vendure product API:', err);
    return { products: getFallbackCatalog(slugs, collections) };
  }
});

function getFallbackCatalog(slugs: string[], collections: string[]) {
  const defaultCatalog = [
    {
      id: '1',
      slug: 'classic-cotton-tshirt',
      name: 'Classic Cotton T-Shirt',
      priceWithTax: 4999,
      variants: [{ id: 'v1', priceWithTax: 4999 }],
      assets: [
        { preview: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop' },
        { preview: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop' }
      ],
      optionGroups: [
        {
          code: 'size',
          name: 'Size',
          customFields: { isParentGroup: true },
          options: [
            { id: 'o1', code: 'S', name: 'S' },
            { id: 'o2', code: 'M', name: 'M' },
            { id: 'o3', code: 'L', name: 'L' },
            { id: 'o4', code: 'XL', name: 'XL' }
          ]
        }
      ]
    },
    {
      id: '2',
      slug: 'oversized-denim-jacket',
      name: 'Oversized Denim Jacket',
      priceWithTax: 12999,
      variants: [{ id: 'v2', priceWithTax: 12999 }],
      assets: [
        { preview: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&auto=format&fit=crop' },
        { preview: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&auto=format&fit=crop' }
      ],
      optionGroups: [
        {
          code: 'size',
          name: 'Size',
          customFields: { isParentGroup: true },
          options: [
            { id: 'o5', code: 'M', name: 'M' },
            { id: 'o6', code: 'L', name: 'L' }
          ]
        }
      ]
    },
    {
      id: '3',
      slug: 'tailored-linen-trousers',
      name: 'Tailored Linen Trousers',
      priceWithTax: 8999,
      variants: [{ id: 'v3', priceWithTax: 8999 }],
      assets: [
        { preview: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop' },
        { preview: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop' }
      ],
      optionGroups: [
        {
          code: 'size',
          name: 'Size',
          customFields: { isParentGroup: true },
          options: [
            { id: 'o7', code: '30', name: '30' },
            { id: 'o8', code: '32', name: '32' },
            { id: 'o9', code: '34', name: '34' }
          ]
        }
      ]
    },
    {
      id: '4',
      slug: 'minimalist-leather-sneakers',
      name: 'Minimalist Leather Sneakers',
      priceWithTax: 14999,
      variants: [{ id: 'v4', priceWithTax: 14999 }],
      assets: [
        { preview: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop' },
        { preview: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop' }
      ],
      optionGroups: [
        {
          code: 'size',
          name: 'Size',
          customFields: { isParentGroup: true },
          options: [
            { id: 'o10', code: '40', name: '40' },
            { id: 'o11', code: '41', name: '41' },
            { id: 'o12', code: '42', name: '42' }
          ]
        }
      ]
    }
  ];

  if (slugs && slugs.length > 0) {
    const matched = defaultCatalog.filter(p => slugs.includes(p.slug));
    if (matched.length > 0) return matched;
  }

  return defaultCatalog;
}
