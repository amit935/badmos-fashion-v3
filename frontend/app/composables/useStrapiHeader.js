const POPULATE =
  'populate[leftNavTabs][populate][vendureCollections]=true&populate[leftNavTabs][populate][categories][populate][sections][populate]=items&populate[userMenu][populate]=userLinks&populate[topBar][populate]=announcements&populate[logoImage]=true';

const DEFAULT_HEADER = {
  logoText: 'BADMOS',
  logoLink: '/',
  showCartButton: true,
  topBar: { enabled: false, announcements: [] },
  userMenu: { showUserDropdown: true, userLinks: [] },
  leftNavTabs: [],
};

// Call as: const { data: headerData } = await useStrapiHeader()
export function useStrapiHeader() {
  const config = useRuntimeConfig();
  let cmsUrl = config.public?.cmsUrl || 'http://localhost:1337/api';
  // Node on the server can fail to reach "localhost" (IPv6), so use 127.0.0.1 there only
  if (import.meta.server) cmsUrl = cmsUrl.replace('localhost', '127.0.0.1');

  return useAsyncData('strapi-header', async () => {
    try {
      const json = await $fetch(`${cmsUrl}/header?${POPULATE}`);
      return json?.data || DEFAULT_HEADER;
    } catch (err) {
      console.warn('Unable to fetch header from Strapi, using defaults:', err?.message);
      return DEFAULT_HEADER;
    }
  });
}