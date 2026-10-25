import { useAuthStore } from '~/store/auth';

/**
 * Composable providing auth actions and reactive state.
 *
 * Usage:
 *   const { sendOtp, authenticateWithOtp, user, isAuthenticated, loading, error } = useAuth();
 */
export function useAuth() {
  const authStore = useAuthStore();

  return {
    // ── Reactive State ──
    /** @type {import('vue').Ref<object|null>} Currently logged-in user */
    user: computed(() => authStore.user),
    /** @type {import('vue').Ref<boolean>} Whether the user is authenticated */
    isAuthenticated: computed(() => authStore.isAuthenticated),
    /** @type {import('vue').Ref<boolean>} Whether an auth request is in progress */
    loading: computed(() => authStore.loading),
    /** @type {import('vue').Ref<string|null>} Last error message, if any */
    error: computed(() => authStore.error),

    // ── Actions ──
    /**
     * Send OTP verification code to the given email.
     * @param {string} email
     * @returns {Promise<boolean>} true if sent successfully
     */
    sendOtp: authStore.sendOtp,

    /**
     * Authenticate user with email + OTP code.
     * @param {string} email
     * @param {string} code
     * @returns {Promise<boolean>} true if authenticated successfully
     */
    authenticateWithOtp: authStore.authenticateWithOtp,

    /** Fetch the currently logged-in customer */
    fetchActiveCustomer: authStore.fetchActiveCustomer,

    /** Log out the current user */
    logout: authStore.logout,

    /** Clear any existing error message */
    clearError: authStore.clearError,
  };
}
