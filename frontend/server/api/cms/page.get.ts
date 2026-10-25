/**
 * Server API Route for fetching dynamic Page Content directly from Strapi 5.
 * Returns ONLY live content defined in Strapi for the specified page slug. No stubs/fallbacks.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const rawSlug = query.slug;
  const slug = typeof rawSlug === 'string' ? rawSlug : '/';
  
  const config = useRuntimeConfig();
  const rawCmsUrl = config.public.cmsUrl || 'http://127.0.0.1:1337';
  
  // Normalize base URL to root IPv4 origin (stripping trailing /api and resolving localhost to 127.0.0.1 for Node SSR)
  const baseUrl = rawCmsUrl
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '')
    .replace('localhost', '127.0.0.1');

  // Build target search slugs for exact matching
  const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`;
  const isHomePage = normalizedSlug === '/' || normalizedSlug === '' || normalizedSlug === '/home';
  
  const searchSlugs = isHomePage 
    ? ['/', 'home', 'homepage', 'index'] 
    : [normalizedSlug, normalizedSlug.replace(/^\//, '')];

  try {
    if (baseUrl) {
      // Strapi 5 dynamic zone population queries
      const populateQueries = [
        'populate[blocks][on][carousel.hero-carousel][populate][slides][populate]=*&populate[blocks][on][sections.product-list-section][populate]=*',
        'populate=*'
      ];

      let pagesData = null;

      // Exact slug search directly in Strapi
      for (const popQ of populateQueries) {
        for (const s of searchSlugs) {
          try {
            const requestUrl = `${baseUrl}/api/pages?filters[slug][$eq]=${s}&${popQ}`;
            const res: any = await $fetch(requestUrl);
            if (res?.data && res.data.length > 0) {
              pagesData = res.data[0];
              break;
            }
          } catch (e) {
            // continue search
          }
        }
        if (pagesData) break;
      }

      if (pagesData) {
        const attributes = pagesData.attributes || pagesData;
        const blocks = attributes.blocks || [];

        // Normalize block properties
        const normalizedBlocks = blocks.map((block: any) => {
          if (block.__component === 'carousel.hero-carousel' || block.__component === 'hero-carousel') {
            return {
              ...block,
              slides: block.slides || block.assets || (block.collections?.[0]?.assets) || []
            };
          }
          return block;
        });

        return {
          meta: {
            title: attributes.title || attributes.seoTitle || `Page: ${slug}`,
            slug: attributes.slug || slug
          },
          blocks: normalizedBlocks
        };
      }
    }

    // Return empty payload if no Strapi entry exists for this page
    return {
      meta: { title: isHomePage ? 'Badmos Fashion' : '404 - Page Not Found', slug },
      blocks: [],
      error: isHomePage ? null : 'Page not found'
    };
  } catch (error) {
    console.error(`Error fetching CMS Page Setup for slug: ${slug}`, error);
    return {
      meta: { title: 'Badmos Fashion', slug },
      blocks: [],
      error: 'Failed to fetch CMS page'
    };
  }
});
