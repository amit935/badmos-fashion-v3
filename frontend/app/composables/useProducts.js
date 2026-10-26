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
        products.value = [];
      }
    } catch (err) {
      console.warn('Unable to fetch products by collections:', err);
      error.value = err.message || 'Failed to load products';
      products.value = [];
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
        products.value = [];
      }
    } catch (err) {
      console.warn('Unable to fetch products by IDs:', err);
      error.value = err.message || 'Failed to load products';
      products.value = [];
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
        products.value = [];
      }
    } catch (err) {
      console.warn('Unable to fetch products by slug pointers:', err);
      error.value = err.message || 'Failed to load products';
      products.value = [];
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
