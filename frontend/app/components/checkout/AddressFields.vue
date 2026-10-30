<script setup>
defineProps({
  address: { type: Object, required: true },
  idPrefix: { type: String, required: true },
});
</script>

<template>
  <div class="space-y-4">
    <AuthFormInputField
      :id="`${idPrefix}-fullName`"
      label="Full name"
      placeholder="Full name"
      type="text"
      v-model="address.fullName"
    />
    <AuthFormInputField
      :id="`${idPrefix}-phone`"
      label="Phone number"
      placeholder="10 digit mobile number"
      type="tel"
      inputmode="tel"
      maxlength="10"
      v-model="address.phoneNumber"
    />
    <AuthFormInputField
      :id="`${idPrefix}-street1`"
      label="Address line 1"
      placeholder="House no, building, street"
      type="text"
      v-model="address.streetLine1"
    />
    <AuthFormInputField
      :id="`${idPrefix}-street2`"
      label="Address line 2 (optional)"
      placeholder="Area, landmark"
      type="text"
      v-model="address.streetLine2"
    />
    <AuthFormInputField
      :id="`${idPrefix}-city`"
      label="City"
      placeholder="City"
      type="text"
      v-model="address.city"
    />
    <AuthFormInputField
      :id="`${idPrefix}-state`"
      label="State"
      placeholder="State"
      type="text"
      v-model="address.province"
    />
    <AuthFormInputField
      :id="`${idPrefix}-pincode`"
      label="Pincode"
      placeholder="6 digit pincode"
      type="text"
      inputmode="numeric"
      maxlength="6"
      v-model="address.postalCode"
    />
    <p class="text-sm text-gray-500">Country: India</p>
  </div>
</template>