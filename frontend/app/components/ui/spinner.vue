<script setup>
defineProps({
  size: {
    type: String,
    default: 'md' // 'sm', 'md', 'lg'
  },
  message: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div class="loading-indicator flex flex-col items-center justify-center gap-3">
    <div :class="['spinner', `spinner-${size}`]"></div>
    <p v-if="message" class="text-sm font-medium text-white/80 animate-pulse tracking-wide">{{ message }}</p>
  </div>
</template>

<style scoped>
.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-sm {
  width: 24px;
  height: 24px;
  border-width: 2px;
}

.spinner-md {
  width: 40px;
  height: 40px;
  border-width: 4px;
}

.spinner-lg {
  width: 56px;
  height: 56px;
  border-width: 5px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
