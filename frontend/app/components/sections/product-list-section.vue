<script setup>
import { computed, watch } from 'vue';
import SectionWrapper from '~/components/wrapper/SectionWrapper.vue';
import ProductCard from '~/components/product/ProductCard.vue';
import UiSpinner from '~/components/ui/spinner.vue';
import { useProducts } from '~/composables/useProducts';

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  products: {
    type: Array,
    default: () => [],
  },
  productSlugs: {
    type: Array,
    default: () => [],
  },
  categorySlugs: {
    type: Array,
    default: () => [],
  },
  productIds: {
    type: Array,
    default: () => [],
  },
  caption: {
    type: String,
    default: '',
  }
});

// Check if we have full product objects (Priority 1)
const hasFullProducts = computed(() => {
  return Array.isArray(props.products) && 
         props.products.length > 0 && 
         props.products[0]?.id && 
         (props.products[0]?.name || props.products[0]?.slug || props.products[0]?.title);
});

// Determine fetch strategy
const fetchStrategy = computed(() => {
  // Priority 1: Use full products if available
  if (hasFullProducts.value) {
    return { type: 'direct', data: props.products };
  }
  
  // Priority 2: Use productSlugs pointers from Strapi if available
  if (Array.isArray(props.productSlugs) && props.productSlugs.length > 0) {
    return { type: 'slugs', data: props.productSlugs };
  }

  // Priority 3: Use categorySlugs if available
  if (Array.isArray(props.categorySlugs) && props.categorySlugs.length > 0) {
    return { type: 'collections', data: props.categorySlugs };
  }
  
  // Priority 4: Use productIds if available
  if (Array.isArray(props.productIds) && props.productIds.length > 0) {
    return { type: 'ids', data: props.productIds };
  }
  
  // Priority 5: Try to use products as slug/ID strings
  if (Array.isArray(props.products) && props.products.length > 0 && typeof props.products[0] === 'string') {
    return { type: 'slugs', data: props.products };
  }
  
  return { type: 'none', data: [] };
});

// Initialize composable with strategy-based data
const { 
  products: fetchedProducts, 
  isLoading, 
  error, 
  loadProductsByIds,
  loadProductsByCollections,
  loadProductsBySlugs
} = useProducts(
  fetchStrategy.value.type === 'direct' ? fetchStrategy.value.data : []
);

// Final products to display
const finalProducts = computed(() => {
  if (fetchStrategy.value.type === 'direct') {
    return fetchStrategy.value.data;
  }
  return fetchedProducts.value || [];
});

// Watch and reload based on strategy
watch(
  () => [props.products, props.productSlugs, props.categorySlugs, props.productIds, fetchStrategy.value.type],
  ([newProducts, newProductSlugs, newCategorySlugs, newProductIds, strategyType]) => {
    if (strategyType === 'slugs') {
      const slugsToLoad = newProductSlugs?.length > 0 ? newProductSlugs : newProducts;
      if (slugsToLoad && slugsToLoad.length) {
        loadProductsBySlugs(slugsToLoad);
      }
    } else if (strategyType === 'collections' && newCategorySlugs?.length > 0) {
      loadProductsByCollections(newCategorySlugs);
    } else if (strategyType === 'ids') {
      const idsToLoad = newProductIds?.length > 0 ? newProductIds : newProducts;
      if (idsToLoad && idsToLoad.length) {
        loadProductsByIds(idsToLoad);
      }
    }
  },
  { immediate: true }
);
</script>

<template>
  <SectionWrapper :title="title" :caption="caption">
    <template #content>
      <div class="products-grid">
        <UiSpinner v-if="isLoading" size="lg" message="Loading Products..." />
        <template v-else-if="error">
          <p class="error">Error: {{ error }}</p>
        </template>
        <template v-else-if="!finalProducts || finalProducts.length === 0">
          <p class="no-products">No products available</p>
        </template>
        <template v-else>
          <ProductCard 
            v-for="product in finalProducts" 
            :key="product.id || product.slug"
            :product="product"
          />
        </template>
      </div>
    </template>
  </SectionWrapper>
</template>

<style scoped>
.products-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  align-items: stretch;
  min-height: 200px;
}

.products-grid > * {
  flex: 0 0 calc(25% - 15px);
  max-width: calc(25% - 15px);
}

.loading-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  margin: 0;
  font-size: 16px;
  color: #666;
}

.error {
  width: 100%;
  text-align: center;
  padding: 40px 20px;
  color: #d32f2f;
  font-size: 16px;
}

.no-products {
  width: 100%;
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
}

@media (min-width: 1024px) {
  .products-grid {
    gap: 24px;
  }
  .products-grid > * {
    flex: 0 0 calc(25% - 18px);
    max-width: calc(25% - 18px);
  }
}

@media (max-width: 1023px) and (min-width: 769px) {
  .products-grid {
    gap: 16px;
  }
  .products-grid > * {
    flex: 0 0 calc(50% - 8px);
    max-width: calc(50% - 8px);
  }
}

@media (max-width: 768px) {
  .products-grid {
    gap: 12px;
  }
  .products-grid > * {
    flex: 0 0 calc(50% - 6px);
    max-width: calc(50% - 6px);
  }
}
</style>
