import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Single Point of Truth Store (CMS)
 * 
 * This store dictates the structure and content of our application,
 * populated by the Strapi CMS.
 */
export const useCmsStore = defineStore('cms', () => {
  // ── State ──
  
  // Global Layout settings (e.g. Header configs, Footer configs, Site config)
  const globalLayout = ref({
    header: null,
    footer: null
  });

  // Current page schema/metadata (Title, SEO data, Slug)
  const pageMeta = ref({});
  
  // Current page dynamic layout blocks (Array of component objects from Strapi)
  const pageBlocks = ref([]);
  
  const loading = ref(false);
  const error = ref(null);

  // ── Actions ──

  /**
   * Fetches the global configuration (Header, Footer, Nav Links) from Strapi 
   * via our Nuxt Nitro caching layer.
   */
  async function fetchGlobalLayout() {
    try {
      const response = await $fetch('/api/cms/global');
      globalLayout.value = response || {};
      return response;
    } catch (err) {
      console.error('Failed to fetch global layout geometry:', err);
    }
  }

  /**
   * Fetches a specific page by its slug. The API will respond with 
   * the component arrangement (LayoutBlocks) telling the frontend exactly what to render.
   * 
   * @param {String} slug 
   */
  async function fetchPage(slug) {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch(`/api/cms/page?slug=${slug}`);
      pageMeta.value = response?.meta || {};
      pageBlocks.value = response?.blocks || [];
      return response;
    } catch (err) {
      error.value = err.message || 'Failed to fetch page schema.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Clear out the page setup (useful on unmounts or page transitions)
   */
  function clearPage() {
    pageBlocks.value = [];
    pageMeta.value = {};
    error.value = null;
  }

  return {
    // State
    globalLayout,
    pageMeta,
    pageBlocks,
    loading,
    error,
    
    // Actions
    fetchGlobalLayout,
    fetchPage,
    clearPage
  };
});
