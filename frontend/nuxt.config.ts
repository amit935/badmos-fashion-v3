// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/styles/main.css'],
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', 'nuxt-gtag', '@nuxt/icon'],
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3000/shop-api',
      cmsUrl: process.env.NUXT_PUBLIC_CMS_URL || 'http://localhost:1337/api',
    }
  },
  routeRules: {
    '/uploads/**': {
      proxy: `${process.env.NUXT_PUBLIC_STRAPI_BASE_URL || 'http://127.0.0.1:1337'}/uploads/**`
    }
  },
  gtag: {
    id: process.env.NUXT_GTAG_ID || 'G-XXXXXXXXXX' // Replace with your actual Measurement ID
  }
})