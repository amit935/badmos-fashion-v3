<script setup>
import { ref } from 'vue';

defineProps({
  addresses: { type: Array, required: true },
  activeId: { type: [String, Number], default: null },
});

const emit = defineEmits(['select', 'new']);

const track = ref(null);

function scroll(direction) {
  track.value?.scrollBy({ left: direction * 260, behavior: 'smooth' });
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center"
      aria-label="Previous addresses"
      @click="scroll(-1)"
    >
      <Icon name="material-symbols:chevron-left" size="20" />
    </button>

    <div ref="track" class="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth px-1 py-1">
      <button
        v-for="address in addresses"
        :key="address.id"
        type="button"
        class="snap-start shrink-0 w-60 border-2 p-3 text-left text-sm space-y-1"
        :class="activeId === address.id ? 'border-black bg-gray-100' : 'border-gray-300 bg-white'"
        @click="emit('select', address)"
      >
        <p class="font-bold">{{ address.fullName }}</p>
        <p class="text-gray-600">
          {{ address.streetLine1 }}<span v-if="address.streetLine2">, {{ address.streetLine2 }}</span>
        </p>
        <p class="text-gray-600">{{ address.city }}, {{ address.province }} {{ address.postalCode }}</p>
        <p class="text-gray-600">{{ address.phoneNumber }}</p>
      </button>

      <button
        type="button"
        class="snap-start shrink-0 w-40 border-2 border-dashed border-black p-3 text-sm font-bold uppercase flex items-center justify-center"
        @click="emit('new')"
      >
        + New address
      </button>
    </div>

    <button
      type="button"
      class="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center"
      aria-label="Next addresses"
      @click="scroll(1)"
    >
      <Icon name="material-symbols:chevron-right" size="20" />
    </button>
  </div>
</template>