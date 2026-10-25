import { useAuthStore } from '~/store/auth';

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  try {
    await authStore.fetchActiveCustomer();
  } catch (err) {
    console.error('Error initializing active user session:', err);
  }
});
