import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { getClient } from '~/api/client';
import {
  SET_ORDER_SHIPPING_ADDRESS,
  SET_ORDER_BILLING_ADDRESS,
  SET_ORDER_SHIPPING_METHOD,
  APPLY_COUPON_CODE,
  REMOVE_COUPON_CODE,
  TRANSITION_ORDER_TO_STATE,
  CREATE_CUSTOMER_ADDRESS,
} from '~/api/mutations';
import { GET_CHECKOUT_CUSTOMER, GET_ELIGIBLE_SHIPPING_METHODS } from '~/api/queries';
import { useCartStore } from '~/store/cart';

function createEmptyAddress() {
  return {
    fullName: '',
    phoneNumber: '',
    streetLine1: '',
    streetLine2: '',
    city: '',
    province: '',
    postalCode: '',
    countryCode: 'IN',
  };
}

// Turns a saved Vendure address into the shape the form uses
function addressFromSaved(saved) {
  return {
    fullName: saved.fullName || '',
    phoneNumber: saved.phoneNumber || '',
    streetLine1: saved.streetLine1 || '',
    streetLine2: saved.streetLine2 || '',
    city: saved.city || '',
    province: saved.province || '',
    postalCode: saved.postalCode || '',
    countryCode: saved.country?.code || 'IN',
  };
}

// Turns an address stored on the order into the shape the form uses
function addressFromOrder(orderAddress) {
  return {
    fullName: orderAddress.fullName || '',
    phoneNumber: orderAddress.phoneNumber || '',
    streetLine1: orderAddress.streetLine1 || '',
    streetLine2: orderAddress.streetLine2 || '',
    city: orderAddress.city || '',
    province: orderAddress.province || '',
    postalCode: orderAddress.postalCode || '',
    countryCode: orderAddress.countryCode || 'IN',
  };
}

// Only the fields Vendure accepts, with whitespace trimmed
function toAddressInput(address) {
  return {
    fullName: address.fullName.trim(),
    phoneNumber: address.phoneNumber.trim(),
    streetLine1: address.streetLine1.trim(),
    streetLine2: address.streetLine2.trim(),
    city: address.city.trim(),
    province: address.province.trim(),
    postalCode: address.postalCode.trim(),
    countryCode: address.countryCode,
  };
}

// A comparable string, so two addresses with the same content match
function addressKey(address) {
  return [
    address.fullName,
    address.phoneNumber,
    address.streetLine1,
    address.streetLine2,
    address.city,
    address.province,
    address.postalCode,
    address.countryCode,
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .join('|');
}

// Returns an error message, or an empty string when the address is fine
function validateAddress(address) {
  if (!address.fullName.trim()) return 'Please enter the full name.';
  if (!/^\d{10}$/.test(address.phoneNumber.trim())) return 'Phone number must be 10 digits.';
  if (!address.streetLine1.trim()) return 'Please enter the street address.';
  if (!address.city.trim()) return 'Please enter the city.';
  if (!address.province.trim()) return 'Please enter the state.';
  if (!/^\d{6}$/.test(address.postalCode.trim())) return 'Pincode must be 6 digits.';
  return '';
}

function readError(err) {
  return err?.response?.errors?.[0]?.message || err.message || 'Something went wrong';
}

export const useCheckoutStore = defineStore('checkout', () => {
  const cart = useCartStore();

  // ── State ──
  const shippingAddress = ref(createEmptyAddress());
  const billingAddress = ref(createEmptyAddress());
  const billingSameAsShipping = ref(true);

  // Addresses saved on the customer account: [{ id, ...address fields }]
  const savedAddresses = ref([]);

  // Consent: only save an address when the customer ticks the box
  const saveShipping = ref(false);
  const saveBilling = ref(false);

  const couponInput = ref('');
  const couponError = ref('');
  const loading = ref(false);
  const error = ref('');

  const shippingMethods = ref([]);
  const selectedShippingMethodId = ref(null);
  const shippingChecked = ref(false); // true once Vendure has told us which methods are eligible

  const calculating = ref(false);      // true while shipping/discounts are being recalculated
  const lastSyncedKey = ref('');       // address already saved on the order
  let syncEnabled = false;             // off until load() has finished prefilling
  let syncTimer = null;
  let syncQueue = Promise.resolve();   // serial: address syncs never overlap

  // ── Helpers ──
  function resetForm() {
    shippingAddress.value = createEmptyAddress();
    billingAddress.value = createEmptyAddress();
    billingSameAsShipping.value = true;
    savedAddresses.value = [];
    saveShipping.value = false;
    saveBilling.value = false;
    couponInput.value = '';
    couponError.value = '';
    shippingMethods.value = [];
    selectedShippingMethodId.value = null;
    shippingChecked.value = false;
    lastSyncedKey.value = '';
  }

  // Runs an order mutation and stores the updated order in the cart store.
  // Returns true on success, false if Vendure answered with an error.
  async function runOrderMutation(mutation, variables, resultKey) {
    const data = await getClient().request(mutation, variables);
    const result = data[resultKey];

    if (result?.errorCode) {
      error.value = result.message;
      return false;
    }

    cart.order = result;
    return true;
  }

  // ── Saved address cards ──
  // The id of the saved address that matches this form, or null when it is a new address
  function matchingSavedId(address) {
    const key = addressKey(address);
    return savedAddresses.value.find((saved) => addressKey(saved) === key)?.id || null;
  }

  // Fills the shipping or billing form from a saved card
  function selectSavedAddress(target, saved) {
    const { id, ...fields } = saved;
    if (target === 'shipping') {
      shippingAddress.value = { ...fields };
      saveShipping.value = false;
    } else {
      billingAddress.value = { ...fields };
      saveBilling.value = false;
    }
  }

  // Clears the shipping or billing form for a brand new address
  function startNewAddress(target) {
    if (target === 'shipping') {
      shippingAddress.value = createEmptyAddress();
    } else {
      billingAddress.value = createEmptyAddress();
    }
  }

  // ── Loading the page ──
  async function prefillForm() {
    const data = await getClient().request(GET_CHECKOUT_CUSTOMER);
    const customer = data.activeCustomer;
    if (!customer) return;

    savedAddresses.value = customer.addresses.map((saved) => ({
      id: saved.id,
      ...addressFromSaved(saved),
    }));

    // Returning from payment: the order already has the addresses
    const orderShipping = cart.order?.shippingAddress;
    const orderBilling = cart.order?.billingAddress;

    if (orderShipping?.streetLine1) {
      shippingAddress.value = addressFromOrder(orderShipping);
    } else {
      // First visit: start from the customer's name and phone only
      shippingAddress.value.fullName = `${customer.firstName} ${customer.lastName}`.trim();
      shippingAddress.value.phoneNumber = customer.phoneNumber || '';
    }

    if (orderBilling?.streetLine1) {
      const billing = addressFromOrder(orderBilling);
      if (addressKey(billing) !== addressKey(shippingAddress.value)) {
        billingAddress.value = billing;
        billingSameAsShipping.value = false;
      }
    }
  }

  async function load() {
    loading.value = true;
    error.value = '';
    syncEnabled = false;
    resetForm();

    try {
      await cart.flushAll();
      await cart.fetchActiveOrder();

      if (cart.order?.state === 'ArrangingPayment') {
        await runOrderMutation(TRANSITION_ORDER_TO_STATE, { state: 'AddingItems' }, 'transitionOrderToState');
      }

      selectedShippingMethodId.value = cart.order?.shippingLines?.[0]?.shippingMethod?.id || null;

      await prefillForm();

      // Returning from payment: the order already has this address, so just load the methods
      if (cart.order?.shippingAddress?.streetLine1 && !validateAddress(shippingAddress.value)) {
        lastSyncedKey.value = addressKey(shippingAddress.value);
        await resolveShipping({ strict: false });
      }
    } catch (err) {
      error.value = readError(err);
    } finally {
      loading.value = false;
      syncEnabled = true;
    }
  }

  // ── Shipping ──
  function setShippingMethod(id) {
    return runOrderMutation(
      SET_ORDER_SHIPPING_METHOD,
      { shippingMethodId: [id] },
      'setOrderShippingMethod'
    );
  }

  // Called when the customer picks one from the list
  async function chooseShippingMethod(id) {
    error.value = '';
    selectedShippingMethodId.value = id;

    try {
      await setShippingMethod(id);
    } catch (err) {
      error.value = readError(err);
    }
  }

  // Returns true when shipping is settled and checkout can continue
  async function resolveShipping({ strict = true } = {}) {
    const data = await getClient().request(GET_ELIGIBLE_SHIPPING_METHODS);
    shippingMethods.value = data.eligibleShippingMethods;
    shippingChecked.value = true;

    const methods = shippingMethods.value;

    if (methods.length === 0) {
      selectedShippingMethodId.value = null;
      return true;
    }

    if (methods.length === 1) {
      selectedShippingMethodId.value = methods[0].id;
      return setShippingMethod(methods[0].id);
    }

    const choiceIsValid = methods.some((m) => m.id === selectedShippingMethodId.value);
    if (!choiceIsValid) {
      selectedShippingMethodId.value = null;
      if (strict) error.value = 'Please choose a shipping method.';
      return false;
    }

    // Re-apply the chosen method: its price can change with the address
    return setShippingMethod(selectedShippingMethodId.value);
  }

  function syncShippingAddress() {
      clearTimeout(syncTimer);

      syncQueue = syncQueue.then(async () => {
        const address = shippingAddress.value;
        if (validateAddress(address)) return;

        const key = addressKey(address);
        if (key === lastSyncedKey.value) return;

        calculating.value = true;
        error.value = '';

        try {
          const saved = await runOrderMutation(
            SET_ORDER_SHIPPING_ADDRESS,
            { input: toAddressInput(address) },
            'setOrderShippingAddress'
          );
          if (!saved) return;

          lastSyncedKey.value = key;
          await resolveShipping({ strict: false });
        } catch (err) {
          error.value = readError(err);
        } finally {
          calculating.value = false;
        }
      });

      return syncQueue;
    }

    // Recalculate shortly after the customer stops typing
    watch(
      shippingAddress,
      () => {
        if (!syncEnabled) return;
        clearTimeout(syncTimer);
        syncTimer = setTimeout(syncShippingAddress, 600);
      },
      { deep: true }
    );
  // ── Saving addresses (only with consent) ──
  // Saving is a convenience: if it fails, checkout still continues
  async function saveAddresses() {
    try {
      const toSave = [];
      if (saveShipping.value) toSave.push(shippingAddress.value);
      if (!billingSameAsShipping.value && saveBilling.value) toSave.push(billingAddress.value);

      const knownKeys = new Set(savedAddresses.value.map(addressKey));

      for (const address of toSave) {
        const key = addressKey(address);
        if (knownKeys.has(key)) continue; // already saved, don't duplicate

        const input = toAddressInput(address);
        const data = await getClient().request(CREATE_CUSTOMER_ADDRESS, { input });

        savedAddresses.value.push({ id: data.createCustomerAddress.id, ...input });
        knownKeys.add(key);
      }

      saveShipping.value = false;
      saveBilling.value = false;
    } catch (err) {
      console.warn('Could not save the address', err);
    }
  }

  // ── Submitting step 1 ──
  // Returns true when the order is ready for the payment page
  async function submitCustomerInfo() {
    error.value = '';

    const shippingProblem = validateAddress(shippingAddress.value);
    if (shippingProblem) {
      error.value = shippingProblem;
      return false;
    }

    if (!billingSameAsShipping.value) {
      const billingProblem = validateAddress(billingAddress.value);
      if (billingProblem) {
        error.value = `Billing address: ${billingProblem}`;
        return false;
      }
    }

    loading.value = true;

   loading.value = true;

    try {
      // Make sure the shipping address (and the shipping/discounts that depend on it) is current
      await syncShippingAddress();
      if (lastSyncedKey.value !== addressKey(shippingAddress.value)) return false;

      const billing = billingSameAsShipping.value ? shippingAddress.value : billingAddress.value;

      const billingAddressSet = await runOrderMutation(
        SET_ORDER_BILLING_ADDRESS,
        { input: toAddressInput(billing) },
        'setOrderBillingAddress'
      );
      if (!billingAddressSet) return false;

      const shippingMethodSet = await resolveShipping({ strict: true });
      if (!shippingMethodSet) return false;

      await saveAddresses();
      return true;
    } catch (err) {
      error.value = readError(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ── Coupons ──
  async function applyCoupon() {
    const code = couponInput.value.trim();
    if (!code) return;

    couponError.value = '';

    try {
      const data = await getClient().request(APPLY_COUPON_CODE, { couponCode: code });
      const result = data.applyCouponCode;

      if (result.errorCode) {
        couponError.value = result.message;
        return;
      }

      cart.order = result;
      couponInput.value = '';
    } catch (err) {
      couponError.value = readError(err);
    }
  }

  async function removeCoupon(code) {
    couponError.value = '';

    try {
      const data = await getClient().request(REMOVE_COUPON_CODE, { couponCode: code });
      if (data.removeCouponCode) {
        cart.order = data.removeCouponCode;
      }
    } catch (err) {
      couponError.value = readError(err);
    }
  }

  return {
    shippingAddress,
    billingAddress,
    billingSameAsShipping,
    savedAddresses,
    saveShipping,
    saveBilling,
    couponInput,
    couponError,
    loading,
    error,
    shippingMethods,
    selectedShippingMethodId,
    shippingChecked,
    load,
    matchingSavedId,
    selectSavedAddress,
    startNewAddress,
    submitCustomerInfo,
    chooseShippingMethod,
    applyCoupon,
    removeCoupon,
  };
});