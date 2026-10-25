<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCmsStore } from '~/store/cms';
import { useHead, useAsyncData } from '#imports';
import CarouselHeroCarousel from '~/components/carousel/hero-carousel.vue';

definePageMeta({
  layout: 'app-layout',
});

const route = useRoute();
const cmsStore = useCmsStore();

const slugParam = route.params.slug;
const slugPath = Array.isArray(slugParam) ? `/${slugParam.join('/')}` : (slugParam ? `/${slugParam}` : '/');

const { data: pageData, refresh } = await useAsyncData(`cms-page-${slugPath}`, () => cmsStore.fetchPage(slugPath));

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
  'hero-carousel': CarouselHeroCarousel
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
