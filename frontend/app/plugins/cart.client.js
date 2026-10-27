import { useCartStore } from '~/store/cart';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', async () => {
    const cart = useCartStore();
    await cart.init();

    // Best-effort flush of pending quantity edits when the tab is hidden or closed
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') cart.flushAll();
    });
  });
});