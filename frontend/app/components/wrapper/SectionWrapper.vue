<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  caption: {
    type: String,
    default: '',
  }
});
</script>

<template>
  <section class="section-wrapper py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-width">
      <div v-if="title || caption || $slots.header" class="section-header text-center mb-8">
        <slot name="header">
          <h2 v-if="title" class="section-title text-3xl sm:text-4xl font-bold tracking-tight uppercase text-black mb-2">
            {{ title }}
          </h2>
          <p v-if="caption" class="section-caption text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            {{ caption }}
          </p>
        </slot>
      </div>

      <div class="section-content">
        <slot name="content">
          <slot />
        </slot>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-wrapper {
  width: 100%;
}
</style>
