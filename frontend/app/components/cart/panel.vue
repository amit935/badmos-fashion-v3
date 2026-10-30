<script setup>
import { useCartStore } from '~/store/cart';
import { usePriceFormatter } from '~/composables/usePriceFormatter';

const emit = defineEmits(['toggleMenu']);

const cart = useCartStore();
const { formatPrice } = usePriceFormatter();

function increase(item) {
  cart.setQuantity(item.variantId, item.quantity + 1);
}

function decrease(item) {
  cart.setQuantity(item.variantId, item.quantity - 1);
}

function removeItem(item) {
  cart.remove(item.variantId);
}

async function goToCheckout() {
  await cart.flushAll();   // send pending quantity edits first
  emit('toggleMenu');      // close the panel
  await navigateTo('/checkout');
}
</script>

<template>
  <div class="flex flex-col h-full">
    <button
      @click="emit('toggleMenu')"
      class="p-1 absolute top-0 right-0 m-4 text-gray-400 hover:text-red-600 transition-colors"
      aria-label="Close cart"
    >
      <Icon name="material-symbols:close" size="24" />
    </button>

    <h2 class="text-2xl font-bold secondary-font">Shopping Cart</h2>

    <p v-if="cart.error" class="text-red-600 text-sm mt-2">{{ cart.error }}</p>

    <ul v-if="cart.mergeIssues.length" class="text-orange-600 text-sm mt-2">
      <li v-for="issue in cart.mergeIssues" :key="issue.name">
        {{ issue.name }} could not be added: {{ issue.reason }}
      </li>
    </ul>

    <p v-if="cart.items.length === 0" class="text-gray-500 mt-4">Your cart is empty.</p>

    <ul v-else class="mt-6 flex-grow overflow-y-auto space-y-4">
      <li
        v-for="item in cart.items"
        :key="item.variantId"
        class="flex gap-3 border-b border-gray-200 pb-4"
      >
        <img :src="item.image" :alt="item.name" class="w-20 h-24 object-cover border border-black" />

        <div class="flex-1 space-y-1">
          <NuxtLink :to="item.path" class="font-semibold" @click="emit('toggleMenu')">
            {{ item.name }}
          </NuxtLink>
          <p class="text-sm text-gray-500">{{ item.options.join(' / ') }}</p>
          <p class="font-bold">{{ formatPrice(item.unitPrice, item.currencyCode) }}</p>

          <div class="flex items-center gap-2">
            <button class="w-7 h-7 border border-black" @click="decrease(item)">-</button>
            <span>{{ item.quantity }}</span>
            <button class="w-7 h-7 border border-black" @click="increase(item)">+</button>
            <button class="ml-3 text-sm underline text-gray-500" @click="removeItem(item)">Remove</button>
          </div>
        </div>
      </li>
    </ul>

    <div v-if="cart.items.length" class="py-4 border-t-2 border-black flex justify-between font-bold">
      <span>Subtotal</span>
      <span>{{ formatPrice(cart.subtotal, cart.currencyCode) }}</span>
    </div>
    <div v-if="cart.items.length" class="py-4 border-t-2 border-black flex justify-between font-bold">
      <UiButton text="Checkout" content-classes="w-full" @click="goToCheckout" />
    </div>
  </div>
</template>