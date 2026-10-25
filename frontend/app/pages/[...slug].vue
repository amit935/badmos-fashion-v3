<script setup>
import { useRoute } from 'vue-router';
import { useCmsStore } from '~/store/cms';
import { useHead } from '#imports';
import CarouselHeroCarousel from '~/components/carousel/hero-carousel.vue';
import ProductListSection from '~/components/sections/product-list-section.vue';

definePageMeta({
  layout: 'app-layout',
});

const route = useRoute();
const cmsStore = useCmsStore();

const slugParam = route.params.slug;
const slugPath = Array.isArray(slugParam) ? `/${slugParam.join('/')}` : (slugParam ? `/${slugParam}` : '/');

await useAsyncData(`cms-page-${slugPath}`, () => cmsStore.fetchPage(slugPath), { getCachedData: () => null });

useHead({
  title: () => cmsStore.pageMeta?.title || '',
});

const componentMap = {
  'carousel.hero-carousel': CarouselHeroCarousel,
  'hero-carousel': CarouselHeroCarousel,
  'sections.product-list-section': ProductListSection,
  'product-list-section': ProductListSection,
  'sections.product-list': ProductListSection,
  'product-list': ProductListSection
};

function resolveComponentBlock(strapiId) {
  if (!strapiId) return 'div';
  return componentMap[strapiId] || CarouselHeroCarousel || 'div';
}
</script>

<template>
  <div class="cms-page min-h-screen">
    <!-- Page Builder Render Loop (Strictly renders blocks fetched from Strapi) -->
    <div class="page-blocks flex flex-col gap-y-0">
      <component 
        v-for="(block, index) in cmsStore.pageBlocks"
        :key="block.id || index"
        :is="resolveComponentBlock(block.__component)"
        v-bind="block"
      />
    </div>
  </div>
</template>
