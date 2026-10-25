

/**
 * Server API Route for caching Global CMS Settings from Strapi.
 * Nitro will aggressively cache this to prevent repetitive backend hits.
 */
export default defineCachedEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const cmsUrl = config.public.cmsUrl;
  
  try {
    // TODO: Replace with the exact endpoint structure defined in Strapi
    // e.g. const data = await $fetch(`${cmsUrl}/global?populate=deep`);
    
    // Stub response for now:
    return {
      header: { active: true },
      footer: { active: true }
    };
  } catch (error) {
    console.error('Error fetching CMS Global Setup', error);
    throw createError({ statusCode: 500, message: 'Failed to fetch CMS Global Config' });
  }
}, {
  // Cache Options
  maxAge: 60 * 60, // 1 hour cache
  name: 'cms-global-cache', // Nitro cache group key
  getKey: () => 'global' // Static key since it's a global config
});
