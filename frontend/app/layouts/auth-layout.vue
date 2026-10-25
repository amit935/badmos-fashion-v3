<script setup>
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['submit']);
function onFormSubmit(e) {
  e.preventDefault();
  emit('submit');
}

const { t } = useI18n();
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center space-y-6 px-8 py-8 sm:px-0">
    <NuxtLink to="/">
      <UiAppLogo size="large" />
    </NuxtLink>
    <div class="py-12 px-4 sm:px-8 space-y-4 bg-white rounded-lg max-w-full sm:max-w-lg border border-black">
      <slot />
    </div>
    <footer>
      <p class="text-center">{{ t('footer.copyright') }}</p>
    </footer>
  </div>
</template>