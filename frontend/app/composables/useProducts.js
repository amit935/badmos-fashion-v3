import { ref } from 'vue';
import { useRuntimeConfig } from '#imports';

/**
 * Composable for loading and managing product lists.
 * Supports direct product arrays, category collection slugs, or product ID queries.
 */
export function useProducts(initialProducts = []) {
  const products = ref(initialProducts || []);
  const isLoading = ref(false);
  const error = ref(null);
  const runtimeConfig = useRuntimeConfig();

  /**
   * Fetch products by category / collection slugs
   */
  const loadProductsByCollections = async (categorySlugs) => {
    if (!categorySlugs || categorySlugs.length === 0) return;
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch('/api/shop/products', {
        query: { collections: categorySlugs.join(',') }
      }).catch(() => null);

      if (response && Array.isArray(response.products)) {
        products.value = response.products;
      } else if (Array.isArray(response)) {
        products.value = response;
      } else {
        products.value = getMockProducts();
      }
    } catch (err) {
      console.warn('Unable to fetch products by collections, using fallback catalog:', err);
      error.value = err.message || 'Failed to load products';
      products.value = getMockProducts();
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch products by product IDs
   */
  const loadProductsByIds = async (productIds) => {
    if (!productIds || productIds.length === 0) return;
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch('/api/shop/products', {
        query: { ids: productIds.join(',') }
      }).catch(() => null);

      if (response && Array.isArray(response.products)) {
        products.value = response.products;
      } else if (Array.isArray(response)) {
        products.value = response;
      } else {
        products.value = getMockProducts();
      }
    } catch (err) {
      console.warn('Unable to fetch products by IDs, using fallback catalog:', err);
      error.value = err.message || 'Failed to load products';
      products.value = getMockProducts();
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch products by slug pointers (stored in Strapi)
   */
  const loadProductsBySlugs = async (productSlugs) => {
    if (!productSlugs || productSlugs.length === 0) return;
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch('/api/shop/products', {
        query: { slugs: productSlugs.join(',') }
      }).catch(() => null);

      if (response && Array.isArray(response.products)) {
        products.value = response.products;
      } else if (Array.isArray(response)) {
        products.value = response;
      } else {
        products.value = getMockProducts();
      }
    } catch (err) {
      console.warn('Unable to fetch products by slug pointers, using fallback catalog:', err);
      error.value = err.message || 'Failed to load products';
      products.value = getMockProducts();
    } finally {
      isLoading.value = false;
    }
  };

  return {
    products,
    isLoading,
    error,
    loadProductsByCollections,
    loadProductsByIds,
    loadProductsBySlugs
  };
}

/**
 * Fallback product catalog for design preview and fallback states
 */
function getMockProducts() {
  return [
    {
      id: '1',
      slug: 'classic-cotton-tshirt',
      name: 'Classic Cotton T-Shirt',
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
}
