/**
 * Vendure API Integration Service for Strapi
 * Communicates with Vendure Shop API to fetch live products, collections, and facets.
 * Returns product slug pointers for Strapi storage.
 *
 * Uses the `products` query for general listing/search (works for ALL products,
 * including those without variants), and the `search` query only for facet-based
 * or collection-based filtering (which requires the DefaultSearchPlugin index).
 */

const VENDURE_API_URL = process.env.VENDURE_API_URL || process.env.NUXT_PUBLIC_API_URL || 'http://127.0.0.1:3000/shop-api';

export default () => ({
  /**
   * Execute GraphQL query against Vendure API
   */
  async graphqlQuery(query: string, variables: Record<string, any> = {}) {
    try {
      console.log('[Vendure Service] Querying:', VENDURE_API_URL);
      const response = await fetch(VENDURE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`Vendure API returned status ${response.status}: ${response.statusText}`);
      }

      const json: any = await response.json();
      if (json.errors && json.errors.length > 0) {
        console.warn('[Vendure Service] GraphQL Errors:', JSON.stringify(json.errors));
      }
      return json.data;
    } catch (err: any) {
      console.error('[Vendure Service] Error in GraphQL query:', err.message);
      return null;
    }
  },

  /**
   * Fetch products using the `products` query.
   * This returns ALL products regardless of whether they have variants or not—
   * unlike the `search` query which only indexes product variants.
   */
  async fetchProducts(filters: {
    term?: string;
    limit?: number;
  }) {
    // Build filter parameter for the products query
    const hasFilter = !!filters.term;
    const filterClause = hasFilter ? '$filter: ProductFilterParameter' : '';
    const filterArg = hasFilter ? ', filter: $filter' : '';

    const query = `
      query GetVendureProducts($take: Int!${filterClause ? ', ' + filterClause : ''}) {
        products(options: { take: $take${filterArg} }) {
          totalItems
          items {
            id
            name
            slug
            featuredAsset {
              id
              preview
            }
            variants {
              priceWithTax
              currencyCode
            }
          }
        }
      }
    `;

    const variables: Record<string, any> = {
      take: filters.limit || 25,
    };

    if (filters.term) {
      variables.filter = {
        name: { contains: filters.term }
      };
    }

    const data = await this.graphqlQuery(query, variables);
    const productsResult = data?.products;

    if (!productsResult || !productsResult.items) {
      return {
        totalItems: 0,
        slugPointers: [],
        products: []
      };
    }

    const items = productsResult.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      asset: item.featuredAsset?.preview || null,
      price: item.variants?.[0]?.priceWithTax || 0,
      currency: item.variants?.[0]?.currencyCode || 'USD'
    }));

    const slugs = items.map((item: any) => item.slug).filter(Boolean);

    return {
      totalItems: productsResult.totalItems || items.length,
      slugPointers: slugs,
      products: items,
    };
  },

  /**
   * Search products using the `search` query (DefaultSearchPlugin).
   * This is needed for facet-based and collection-based filtering,
   * but only indexes products that have at least one variant.
   */
  async searchVendureProducts(filters: {
    term?: string;
    collectionSlug?: string;
    collectionId?: string;
    facetValueIds?: string[];
    limit?: number;
  }) {
    // If no collection or facet filter is applied, use the products query instead
    // since it returns ALL products including those without variants
    const usesSearchOnlyFilters = (
      filters.collectionSlug ||
      filters.collectionId ||
      (filters.facetValueIds && filters.facetValueIds.length > 0)
    );

    if (!usesSearchOnlyFilters) {
      return this.fetchProducts({
        term: filters.term,
        limit: filters.limit,
      });
    }

    // Use the search query for collection/facet filtering
    const query = `
      query SearchVendureProducts($input: SearchInput!) {
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
          collections {
            collection {
              id
              name
              slug
            }
            count
          }
          facetValues {
            facetValue {
              id
              name
              code
            }
            count
          }
        }
      }
    `;

    const input: Record<string, any> = {
      take: filters.limit || 25,
      groupByProduct: true,
    };

    if (filters.term) {
      input.term = filters.term;
    }

    if (filters.collectionSlug) {
      input.collectionSlug = filters.collectionSlug;
    } else if (filters.collectionId) {
      input.collectionId = filters.collectionId;
    }

    if (filters.facetValueIds && filters.facetValueIds.length > 0) {
      input.facetValueIds = filters.facetValueIds;
    }

    const data = await this.graphqlQuery(query, { input });
    const searchResult = data?.search;

    if (!searchResult || !searchResult.items) {
      return {
        totalItems: 0,
        slugPointers: [],
        products: []
      };
    }

    // Extract slug pointers
    const items = searchResult.items.map((item: any) => ({
      id: item.productId,
      name: item.productName,
      slug: item.slug, // Pointer
      asset: item.productAsset?.preview || null,
      price: item.priceWithTax?.value || item.priceWithTax?.min || 0,
      currency: item.currencyCode || 'USD'
    }));

    const slugs = items.map((item: any) => item.slug).filter(Boolean);

    return {
      totalItems: searchResult.totalItems || items.length,
      slugPointers: slugs,
      products: items,
      availableCollections: searchResult.collections || [],
      availableFacets: searchResult.facetValues || []
    };
  },

  /**
   * Fetch Collections list from Vendure
   */
  async getVendureCollections() {
    const query = `
      query GetVendureCollections {
        collections {
          items {
            id
            name
            slug
            parent {
              id
              name
            }
          }
        }
      }
    `;

    const data = await this.graphqlQuery(query);
    return data?.collections?.items || [];
  },

  /**
   * Fetch Facets list from Vendure
   */
  async getVendureFacets() {
    const query = `
      query GetVendureFacets {
        facets {
          items {
            id
            name
            code
            values {
              id
              name
              code
            }
          }
        }
      }
    `;

    const data = await this.graphqlQuery(query);
    return data?.facets?.items || [];
  },

  /**
   * Resolve specific product slug pointers from Vendure.
   * Uses the products query with slug filter for accurate matching.
   */
  async resolveSlugs(slugs: string[]) {
    if (!slugs || slugs.length === 0) return [];

    const resolved: any[] = [];
    for (const slug of slugs) {
      const query = `
        query ResolveProductSlug($slug: String!) {
          products(options: { filter: { slug: { eq: $slug } }, take: 1 }) {
            items {
              id
              name
              slug
              featuredAsset {
                id
                preview
              }
              variants {
                priceWithTax
                currencyCode
              }
            }
          }
        }
      `;

      const data = await this.graphqlQuery(query, { slug });
      const items = data?.products?.items;

      if (items && items.length > 0) {
        const item = items[0];
        resolved.push({
          id: item.id,
          name: item.name,
          slug: item.slug,
          asset: item.featuredAsset?.preview || null,
          price: item.variants?.[0]?.priceWithTax || 0,
          currency: item.variants?.[0]?.currencyCode || 'USD',
        });
      } else {
        resolved.push({ slug, name: slug, pointerOnly: true });
      }
    }
    return resolved;
  }
});
