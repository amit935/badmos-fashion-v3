<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStrapiFooter } from '~/composables/useStrapiFooter.js'

const route = useRoute()
const currentYear = new Date().getFullYear()

const { data: footerData } = await useStrapiFooter()
const { getStrapiMedia } = useStrapiMedia()

const shouldHideFooter = computed(() => {
  const hideRoutes = ['/login', '/register']
  return hideRoutes.includes(route.path)
})

const copyrightDisplay = computed(() => {
  const year = currentYear
  const rawText = footerData.value?.copyrightText || '© {year} BADMOS FASHION. ALL RIGHTS RESERVED.'

  if (rawText.includes('{year}')) {
    return rawText.replace(/\{year\}/g, String(year))
  }
  if (rawText.includes(String(year))) {
    return rawText
  }
  if (rawText.startsWith('©')) {
    return rawText.replace('©', `© ${year}`)
  }
  return `© ${year} ${rawText}`
})
</script>

<template>
  <footer v-if="!shouldHideFooter" class="footer bg-white text-black">
    <!-- Tagline Section -->
    <div v-if="footerData?.taglineText || footerData?.socialLinks?.length" class="max-width text-center py-10 space-y-6 border-t border-gray-200 px-4">
      <p v-if="footerData?.taglineText" class="secondary-font text-3xl sm:text-4xl font-bold" v-html="footerData.taglineText"></p>
      <div v-if="footerData?.socialLinks?.length" class="flex justify-center space-x-8 items-center">
        <div 
          v-for="(socialLink, index) in footerData.socialLinks"
          :key="socialLink.id || index"
        >
            <a 
              :href="socialLink.url || '#'" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="social-icon hover:opacity-75 transition-opacity inline-flex items-center justify-center" 
              :aria-label="socialLink.name"
            >
              <img 
                v-if="getStrapiMedia(socialLink.iconImage)" 
                :src="getStrapiMedia(socialLink.iconImage)" 
                :alt="socialLink.name" 
                class="w-6 h-6 object-contain"
              />
              <Icon 
                v-else-if="socialLink.iconName" 
                :name="socialLink.iconName" 
                size="24" 
              />
              <span v-else class="text-sm font-semibold">{{ socialLink.name }}</span>
            </a>
        </div>
      </div>
    </div>

    <!-- Links Section -->
    <div v-if="footerData?.columns?.length" class="max-width flex flex-wrap gap-6 px-5 py-10 mx-auto border-t border-gray-200 justify-around">
      <div 
        v-for="(column, index) in footerData.columns" 
        :key="column.id || index" 
        class="footer-column flex-1 text-center min-w-[180px]"
      >
        <h3 class="font-bold uppercase mb-3 text-base">{{ column.title }}</h3>
        <ul class="links-list space-y-2">
          <li v-for="item in column.links || []" :key="item.id || item.title">
            <a 
              v-if="item.isExternal || (item.url && item.url.startsWith('http'))" 
              :href="item.url" 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-gray-600 hover:text-black transition-colors text-sm"
            >
              {{ item.title }}
            </a>
            <NuxtLink 
              v-else 
              :to="item.url || '#'"
              class="text-gray-600 hover:text-black transition-colors text-sm"
            >
              {{ item.title }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- About Section -->
    <div v-if="footerData?.aboutDescription" class="max-width about-section mx-auto px-5 border-t border-b border-gray-200 py-10 text-center">
      <h3 v-if="footerData?.aboutTitle" class="text-lg font-bold mb-4 uppercase">{{ footerData.aboutTitle }}</h3>
      <p class="rich-text text-gray-600 max-w-3xl mx-auto leading-relaxed text-sm sm:text-base" v-html="footerData.aboutDescription">
      </p>
    </div>

    <!-- Copyright Section -->
    <div class="max-width text-center py-5">
      <p class="rich-text text-gray-500 text-sm" v-html="copyrightDisplay"></p>
    </div>
  </footer>
</template>
