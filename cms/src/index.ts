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

      // 3. Pre-populate default Footer content if empty

    } catch (err) {
      strapi.log.error('Error during Strapi bootstrap:', err);
    }
  },
};
