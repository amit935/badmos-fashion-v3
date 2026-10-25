<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  panelDir: {
    type: String,
    default: 'left', // 'left', 'center', 'right'
  },
  underline: {
    type: Boolean,
    default: true,
  },
});

const isOpen = ref(false);

const panelDirClass = computed(() => {
  switch (props.panelDir) {
    case 'center':
      return 'left-1/2 -translate-x-1/2';
    case 'right':
      return 'right-0';
    case 'left':
    default:
      return 'left-0';
  }
});

function onMouseEnter() {
  isOpen.value = true;
}

function onMouseLeave() {
  isOpen.value = false;
}

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div
    class="relative h-full"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div
      class="h-full px-2 py-1 flex items-center border-b-3 cursor-pointer"
      :class="isOpen && underline ? 'border-primary' : 'border-transparent'"
      @click="toggleDropdown"
    >
      <slot name="header" />
    </div>

    <div
      v-if="isOpen"
      :class="[
        'max-h-[580px] max-w-[720px] min-w-[175px] mt-1 p-4 absolute top-full border-2 border-black z-10 space-y-2 bg-white rounded-md overflow-auto',
        panelDirClass
      ]"
    >
      <slot name="panel" />
    </div>
  </div>
</template>
