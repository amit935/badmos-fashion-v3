import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getClient } from '~/api/client';
import { REQUEST_LOGIN_OTP, AUTHENTICATE_WITH_OTP, LOGOUT } from '~/api/mutations';
import { GET_ACTIVE_CUSTOMER } from '~/api/queries';

export const useAuthStore = defineStore('auth', () => {
  // ── State ──
  const user = ref(null);
  const isAuthenticated = ref(false);
  const loading = ref(false);
  const error = ref(null);

  // ── Actions ──

  /**
   * Send OTP verification code to the user's email
   * @param {string} email
   * @returns {Promise<boolean>} true if OTP was sent successfully
   */
  async function sendOtp(email) {
    loading.value = true;
    error.value = null;

    try {
      const data = await getClient().request(REQUEST_LOGIN_OTP, { email });
      return !!data.requestOtp;
    } catch (err) {
      error.value = err.response?.errors?.[0]?.message || err.message || 'Failed to send OTP';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Authenticate user with email + OTP code
   * @param {string} email
   * @param {string} code
   * @returns {Promise<boolean>} true if authentication was successful
   */
  async function authenticateWithOtp(email, code) {
    loading.value = true;
    error.value = null;

    try {
      const data = await getClient().request(AUTHENTICATE_WITH_OTP, { email, code });
      const result = data.authenticate;

      if (result.errorCode) {
        error.value = result.message || 'Authentication failed';
        return false;
      }

      // Authentication succeeded — fetch full user profile
      await fetchActiveCustomer();
      return true;
    } catch (err) {
      error.value = err.response?.errors?.[0]?.message || err.message || 'Authentication failed';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch the currently logged-in customer from Vendure
   */
  async function fetchActiveCustomer() {
    try {
      const data = await getClient().request(GET_ACTIVE_CUSTOMER);
      if (data.activeCustomer) {
        user.value = data.activeCustomer;
        isAuthenticated.value = true;
      } else {
        user.value = null;
        isAuthenticated.value = false;
      }
    } catch {
      user.value = null;
      isAuthenticated.value = false;
    }
  }

  /**
   * Log the user out
   */
  async function logout() {
    try {
      await getClient().request(LOGOUT);
    } finally {
      user.value = null;
      isAuthenticated.value = false;
    }
  }

  /**
   * Clear any existing error
   */
  function clearError() {
    error.value = null;
  }

  return {
    // State
    user,
    isAuthenticated,
    loading,
    error,
    // Actions
    sendOtp,
    authenticateWithOtp,
    fetchActiveCustomer,
    logout,
    clearError,
  };
});
