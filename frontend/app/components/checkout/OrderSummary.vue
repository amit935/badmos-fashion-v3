<script setup>
import { computed } from 'vue';
import { useCartStore } from '~/store/cart';
import { useCheckoutStore } from '~/store/checkout';
import { usePriceFormatter } from '~/composables/usePriceFormatter';

defineProps({
  allowCoupon: { type: Boolean, default: false },
});

const cart = useCartStore();
const checkout = useCheckoutStore();
const { formatPrice } = usePriceFormatter();

const shippingLabel = computed(() => {
  const order = cart.order;

  if (checkout.calculating) return 'Calculating...';

  if (order.shippingLines?.length) {
    return order.shipping > 0 ? formatPrice(order.shipping, order.currencyCode) : 'FREE';
  }

  if (checkout.shippingChecked) {
    return checkout.shippingMethods.length > 1 ? 'Choose a shipping method' : 'FREE';
  }

  return 'Enter shipping address';
});

// Item prices before any discount, excluding tax
const itemsBase = computed(() =>
  (cart.order?.lines || []).reduce((sum, line) => sum + line.linePrice, 0)
);
</script>

<template>
  <aside v-if="cart.order" class="border-2 border-black p-6 space-y-4 h-fit">
    <h2 class="text-xl font-bold uppercase">Order summary</h2>

    <!-- Items (read-only) -->
    <ul class="space-y-3">
      <li v-for="item in cart.items" :key="item.variantId" class="flex gap-3">
        <img :src="item.image" :alt="item.name" class="w-16 h-20 object-cover border border-black" />
        <div class="flex-1">
          <p class="font-semibold">{{ item.name }}</p>
          <p class="text-sm text-gray-500">{{ item.options.join(' / ') }} · Qty {{ item.quantity }}</p>
        </div>
        <p class="font-bold">{{ formatPrice(item.unitPrice * item.quantity, item.currencyCode) }}</p>
      </li>
    </ul>

    <!-- Coupon -->
    <div v-if="allowCoupon" class="space-y-2">
      <div class="flex gap-2">
        <input
          v-model="checkout.couponInput"
          type="text"
          placeholder="Coupon code"
          class="flex-1 border border-gray-300 rounded-lg px-3 py-2 outline-none"
          @keyup.enter="checkout.applyCoupon()"
        />
        <button
          type="button"
          class="px-4 border-2 border-black uppercase text-sm font-bold"
          @click="checkout.applyCoupon()"
        >
          Apply
        </button>
      </div>
      <p v-if="checkout.couponError" class="text-red-600 text-sm">{{ checkout.couponError }}</p>
    </div>

    <ul v-if="cart.order.couponCodes.length" class="space-y-1 text-sm">
      <li v-for="code in cart.order.couponCodes" :key="code" class="flex justify-between">
        <span>Coupon: {{ code }}</span>
        <button
          v-if="allowCoupon"
          type="button"
          class="underline text-gray-500"
          @click="checkout.removeCoupon(code)"
        >
          Remove
        </button>
      </li>
    </ul>

        <!-- Totals -->
    <div class="border-t border-gray-200 pt-4 space-y-2 text-sm">
      <div class="flex justify-between">
        <span>Items (excl. tax)</span>
        <span>{{ formatPrice(itemsBase, cart.order.currencyCode) }}</span>
      </div>

      <div
        v-for="discount in cart.order.discounts"
        :key="discount.description"
        class="flex justify-between text-green-700"
      >
        <span>{{ discount.description }}</span>
        <span>{{ formatPrice(discount.amount, cart.order.currencyCode) }}</span>
      </div>

      <div
        v-if="cart.order.discounts.length"
        class="flex justify-between border-t border-gray-200 pt-2"
      >
        <span>Subtotal after discount</span>
        <span>{{ formatPrice(cart.order.subTotal, cart.order.currencyCode) }}</span>
      </div>

      <div class="flex justify-between">
        <span>Shipping</span>
        <span :class="shippingLabel === 'FREE' ? 'font-bold text-green-700' : ''">{{ shippingLabel }}</span>
      </div>

      <div
        v-for="tax in cart.order.taxSummary"
        :key="tax.description + tax.taxRate"
        class="flex justify-between text-gray-600"
      >
        <span>{{ tax.description }} ({{ tax.taxRate }}%)</span>
        <span>{{ formatPrice(tax.taxTotal, cart.order.currencyCode) }}</span>
      </div>

      <div class="flex justify-between text-base font-bold border-t border-black pt-2">
        <span>Total</span>
        <span>{{ formatPrice(cart.order.totalWithTax, cart.order.currencyCode) }}</span>
      </div>
    </div>
  </aside>
</template>