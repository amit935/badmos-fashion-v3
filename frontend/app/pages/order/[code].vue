<script setup>
definePageMeta({
  layout: 'app-layout',
  middleware: 'require-login',
});

const route = useRoute();
</script>

<template>
  <section class="max-width px-4 py-10">
    <h1 class="secondary-font text-4xl uppercase">Order {{ route.params.code }}</h1>
  </section>
</template>