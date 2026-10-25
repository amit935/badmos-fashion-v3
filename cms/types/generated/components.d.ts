import type { Schema, Struct } from '@strapi/strapi';

export interface CarouselHeroAsset extends Struct.ComponentSchema {
  collectionName: 'components_carousel_hero_assets';
  info: {
    description: 'Individual hero image slide with optional title, subtitle, CTA button, link, and mobile image override';
    displayName: 'Hero Asset';
    icon: 'picture';
  };
  attributes: {
    alt: Schema.Attribute.String;
    buttonText: Schema.Attribute.String;
    link: Schema.Attribute.String;
    mobileImage: Schema.Attribute.Media<'images'>;
    preview: Schema.Attribute.Media<'images'>;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface CarouselHeroCarousel extends Struct.ComponentSchema {
  collectionName: 'components_carousel_hero_carousels';
  info: {
    description: 'Hero Carousel component with single list of slides and presentation controls';
    displayName: 'Hero Carousel';
    icon: 'slideshow';
  };
  attributes: {
    autoPlay: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    autoPlayInterval: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<5000>;
    pauseOnHover: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    showArrows: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    showDots: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    slides: Schema.Attribute.Component<'carousel.hero-asset', true>;
    transitionDuration: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<1000>;
  };
}

export interface CarouselHeroCollection extends Struct.ComponentSchema {
  collectionName: 'components_carousel_hero_collections';
  info: {
    description: 'Collection of hero image assets for specific device breakpoint slugs';
    displayName: 'Hero Collection';
    icon: 'folder';
  };
  attributes: {
    assets: Schema.Attribute.Component<'carousel.hero-asset', true>;
    slug: Schema.Attribute.Enumeration<
      ['1920x1080', '1080x1280', '1080x2048']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'1920x1080'>;
  };
}

export interface NavigationFooterColumn extends Struct.ComponentSchema {
  collectionName: 'components_navigation_footer_columns';
  info: {
    description: 'Column of links in footer navigation';
    displayName: 'Footer Column';
    icon: 'list';
  };
  attributes: {
    links: Schema.Attribute.Component<'navigation.link-item', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface NavigationHeaderTopBar extends Struct.ComponentSchema {
  collectionName: 'components_navigation_header_top_bars';
  info: {
    description: 'Header announcement top bar with auto-scrolling announcements';
    displayName: 'Header Top Bar';
    icon: 'megaphone';
  };
  attributes: {
    announcements: Schema.Attribute.Component<'navigation.top-bar-item', true>;
    autoScrollInterval: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<4>;
    enabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

export interface NavigationLinkItem extends Struct.ComponentSchema {
  collectionName: 'components_navigation_link_items';
  info: {
    description: 'Navigation link item with title and URL';
    displayName: 'Link Item';
    icon: 'link';
  };
  attributes: {
    badgeText: Schema.Attribute.String;
    isExternal: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface NavigationNavCategory extends Struct.ComponentSchema {
  collectionName: 'components_navigation_nav_categories';
  info: {
    description: 'Main category containing sub-category sections';
    displayName: 'Nav Category / Main Group';
    icon: 'folder';
  };
  attributes: {
    isExternal: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    sections: Schema.Attribute.Component<'navigation.nav-section', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String;
  };
}

export interface NavigationNavSection extends Struct.ComponentSchema {
  collectionName: 'components_navigation_nav_sections';
  info: {
    description: 'Sub-category section containing links';
    displayName: 'Nav Section / Sub Category';
    icon: 'layer';
  };
  attributes: {
    isExternal: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    items: Schema.Attribute.Component<'navigation.link-item', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String;
  };
}

export interface NavigationNavTab extends Struct.ComponentSchema {
  collectionName: 'components_navigation_nav_tabs';
  info: {
    description: 'Navigation tab in header bar, can be dropdown or direct link';
    displayName: 'Nav Tab / Header Dropdown';
    icon: 'bulletList';
  };
  attributes: {
    categories: Schema.Attribute.Component<'navigation.nav-category', true>;
    isExternal: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    tabName: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<['dropdown', 'direct_link']> &
      Schema.Attribute.DefaultTo<'dropdown'>;
    url: Schema.Attribute.String;
  };
}

export interface NavigationSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_navigation_social_links';
  info: {
    description: 'Social media platform link with icon';
    displayName: 'Social Link';
    icon: 'share-alt';
  };
  attributes: {
    iconImage: Schema.Attribute.Media<'images'>;
    iconName: Schema.Attribute.String;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface NavigationTopBarItem extends Struct.ComponentSchema {
  collectionName: 'components_navigation_top_bar_items';
  info: {
    description: 'Individual announcement entry for header top bar';
    displayName: 'Top Bar Item';
    icon: 'megaphone';
  };
  attributes: {
    announcementText: Schema.Attribute.String & Schema.Attribute.Required;
    linkText: Schema.Attribute.String;
    linkUrl: Schema.Attribute.String;
  };
}

export interface NavigationUserMenu extends Struct.ComponentSchema {
  collectionName: 'components_navigation_user_menus';
  info: {
    description: 'User profile menu dropdown settings and navigation links';
    displayName: 'User Account Menu';
    icon: 'user';
  };
  attributes: {
    guestTitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Welcome to Badmos Fashion'>;
    joinClanButtonLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Join The Clan'>;
    joinClanButtonUrl: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'/login'>;
    showUserDropdown: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    signOutLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Sign Out'>;
    userLinks: Schema.Attribute.Component<'navigation.link-item', true>;
  };
}

export interface SectionsProductListSection extends Struct.ComponentSchema {
  collectionName: 'components_sections_product_list_sections';
  info: {
    description: 'Vendure Product List component storing slug pointers via interactive admin selector';
    displayName: 'Product List Section';
    icon: 'shopping-cart';
  };
  attributes: {
    caption: Schema.Attribute.String;
    categorySlugs: Schema.Attribute.JSON;
    productSlugs: Schema.Attribute.JSON &
      Schema.Attribute.CustomField<'global::vendure-product-selector'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Featured Products'>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'carousel.hero-asset': CarouselHeroAsset;
      'carousel.hero-carousel': CarouselHeroCarousel;
      'carousel.hero-collection': CarouselHeroCollection;
      'navigation.footer-column': NavigationFooterColumn;
      'navigation.header-top-bar': NavigationHeaderTopBar;
      'navigation.link-item': NavigationLinkItem;
      'navigation.nav-category': NavigationNavCategory;
      'navigation.nav-section': NavigationNavSection;
      'navigation.nav-tab': NavigationNavTab;
      'navigation.social-link': NavigationSocialLink;
      'navigation.top-bar-item': NavigationTopBarItem;
      'navigation.user-menu': NavigationUserMenu;
      'sections.product-list-section': SectionsProductListSection;
    }
  }
}
