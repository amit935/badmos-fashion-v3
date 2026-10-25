<script setup>
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white text-black">
    <Header />
    <main class="w-full flex-grow">
      <slot />
    </main>
    <Footer />
  </div>
</template>