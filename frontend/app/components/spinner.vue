<script setup>
import UiSpinner from '~/components/ui/spinner.vue';
defineProps({
  size: {
    type: String,
    default: 'md'
  },
  message: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <UiSpinner :size="size" :message="message" />
</template>
