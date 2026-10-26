<script setup>
import { computed } from 'vue';
import SectionWrapper from '~/components/wrapper/SectionWrapper.vue';
import ProductCard from '~/components/product/ProductCard.vue';
import UiSpinner from '~/components/ui/spinner.vue';

const props = defineProps({
  title: { type: String, default: '' },
  products: { type: Array, default: () => [] },
  productSlugs: { type: Array, default: () => [] },
  categorySlugs: { type: Array, default: () => [] },
  productIds: { type: Array, default: () => [] },
  caption: { type: String, default: '' },
});

// Full product objects passed in directly: nothing to fetch
const hasFullProducts = computed(
  () =>
    Array.isArray(props.products) &&
    props.products.length > 0 &&
    props.products[0]?.id &&
    (props.products[0]?.name || props.products[0]?.slug || props.products[0]?.title)
);

// Decide what to ask /api/shop/products for (same priority as before)
const query = computed(() => {
  if (hasFullProducts.value) return null;
  if (props.productSlugs?.length) return { slugs: props.productSlugs.join(',') };
  if (props.categorySlugs?.length) return { collections: props.categorySlugs.join(',') };
  if (props.productIds?.length) return { ids: props.productIds.join(',') };
  if (typeof props.products?.[0] === 'string') return { slugs: props.products.join(',') };
  return null;
});

// Awaited, so the server renders the products into the HTML
const { data, pending, error } = await useAsyncData(
  `product-list-${JSON.stringify(query.value)}`,
  async () => {
    if (!query.value) return [];
    const res = await $fetch('/api/shop/products', { query: query.value });
    return res?.products || [];
  },
  { watch: [query] }
);

const finalProducts = computed(() =>
  hasFullProducts.value ? props.products : data.value || []
);
</script>

<template>
  <SectionWrapper :title="title" :caption="caption">
    <template #content>
      <div class="products-grid">
        <UiSpinner v-if="pending" size="lg" message="Loading Products..." />
        <p v-else-if="error" class="error">Could not load products.</p>
        <p v-else-if="!finalProducts.length" class="no-products">No products available</p>
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
  .products-grid { gap: 24px; }
  .products-grid > * {
    flex: 0 0 calc(25% - 18px);
    max-width: calc(25% - 18px);
  }
}

@media (max-width: 1023px) and (min-width: 769px) {
  .products-grid { gap: 16px; }
  .products-grid > * {
    flex: 0 0 calc(50% - 8px);
    max-width: calc(50% - 8px);
  }
}

@media (max-width: 768px) {
  .products-grid { gap: 12px; }
  .products-grid > * {
    flex: 0 0 calc(50% - 6px);
    max-width: calc(50% - 6px);
  }
}
</style>