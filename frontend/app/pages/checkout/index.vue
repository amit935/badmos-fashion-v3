<script setup>
import { onMounted, ref } from 'vue';
import { useCartStore } from '~/store/cart';
import { useCheckoutStore } from '~/store/checkout';

definePageMeta({
  layout: 'app-layout',
  middleware: 'require-login',
});

const cart = useCartStore();
const checkout = useCheckoutStore();

const isReady = ref(false);

onMounted(async () => {
  await checkout.load();

  // Nothing to check out
  if (cart.items.length === 0) {
    await navigateTo('/');
    return;
  }

  isReady.value = true;
});

async function onContinue() {
  const success = await checkout.submitCustomerInfo();

  if (success) {
    await navigateTo('/checkout/payment');
  }
}
</script>

<template>
  <section class="max-width px-4 py-10">
    <h1 class="secondary-font text-4xl uppercase">Checkout</h1>

    <p v-if="!isReady" class="text-gray-500 mt-6">Loading checkout...</p>

    <div v-else class="mt-8 grid md:grid-cols-2 gap-10">
      <form class="space-y-6" @submit.prevent="onContinue">
        <h2 class="text-xl font-bold uppercase">Shipping address</h2>

        <CheckoutAddressCarousel
          v-if="checkout.savedAddresses.length"
          :addresses="checkout.savedAddresses"
          :active-id="checkout.matchingSavedId(checkout.shippingAddress)"
          @select="checkout.selectSavedAddress('shipping', $event)"
          @new="checkout.startNewAddress('shipping')"
        />

        <CheckoutAddressFields :address="checkout.shippingAddress" id-prefix="shipping" />

        <label
          v-if="!checkout.matchingSavedId(checkout.shippingAddress)"
          class="flex items-center gap-2 text-sm"
        >
          <input type="checkbox" v-model="checkout.saveShipping" />
          Save this address to my account for next time
        </label>

        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="checkout.billingSameAsShipping" />
          Billing address same as shipping address
        </label>

        <template v-if="!checkout.billingSameAsShipping">
          <h2 class="text-xl font-bold uppercase">Billing address</h2>

          <CheckoutAddressCarousel
            v-if="checkout.savedAddresses.length"
            :addresses="checkout.savedAddresses"
            :active-id="checkout.matchingSavedId(checkout.billingAddress)"
            @select="checkout.selectSavedAddress('billing', $event)"
            @new="checkout.startNewAddress('billing')"
          />

          <CheckoutAddressFields :address="checkout.billingAddress" id-prefix="billing" />

          <label
            v-if="!checkout.matchingSavedId(checkout.billingAddress)"
            class="flex items-center gap-2 text-sm"
          >
            <input type="checkbox" v-model="checkout.saveBilling" />
            Save this billing address to my account for next time
          </label>
        </template>

        <CheckoutShippingMethods />

        <p v-if="checkout.error" class="text-red-600 text-sm">{{ checkout.error }}</p>

        <UiButton
          type="submit"
          text="Continue to payment"
          content-classes="w-full"
          :loading="checkout.loading"
          :disabled="checkout.loading || checkout.calculating"
        />
      </form>

      <CheckoutOrderSummary :allow-coupon="true" />
    </div>
  </section>
</template>