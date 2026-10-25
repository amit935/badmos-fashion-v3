<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useStrapiHeader } from '~/composables/useStrapiHeader.js';

const menuOpen = ref(false);
const toggleMenu = () => { menuOpen.value = !menuOpen.value; };

const { headerData, fetchHeader } = useStrapiHeader();
const { getStrapiMedia } = useStrapiMedia();

const activeAnnouncementIndex = ref(0);
let announcementTimer = null;

const announcements = computed(() => {
  const list = headerData.value?.topBar?.announcements || [];
  if (list.length > 0) return list;
  if (headerData.value?.topBar?.announcementText) {
    return [{
      announcementText: headerData.value.topBar.announcementText,
      linkUrl: headerData.value.topBar.linkUrl,
      linkText: headerData.value.topBar.linkText
    }];
  }
  return [];
});

const startAnnouncementTimer = () => {
  stopAnnouncementTimer();
  if (announcements.value.length > 1) {
    const intervalSec = headerData.value?.topBar?.autoScrollInterval || 4;
    announcementTimer = setInterval(() => {
      activeAnnouncementIndex.value = (activeAnnouncementIndex.value + 1) % announcements.value.length;
    }, intervalSec * 1000);
  }
};

const stopAnnouncementTimer = () => {
  if (announcementTimer) {
    clearInterval(announcementTimer);
    announcementTimer = null;
  }
};

watch(announcements, () => {
  activeAnnouncementIndex.value = 0;
  startAnnouncementTimer();
});

onMounted(async () => {
  try {
    await fetchHeader();
    startAnnouncementTimer();
  } catch (err) {
    console.error('Error fetching header in header.vue:', err);
  }
});

onUnmounted(() => {
  stopAnnouncementTimer();
});
</script>

<template>
  <header class="sticky top-0 z-[999] bg-white site-header">
    <!-- Top Announcement Bar Auto-Scrolling Carousel -->
    <div 
      v-if="headerData?.topBar?.enabled && announcements.length > 0"
      class="bg-black text-white text-center text-[11px] sm:text-xs md:text-sm py-1.5 px-2 sm:px-4 relative overflow-hidden min-h-[2.25rem] flex items-center justify-center leading-snug"
    >
      <Transition name="fade-slide" mode="out-in">
        <div 
          :key="activeAnnouncementIndex"
          class="max-width flex flex-wrap sm:flex-nowrap items-center justify-center gap-1 sm:gap-2 w-full text-center px-1"
        >
          <span class="truncate max-w-full sm:max-w-none">{{ announcements[activeAnnouncementIndex].announcementText }}</span>
          <a 
            v-if="announcements[activeAnnouncementIndex].linkUrl && announcements[activeAnnouncementIndex].linkText"
            :href="announcements[activeAnnouncementIndex].linkUrl" 
            class="underline font-semibold hover:text-gray-300 transition-colors shrink-0 whitespace-nowrap"
          >
            {{ announcements[activeAnnouncementIndex].linkText }}
          </a>
        </div>
      </Transition>
    </div>

    <div class="max-width flex justify-between items-center h-28 px-6 h-[7rem]">

    <button 
      @click="toggleMenu" 
      class="md:hidden flex items-center justify-center w-10 h-10 rounded hover:bg-gray-200"
      aria-label="Toggle menu"
    >
      <svg v-if="!menuOpen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>

    <!-- Desktop left section: Logo and LeftNavigationBar -->
    <div class="flex items-center gap-12">
      <NuxtLink :to="headerData?.logoLink || '/'">
        <img 
          v-if="getStrapiMedia(headerData?.logoImage)" 
          :src="getStrapiMedia(headerData.logoImage)" 
          :alt="headerData.logoText || 'Logo'" 
          class="h-12 w-auto object-contain"
        />
        <span 
          v-else-if="headerData?.logoText && headerData.logoText !== 'BADMOS'" 
          class="text-2xl font-bold tracking-wider"
        >
          {{ headerData.logoText }}
        </span>
        <UiAppLogo v-else width="128" />
      </NuxtLink>
      <HeaderDesktopLeftNavigationBar :headerData="headerData" class="hidden md:flex" />
    </div>

    <!-- Right navigation always visible -->
    <HeaderDesktopRightNavigationBar :headerData="headerData" />

    <!-- Mobile menu dropdown (LeftNavigationBar) only shown if menuOpen -->
    <div 
      v-if="menuOpen"
      class="fixed h-[100vh] w-[75%] top-0 left-0 bg-white md:hidden z-20 pt-28 px-8 border-r-2 border-black"
    >
      <HeaderMobileLeftNavigationPanel :headerData="headerData" @toggleMenu="toggleMenu"/>
    </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 9999 !important;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>