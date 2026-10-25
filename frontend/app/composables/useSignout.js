import { useAuthStore } from '~/store/auth';

/**
 * Composable for signing out the user.
 */
export function useSignout() {
  const authStore = useAuthStore();

  async function signOut() {
    await authStore.logout();
  }

  return { signOut };
}
