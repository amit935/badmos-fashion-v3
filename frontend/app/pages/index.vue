<script setup>
import { computed, onMounted } from 'vue';
import { useCmsStore } from '~/store/cms';
import { useHead, useAsyncData } from '#imports';
import CarouselHeroCarousel from '~/components/carousel/hero-carousel.vue';
import ProductListSection from '~/components/sections/product-list-section.vue';

definePageMeta({
  layout: 'app-layout',
});

const cmsStore = useCmsStore();

const { data: pageData, refresh } = await useAsyncData('cms-page-home', () => cmsStore.fetchPage('/'));

const pageBlocks = computed(() => pageData.value?.blocks || cmsStore.pageBlocks || []);
const pageMeta = computed(() => pageData.value?.meta || cmsStore.pageMeta || {});

onMounted(() => {
  if (!pageData.value || !pageData.value.blocks || pageData.value.blocks.length === 0) {
    refresh();
  }
});

useHead({
  title: () => pageMeta.value?.title || '',
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
        v-for="(block, index) in pageBlocks"
        :key="block.id || index"
        :is="resolveComponentBlock(block.__component)"
        v-bind="block"
      />
    </div>
  </div>
</template>
