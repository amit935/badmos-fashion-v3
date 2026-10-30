<script setup>
import { useCartStore } from '~/store/cart';
import { useCheckoutStore } from '~/store/checkout';
import { usePriceFormatter } from '~/composables/usePriceFormatter';

const cart = useCartStore();
const checkout = useCheckoutStore();
const { formatPrice } = usePriceFormatter();
</script>

<template>
  <fieldset v-if="checkout.shippingMethods.length > 1" class="space-y-2">
    <legend class="text-xl font-bold uppercase mb-2">Shipping method</legend>

    <label
      v-for="method in checkout.shippingMethods"
      :key="method.id"
      class="flex items-center justify-between gap-3 border-2 border-black p-3 cursor-pointer"
    >
      <span class="flex items-center gap-2">
        <input
          type="radio"
          name="shipping-method"
          :value="method.id"
          :checked="checkout.selectedShippingMethodId === method.id"
          @change="checkout.chooseShippingMethod(method.id)"
        />
        {{ method.name }}
      </span>
      <span class="font-bold">
        {{ method.priceWithTax > 0 ? formatPrice(method.priceWithTax, cart.order.currencyCode) : 'FREE' }}
      </span>
    </label>
  </fieldset>
</template>