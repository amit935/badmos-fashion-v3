import { useRuntimeConfig } from '#imports';

/**
 * Composable to parse and normalize Strapi Media URLs.
 * Handles both local Strapi upload paths (/uploads/...) and external absolute URLs (R2, S3, CDN).
 */
export function useStrapiMedia() {
  const runtimeConfig = useRuntimeConfig();

  /**
   * Resolves a media object or string into a fully qualified image/media URL.
   * 
   * @param {Object|String} media 
   * @returns {String} Resolved media URL
   */
  const getStrapiMedia = (media) => {
    if (!media) return '';

    let rawUrl = '';
    if (typeof media === 'string') {
      rawUrl = media;
    } else if (typeof media?.preview === 'string') {
      rawUrl = media.preview;
    } else if (media?.data?.attributes?.url) {
      rawUrl = media.data.attributes.url;
    } else if (media?.data?.url) {
      rawUrl = media.data.url;
    } else if (media?.url) {
      rawUrl = media.url;
    }

    if (!rawUrl) return '';

    // If it's already an absolute URL (e.g. R2, S3, external http/https)
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('//')) {
      return rawUrl;
    }

    // Get base CMS URL from runtimeConfig (stripping trailing /api and slashes)
    const rawCmsUrl = runtimeConfig.public?.cmsUrl || 'http://localhost:1337';
    const cmsBaseUrl = rawCmsUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

    // Format clean URL path
    const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    return `${cmsBaseUrl}${cleanPath}`;
  };

  return {
    getStrapiMedia
  };
}
