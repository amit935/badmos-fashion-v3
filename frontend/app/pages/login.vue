<script setup>

definePageMeta({
  layout: 'auth-layout',
});

const { sendOtp, authenticateWithOtp, loading, error, clearError } = useAuth();
const { t: $t } = useTranslation();

const step = ref('email'); // 'email' or 'otp'
const email = ref('');
const otpCode = ref('');
const otpWarning = ref('');

const isOtpValid = computed(() => /^\d{6}$/.test(otpCode.value));

function onOtpInput(value) {
  // Strip non-numeric characters
  const cleaned = value.replace(/\D/g, '').slice(0, 6);
  otpCode.value = cleaned;

  // Validate
  if (cleaned.length === 0) {
    otpWarning.value = '';
  } else if (cleaned.length < 6) {
    otpWarning.value = $t('auth.login.otpWarningLength');
  } else {
    otpWarning.value = '';
  }
}

function onOtpKeypress(event) {
  // Allow control keys (Backspace, Tab, Enter, etc.)
  if (event.ctrlKey || event.metaKey) return;
  // Block non-digit characters
  if (!/^\d$/.test(event.key)) {
    event.preventDefault();
  }
}

function onOtpPaste(event) {
  event.preventDefault();
  const pasted = (event.clipboardData || window.clipboardData).getData('text');
  const cleaned = pasted.replace(/\D/g, '').slice(0, 6);
  otpCode.value = cleaned;
  onOtpInput(cleaned);
}

async function onSendOtp() {
  if (!email.value) return;
  clearError();
  const success = await sendOtp(email.value);
  if (success) {
    step.value = 'otp';
  }
}

async function onCheckIn() {
  if (!isOtpValid.value) {
    otpWarning.value = $t('auth.login.otpWarningLength');
    return;
  }
  clearError();
  const success = await authenticateWithOtp(email.value, otpCode.value);
  if (success) {
    navigateTo('/');
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-5xl sm:text-6xl uppercase secondary-font">{{ $t('auth.login.title') }}</h1>

    <!-- Error message -->
    <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

    <!-- Step 1: Email -->
    <template v-if="step === 'email'">
      <p class="text-lg">{{ $t('auth.login.caption') }}</p>
      <AuthFormInputField
        id="email"
        type="email"
        :label="$t('auth.login.email')"
        placeholder="you@example.com"
        v-model="email"
        :is-required="true"
      />
      <UiButton type="button" :text="$t('auth.login.submit')" category="primary" content-classes="w-full" :loading="loading" :disabled="loading" @click="onSendOtp" />
    </template>

    <!-- Step 2: OTP Verification -->
    <template v-else-if="step === 'otp'">
      <p class="text-lg">{{ $t('auth.login.otpCaption', { email: email }) }}</p>
      <AuthFormInputField
        id="otp"
        type="text"
        :label="$t('auth.login.otpLabel')"
        placeholder="000000"
        :model-value="otpCode"
        @update:model-value="onOtpInput"
        :is-required="true"
        :show-warning="!!otpWarning"
        :warning-message="otpWarning"
        maxlength="6"
        inputmode="numeric"
        pattern="[0-9]*"
        @keypress="onOtpKeypress"
        @paste="onOtpPaste"
      />
      <UiButton type="button" :text="$t('auth.login.otpSubmit')" category="primary" content-classes="w-full" :loading="loading" :disabled="loading || !isOtpValid" @click="onCheckIn" />
    </template>
  </div>
</template>