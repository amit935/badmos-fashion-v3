<script setup>
import { useCmsStore } from '~/store/cms';
import CarouselHeroCarousel from '~/components/carousel/hero-carousel.vue';
import ProductListSection from '~/components/sections/product-list-section.vue';
import CollectionListing from '~/components/collection/CollectionListing.vue';
import ProductDetail from '~/components/product/ProductDetail.vue';

definePageMeta({
  layout: 'app-layout',
  key: (route) => route.fullPath,
});

const route = useRoute();
const cmsStore = useCmsStore();

const slugPath = computed(() => {
  const s = route.params.slug;
  return Array.isArray(s) ? `/${s.join('/')}` : `/${s || ''}`;
});

// Everything the page needs lives in this one payload, so server and client agree
const { data: resolved } = await useAsyncData(`page-${slugPath.value}`, async () => {
  let page = null;
  try {
    page = await cmsStore.fetchPage(slugPath.value);
  } catch (e) {
    cmsStore.clearPage();
  }
  if (page?.blocks?.length) {
    return { type: 'cms', blocks: page.blocks, meta: page.meta || {} };
  }
  return await $fetch('/api/shop/resolve', { query: { path: slugPath.value } });
});

const r = resolved.value;

if ((r?.type === 'product' || r?.type === 'collection') && r.canonical !== slugPath.value) {
  await navigateTo(r.canonical, { redirectCode: 301, replace: true });
}

if (!r || r.type === 'none') {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

useHead(() => {
  const x = resolved.value;
  if (x?.type === 'product') {
    return { title: x.product.name, link: [{ rel: 'canonical', href: `https://yourdomain.com${x.canonical}` }] };
  }
  if (x?.type === 'collection') {
    return { title: x.collection.name, link: [{ rel: 'canonical', href: `https://yourdomain.com${x.canonical}` }] };
  }
  return { title: x?.meta?.title || '' };
});

const componentMap = {
  'carousel.hero-carousel': CarouselHeroCarousel,
  'sections.product-list-section': ProductListSection,
};
</script>

<template>
  <div class="cms-page min-h-screen">
    <div v-if="resolved?.type === 'cms'" class="page-blocks flex flex-col">
      <component
        v-for="(block, i) in resolved.blocks"
        :key="block.id || i"
        :is="componentMap[block.__component] || 'div'"
        v-bind="block"
      />
    </div>
    <CollectionListing
      v-else-if="resolved?.type === 'collection'"
      :collection="resolved.collection"
      :crumbs="resolved.crumbs"
    />
    <ProductDetail v-else-if="resolved?.type === 'product'" :product="resolved.product" />
  </div>
</template>