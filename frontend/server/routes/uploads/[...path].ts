/**
 * Server Proxy Route for Strapi Media Uploads.
 * Directs any request on Nuxt (/uploads/*) to the live Strapi backend instance (/uploads/*).
 * This ensures uploaded media files are immediately accessible on the frontend.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const rawCmsUrl = config.public.cmsUrl || 'http://127.0.0.1:1337';
  
  // Normalize base URL to root origin (stripping trailing /api and resolving localhost to 127.0.0.1 for Node SSR)
  const baseUrl = rawCmsUrl
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '')
    .replace('localhost', '127.0.0.1');

  const path = event.context.params?.path || '';
  const targetUrl = `${baseUrl}/uploads/${path}`;

  try {
    return await proxyRequest(event, targetUrl);
  } catch (error) {
    console.error(`Failed to proxy Strapi upload request for /uploads/${path}:`, error);
    throw createError({
      statusCode: 404,
      statusMessage: 'Media asset not found on Strapi server'
    });
  }
});
