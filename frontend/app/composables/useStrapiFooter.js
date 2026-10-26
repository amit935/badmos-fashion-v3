const POPULATE =
  'populate[columns][populate]=links&populate[socialLinks][populate]=iconImage';

// Call as: const { data: footerData } = await useStrapiFooter()
export function useStrapiFooter() {
  const config = useRuntimeConfig();
  let cmsUrl = config.public?.cmsUrl || 'http://localhost:1337/api';
  if (import.meta.server) cmsUrl = cmsUrl.replace('localhost', '127.0.0.1');

  return useAsyncData('strapi-footer', async () => {
    try {
      const json = await $fetch(`${cmsUrl}/footer?${POPULATE}`);
      return json?.data || null;
    } catch (err) {
      console.warn('Unable to fetch footer from Strapi:', err?.message);
      return null;
    }
  });
}