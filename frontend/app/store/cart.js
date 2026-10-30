import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { getClient } from '~/api/client';
import { ADD_ITEM_TO_ORDER, ADJUST_ORDER_LINE, REMOVE_ORDER_LINE } from '~/api/mutations';
import { GET_ACTIVE_ORDER } from '~/api/queries';
import { useAuthStore } from '~/store/auth';

const STORAGE_KEY = 'badmos-guest-cart';
const DEBOUNCE_MS = 600;

export const useCartStore = defineStore('cart', () => {
  // ── State ──
  const guestItems = ref([]);   // [{ variantId, quantity, name, image, options, path, unitPrice, currencyCode }]
  const order = ref(null);      // Vendure active order (logged-in users)
  const pending = ref({});      // variantId -> { quantity, snapshot } (local edits not yet confirmed)
  const error = ref(null);
  const mergeIssues = ref([]);  // guest lines Vendure could not add on login
  const isPanelOpen = ref(false);

  const timers = new Map();     // variantId -> debounce timer
  let queue = Promise.resolve(); // serial queue: server calls never overlap

  const isAuthed = () => useAuthStore().isAuthenticated;

  // ── Unified read model ──
  const serverItems = computed(() =>
    (order.value?.lines || []).map((l) => ({
      variantId: l.productVariant.id,
      lineId: l.id,
      quantity: l.quantity,
      name: l.productVariant.product.name,
      variantName: l.productVariant.name,
      image: l.featuredAsset?.preview || '',
      options: (l.productVariant.options || []).map((o) => o.name),
      path: `/${l.productVariant.product.slug}`, // resolve route redirects to the canonical path
      unitPrice: l.unitPriceWithTax,
      currencyCode: order.value.currencyCode,
    }))
  );

  // Server lines overlaid with pending local quantities, plus pending brand-new lines
  const authedItems = computed(() => {
    const out = serverItems.value
      .map((i) => ({ ...i, quantity: pending.value[i.variantId]?.quantity ?? i.quantity }))
      .filter((i) => i.quantity > 0);
    const known = new Set(serverItems.value.map((i) => i.variantId));
    for (const [variantId, p] of Object.entries(pending.value)) {
      if (!known.has(variantId) && p.quantity > 0 && p.snapshot) {
        out.push({ ...p.snapshot, variantId, quantity: p.quantity });
      }
    }
    return out;
  });

  const items = computed(() => (isAuthed() ? authedItems.value : guestItems.value));
  const itemCount = computed(() => items.value.reduce((n, i) => n + i.quantity, 0));
  const subtotal = computed(() => items.value.reduce((n, i) => n + i.unitPrice * i.quantity, 0));
  const currencyCode = computed(() => items.value[0]?.currencyCode || order.value?.currencyCode || 'INR');

  // ── Guest persistence (client only) ──
  function loadGuest() {
    try {
      guestItems.value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      guestItems.value = [];
    }
  }
  if (import.meta.client) {
    watch(guestItems, (v) => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch { /* storage blocked */ }
    }, { deep: true });
  }

  // ── Public actions ──
  // snapshot: { variantId, name, image, options, path, unitPrice, currencyCode }
  function add(snapshot, qty = 1) {
    const current = items.value.find((i) => i.variantId === snapshot.variantId)?.quantity || 0;
    setQuantity(snapshot.variantId, current + qty, snapshot);
  }

  function remove(variantId) {
    setQuantity(variantId, 0);
  }

  function setQuantity(variantId, quantity, snapshot) {
    const qty = Math.max(0, Math.floor(quantity));

    if (!isAuthed()) {
      const idx = guestItems.value.findIndex((i) => i.variantId === variantId);
      if (qty === 0) {
        if (idx >= 0) guestItems.value.splice(idx, 1);
      } else if (idx >= 0) {
        guestItems.value[idx].quantity = qty;
      } else if (snapshot) {
        guestItems.value.push({ ...snapshot, quantity: qty });
      }
      return;
    }

    // Logged in: optimistic local update, then sync
    const existing = pending.value[variantId]?.snapshot
      || items.value.find((i) => i.variantId === variantId);
    pending.value = { ...pending.value, [variantId]: { quantity: qty, snapshot: snapshot || existing } };

    clearTimeout(timers.get(variantId));
    const onServer = serverItems.value.some((i) => i.variantId === variantId);
    if (!onServer) {
      flushLine(variantId); // first add goes out immediately
    } else {
      timers.set(variantId, setTimeout(() => flushLine(variantId), DEBOUNCE_MS));
    }
  }

  // ── Server sync (logged-in) ──
  const enqueue = (fn) => {
    queue = queue.then(fn).catch(() => {});
    return queue;
  };

  function applyResult(res) {
    const next = res?.lines ? res : res?.order; // plain Order, or InsufficientStockError.order
    if (next?.lines) order.value = next;
    if (res?.errorCode) error.value = res.message || res.errorCode;
  }

  function flushLine(variantId) {
    clearTimeout(timers.get(variantId));
    timers.delete(variantId);

    return enqueue(async () => {
      const p = pending.value[variantId];
      if (!p) return;
      const sent = p.quantity;
      const line = order.value?.lines?.find((l) => l.productVariant.id === variantId);

      try {
        let res = null;
        if (!line) {
          if (sent > 0) res = (await getClient().request(ADD_ITEM_TO_ORDER, { variantId, quantity: sent })).addItemToOrder;
        } else if (sent <= 0) {
          res = (await getClient().request(REMOVE_ORDER_LINE, { lineId: line.id })).removeOrderLine;
        } else if (sent !== line.quantity) {
          res = (await getClient().request(ADJUST_ORDER_LINE, { lineId: line.id, quantity: sent })).adjustOrderLine;
        }
        if (res) applyResult(res);
      } catch (e) {
        error.value = e?.response?.errors?.[0]?.message || e.message || 'Could not update cart';
        await fetchActiveOrder();
      }

      // Clear pending only if the user hasn't edited again while the request was in flight
      if (pending.value[variantId]?.quantity === sent) {
        const { [variantId]: _drop, ...rest } = pending.value;
        pending.value = rest;
      }
    });
  }

  // Send everything now (before checkout, logout, or leaving the page)
  async function flushAll() {
    await Promise.all(Object.keys(pending.value).map(flushLine));
    await queue;
  }

  async function fetchActiveOrder() {
    try {
      const data = await getClient().request(GET_ACTIVE_ORDER);
      order.value = data.activeOrder || null;
    } catch {
      'fetchActiveOrder failed:', err?.response?.errors || err
    }
  }

  // ── Guest -> Vendure merge (call right after login succeeds) ──
  async function mergeGuestCart() {
    loadGuest();
    await fetchActiveOrder(); // reuse the existing active order if there is one
    mergeIssues.value = [];

    // Sequential on purpose: concurrent mutations on one order can race
    for (const item of [...guestItems.value]) {
      try {
        const res = (await getClient().request(ADD_ITEM_TO_ORDER, {
          variantId: item.variantId,
          quantity: item.quantity, // addItemToOrder accumulates onto an existing line
        })).addItemToOrder;
        applyResult(res);
        if (res?.errorCode) mergeIssues.value.push({ name: item.name, reason: res.message || res.errorCode });
        error.value = null;
        // Success or a definitive rejection: either way, don't retry this line
        guestItems.value = guestItems.value.filter((i) => i.variantId !== item.variantId);
      } catch {
        break; // network failure: keep the remaining guest lines for the next attempt
      }
    }
  }

  async function reset() {
    await flushAll();
    timers.forEach(clearTimeout);
    timers.clear();
    order.value = null;
    pending.value = {};
    error.value = null;
  }

  async function init() {
    loadGuest();
    if (isAuthed()) await fetchActiveOrder();
  }

  return {
    guestItems, order, pending, error, mergeIssues, isPanelOpen,
    items, itemCount, subtotal, currencyCode,
    add, remove, setQuantity, flushAll, fetchActiveOrder, mergeGuestCart, reset, init,
  };
});