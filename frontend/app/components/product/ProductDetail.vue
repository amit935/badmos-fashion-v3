<script setup>
import { useI18n } from 'vue-i18n';
import { useCartStore } from '~/store/cart';

import { computed, ref, watch } from 'vue';
import { usePriceFormatter } from '~/composables/usePriceFormatter';

const { formatPrice } = usePriceFormatter();
const { t } = useI18n();

const props = defineProps({
  product: { type: Object, required: true },
});

const route = useRoute();
const router = useRouter();

const groups = computed(() => props.product.optionGroups || []);
const variants = computed(() => props.product.variants || []);

// ---------- helpers ----------
const hasOption = (variant, groupCode, optionCode) =>
  (variant.options || []).some(
    (o) => o.group?.code === groupCode && o.code === optionCode
  );

const inStock = (variant) => variant.stockLevel !== 'OUT_OF_STOCK';

// Vendure prices are in minor units (e.g. paise/cents)
const money = (minor, currency) => formatPrice(minor, currency);

// ---------- selection state (initialised from the URL) ----------
function selectionFromQuery(query) {
  const result = {};
  for (const g of groups.value) {
    const raw = query[g.code];
    const wanted = (Array.isArray(raw) ? raw[0] : raw)?.toString().toLowerCase();
    const match = g.options.find((o) => o.code.toLowerCase() === wanted);
    result[g.code] = match ? match.code : null;
  }
  return result;
}

const selected = ref(selectionFromQuery(route.query));

// Browser back/forward or an edited URL updates the selection
watch(
  () => route.query,
  (q) => {
    const fromUrl = selectionFromQuery(q);
    if (JSON.stringify(fromUrl) !== JSON.stringify(selected.value)) {
      selected.value = fromUrl;
    }
  }
);

// ---------- availability ----------
// An option is available if some in-stock variant has it AND matches
// every OTHER group's current selection.
function isAvailable(groupCode, optionCode) {
  return variants.value.some(
    (v) =>
      inStock(v) &&
      hasOption(v, groupCode, optionCode) &&
      groups.value.every(
        (g) =>
          g.code === groupCode ||
          !selected.value[g.code] ||
          hasOption(v, g.code, selected.value[g.code])
      )
  );
}

function select(groupCode, optionCode) {
  if (!isAvailable(groupCode, optionCode)) return;

  // Click the active option again to clear it
  const next = {
    ...selected.value,
    [groupCode]: selected.value[groupCode] === optionCode ? null : optionCode,
  };

  // Drop other selections that are no longer possible
  for (const g of groups.value) {
    if (g.code === groupCode || !next[g.code]) continue;
    const stillValid = variants.value.some(
      (v) =>
        inStock(v) &&
        hasOption(v, g.code, next[g.code]) &&
        groups.value.every((o) => !next[o.code] || hasOption(v, o.code, next[o.code]))
    );
    if (!stillValid) next[g.code] = null;
  }

  selected.value = next;

  // Keep the URL in sync, preserving unrelated params
  const query = { ...route.query };
  for (const g of groups.value) {
    if (next[g.code]) query[g.code] = next[g.code];
    else delete query[g.code];
  }
  router.replace({ path: route.path, query });
}

// ---------- chosen variant ----------
const allChosen = computed(() => groups.value.every((g) => selected.value[g.code]));

const selectedVariant = computed(() => {
  if (!groups.value.length) return variants.value[0] || null;
  if (!allChosen.value) return null;
  return (
    variants.value.find((v) =>
      groups.value.every((g) => hasOption(v, g.code, selected.value[g.code]))
    ) || null
  );
});

const cart = useCartStore();

const isOutOfStock = computed(() => selectedVariant.value?.stockLevel === 'OUT_OF_STOCK');
const canAddToCart = computed(() => selectedVariant.value !== null && !isOutOfStock.value);

const addToCartLabel = computed(() => {
  if (!selectedVariant.value) return 'Select options';
  if (isOutOfStock.value) return 'Out of stock';
  return 'Add to cart';
});

function addToCart() {
  const variant = selectedVariant.value;
  if (!variant) return;

  cart.add({
    variantId: variant.id,
    name: props.product.name,
    variantName: variant.name,
    image: props.product.assets?.[0]?.preview || '',
    options: variant.options.map((option) => option.name),
    path: route.path,
    unitPrice: variant.priceWithTax,
    currencyCode: variant.currencyCode,
  });

  cart.isPanelOpen = true;
}

// ---------- price and tax ----------
const lowestVariant = computed(() =>
  [...variants.value].sort((a, b) => a.priceWithTax - b.priceWithTax)[0]
);

const priceInfo = computed(() => {
  const v = selectedVariant.value;
  if (!v) {
    const low = lowestVariant.value;
    return low ? { text: `From ${money(low.priceWithTax, low.currencyCode)}`, tax: null } : null;
  }
   const taxAmount = v.priceWithTax - v.price;
  const label = [v.taxCategory?.name, v.taxRateApplied ? `${v.taxRateApplied.value}%` : null]
    .filter(Boolean)
    .join(' ');
  return {
    text: money(v.priceWithTax, v.currencyCode),
    tax: taxAmount > 0
      ? t('product.taxInclusive', { label, amount: money(taxAmount, v.currencyCode) })
      : null,
  };
});

const missingGroups = computed(() =>
  groups.value.filter((g) => !selected.value[g.code]).map((g) => g.name)
);

// ---------- gallery ----------
const activeImage = ref(props.product.assets?.[0]?.preview || '');
</script>

<template>
  <section class="max-width px-4 py-10 grid md:grid-cols-2 gap-10">
    <!-- Gallery -->
    <div>
      <img :src="activeImage" :alt="product.name" class="w-full border-2 border-black" />
      <div class="flex gap-2 mt-3 flex-wrap">
        <img
          v-for="a in product.assets"
          :key="a.id"
          :src="a.preview"
          :alt="product.name"
          class="w-16 h-16 object-cover border cursor-pointer"
          :class="a.preview === activeImage ? 'border-black border-2' : 'border-gray-300'"
          @click="activeImage = a.preview"
        />
      </div>
    </div>

    <!-- Details -->
    <div class="space-y-5">
      <h1 class="secondary-font text-4xl uppercase">{{ product.name }}</h1>

      <div v-if="priceInfo">
        <p class="text-2xl font-bold">
          {{ priceInfo.text }}
          <span v-if="priceInfo.tax" class="text-sm font-normal text-gray-500">
            ({{ priceInfo.tax }})
          </span>
        </p>
      </div>

      <!-- Option groups -->
      <div v-for="g in groups" :key="g.id" class="space-y-2">
        <p class="text-sm font-semibold uppercase">
          {{ g.name }}
          <span v-if="selected[g.code]" class="font-normal text-gray-500">
            : {{ g.options.find((o) => o.code === selected[g.code])?.name }}
          </span>
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="o in g.options"
            :key="o.id"
            type="button"
            :disabled="!isAvailable(g.code, o.code)"
            :aria-pressed="selected[g.code] === o.code"
            class="px-4 py-2 border-2 text-sm uppercase transition-colors"
            :class="[
              selected[g.code] === o.code
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-black hover:bg-gray-100',
              !isAvailable(g.code, o.code)
                ? 'opacity-40 line-through cursor-not-allowed border-gray-300 text-gray-400 hover:bg-white'
                : 'cursor-pointer',
            ]"
            @click="select(g.code, o.code)"
          >
            {{ o.name }}
          </button>
        </div>
      </div>

      <p v-if="groups.length && !allChosen" class="text-sm text-gray-500">
        Select {{ missingGroups.join(' and ') }}
      </p>
      <p
        v-else-if="selectedVariant && selectedVariant.stockLevel === 'LOW_STOCK'"
        class="text-sm text-orange-600"
      >
        Only a few left
      </p>

      <UiButton
        :text="addToCartLabel"
        :disabled="!canAddToCart"
        content-classes="w-full"
        @click="addToCart"
      />

      <div v-html="product.description" class="text-gray-600 pt-2"></div>
    </div>
  </section>
</template>