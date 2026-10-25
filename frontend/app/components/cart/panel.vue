<script setup>
const emit = defineEmits(['toggleMenu']);
</script>

<template>
  <div>
    <button
      @click="emit('toggleMenu')"
      class="p-1 absolute top-0 right-0 m-4 text-gray-400 hover:text-red-600 transition-colors"
      aria-label="Close cart"
    >
      <Icon name="material-symbols:close" size="24" />
    </button>
    <h2 class="text-2xl font-bold secondary-font">Shopping Cart</h2>
    <p class="text-gray-500 mt-4">Your cart is empty.</p>
  </div>
</template>
