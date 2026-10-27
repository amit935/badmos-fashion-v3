import { useAuthStore } from '~/store/auth';

// Sends logged-out visitors to /login and brings them back after login
export default defineNuxtRouteMiddleware(async (to) => {
  // The server can't see the session cookie, so only decide in the browser
  if (import.meta.server) {
    return;
  }

  const authStore = useAuthStore();

  // The store may not have loaded the session yet, so ask Vendure once
  if (!authStore.isAuthenticated) {
    await authStore.fetchActiveCustomer();
  }

  if (authStore.isAuthenticated) {
    return;
  }

  return navigateTo({ path: '/login', query: { redirect: to.fullPath } });
});