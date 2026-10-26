<script setup>
import ProductCard from '~/components/product/ProductCard.vue';

const props = defineProps({
  collection: { type: Object, required: true },
  crumbs: { type: Array, default: () => [] },
});

const { data } = await useFetch('/api/shop/products', {
  query: { collections: props.collection.slug, limit: 48 },
  key: `collection-${props.collection.slug}`,
});
</script>

<template>
  <section class="max-width px-4 py-10">
    <nav v-if="crumbs.length" aria-label="Breadcrumb" class="mb-4 text-sm">
      <ol class="flex flex-wrap items-center gap-2">
        <li v-for="(c, i) in crumbs" :key="c.path" class="flex items-center gap-2">
          <NuxtLink
            v-if="i < crumbs.length - 1"
            :to="c.path"
            class="secondary-font text-4xl uppercase mb-8 underline-offset-2 hover:underline"
          >
            {{ c.name }}
          </NuxtLink>
          <span v-else class="secondary-font text-4xl uppercase mb-8" aria-current="page">{{ c.name }}</span>
          <span v-if="i < crumbs.length - 1" class="secondary-font text-4xl uppercase mb-8">&gt;</span>
        </li>
      </ol>
    </nav>

    <!-- <h1 class="secondary-font text-4xl uppercase mb-8">{{ collection.name }}</h1> -->
    <p v-if="!data?.products?.length" class="text-gray-500">No products found.</p>
    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <ProductCard v-for="p in data.products" :key="p.id" :product="p" />
    </div>
  </section>
</template>