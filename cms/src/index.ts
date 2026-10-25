import type { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: any }) {
    strapi.customFields.register({
      name: 'vendure-product-selector',
      type: 'json',
    });
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      const publicRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'public' } });

      if (publicRole) {
        // Grant permissions for Header
        const headerPermission = await strapi
          .query('plugin::users-permissions.permission')
          .findOne({
            where: {
              role: publicRole.id,
              action: 'api::header.header.find',
            },
          });

        if (!headerPermission) {
          await strapi
            .query('plugin::users-permissions.permission')
            .create({
              data: {
                action: 'api::header.header.find',
                role: publicRole.id,
              },
            });
          strapi.log.info('Auto-granted public find permission for Header single type');
        }

        // Grant permissions for Footer
        const footerPermission = await strapi
          .query('plugin::users-permissions.permission')
          .findOne({
            where: {
              role: publicRole.id,
              action: 'api::footer.footer.find',
            },
          });

        if (!footerPermission) {
          await strapi
            .query('plugin::users-permissions.permission')
            .create({
              data: {
                action: 'api::footer.footer.find',
                role: publicRole.id,
              },
            });
          strapi.log.info('Auto-granted public find permission for Footer single type');
        }
      }

      // Reset cached Content Manager edit view layout for Footer so new schema fields (copyrightText) appear immediately
      try {
        const cmStore = strapi.store({
          type: 'plugin',
          name: 'content_manager',
          key: 'configuration_single_types::api::footer.footer',
        });
        await cmStore.delete();
        strapi.log.info('Reset Content Manager layout cache for Footer single type');
      } catch (err) {
        // Ignore if store key does not exist yet
      }

      // 2. Pre-populate default Header content if empty
      const existingHeader = await strapi.documents('api::header.header').findFirst({
        populate: ['leftNavTabs', 'topBar', 'userMenu'],
      });

      const defaultHeaderData = {
        logoText: 'BADMOS',
        logoLink: '/',
        showCartButton: true,
        topBar: {
          enabled: true,
          autoScrollInterval: 4,
          announcements: [
            {
              announcementText: 'Welcome to Badmos Fashion! Free shipping on orders over $100.',
              linkUrl: '/shop',
              linkText: 'Shop Now',
            },
            {
              announcementText: 'New Summer Collection Out Now! Explore the latest styles.',
              linkUrl: '/collections/new-arrivals',
              linkText: 'Explore',
            },
            {
              announcementText: 'Get exclusive perks and discounts when you Join The Clan.',
              linkUrl: '/login',
              linkText: 'Join Now',
            },
          ],
        },
        userMenu: {
          showUserDropdown: true,
          guestTitle: 'Welcome to Badmos Fashion',
          joinClanButtonLabel: 'Join The Clan',
          joinClanButtonUrl: '/login',
          signOutLabel: 'Sign Out',
          userLinks: [
            { title: 'My Account', url: '/account', isExternal: false },
            { title: 'My Orders', url: '/orders', isExternal: false },
            { title: 'Wishlist', url: '/wishlist', isExternal: false },
          ],
        },
        leftNavTabs: [
          {
            tabName: 'Shop By Categories',
            type: 'dropdown',
            url: '/categories',
            categories: [
              {
                title: 'Men',
                url: '/men',
                sections: [
                  {
                    title: 'Top Wear',
                    url: '/men/top-wear',
                    items: [
                      { title: 'T-Shirts', url: '/men/top-wear/t-shirts' },
                      { title: 'Casual Shirts', url: '/men/top-wear/shirts' },
                    ],
                  },
                ],
              },
              {
                title: 'Women',
                url: '/women',
                sections: [
                  {
                    title: 'Ethnic Wear',
                    url: '/women/ethnic-wear',
                    items: [
                      { title: 'Dresses', url: '/women/dresses' },
                      { title: 'Sarees', url: '/women/sarees' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            tabName: 'Shop By Collections',
            type: 'dropdown',
            url: '/collections',
            categories: [
              {
                title: 'New Arrivals',
                url: '/collections/new-arrivals',
                sections: [],
              },
              {
                title: 'Best Sellers',
                url: '/collections/best-sellers',
                sections: [],
              },
            ],
          },
        ],
      };

      if (existingHeader) {
        await strapi.documents('api::header.header').update({
          documentId: existingHeader.documentId,
          data: defaultHeaderData as any,
          status: 'published',
        });
      } else {
        await strapi.documents('api::header.header').create({
          data: defaultHeaderData as any,
          status: 'published',
        });
      }

      // 3. Pre-populate default Footer content if empty
      const existingFooter = await strapi.documents('api::footer.footer').findFirst({
        populate: ['columns', 'socialLinks'],
      });

      const defaultFooterData = {
        taglineText: 'Embrace your space journey NOW!!!',
        socialLinks: [
          { name: 'Instagram', url: 'https://instagram.com', iconName: 'ri:instagram-line' },
          { name: 'Twitter', url: 'https://twitter.com', iconName: 'ri:twitter-x-line' },
          { name: 'Facebook', url: 'https://facebook.com', iconName: 'ri:facebook-fill' },
        ],
        columns: [
          {
            title: 'SHOP',
            links: [
              { title: 'Men', url: '/men', isExternal: false },
              { title: 'Women', url: '/women', isExternal: false },
              { title: 'New Arrivals', url: '/collections/new-arrivals', isExternal: false },
              { title: 'Best Sellers', url: '/collections/best-sellers', isExternal: false },
            ],
          },
          {
            title: 'CUSTOMER CARE',
            links: [
              { title: 'Contact Us', url: '/contact', isExternal: false },
              { title: 'Shipping Policy', url: '/shipping-policy', isExternal: false },
              { title: 'Returns & Exchanges', url: '/returns', isExternal: false },
              { title: 'FAQs', url: '/faq', isExternal: false },
            ],
          },
          {
            title: 'COMPANY',
            links: [
              { title: 'About Us', url: '/about', isExternal: false },
              { title: 'Careers', url: '/careers', isExternal: false },
              { title: 'Terms of Service', url: '/terms', isExternal: false },
              { title: 'Privacy Policy', url: '/privacy', isExternal: false },
            ],
          },
        ],
        aboutTitle: 'ABOUT BADMOS FASHION',
        aboutDescription: 'Badmos Fashion is a luxury streetwear brand bringing high-end aesthetics, premium craftsmanship, and futuristic designs to your everyday wardrobe.',
        copyrightText: '© {year} BADMOS FASHION. ALL RIGHTS RESERVED.',
      };

      if (existingFooter) {
        await strapi.documents('api::footer.footer').update({
          documentId: existingFooter.documentId,
          data: defaultFooterData as any,
          status: 'published',
        });
      } else {
        await strapi.documents('api::footer.footer').create({
          data: defaultFooterData as any,
          status: 'published',
        });
      }
      strapi.log.info('Pre-populated default Footer single type content');

    } catch (err) {
      strapi.log.error('Error during Strapi bootstrap:', err);
    }
  },
};
