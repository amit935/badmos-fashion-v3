<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  slides: {
    type: Array,
    default: () => []
  },
  assets: {
    type: Array,
    default: () => []
  },
  collections: {
    type: Array,
    default: () => []
  },
  autoPlay: {
    type: Boolean,
    default: true
  },
  autoPlayInterval: {
    type: Number,
    default: 5000,
    validator: (value) => value >= 1000
  },
  transitionDuration: {
    type: Number,
    default: 800,
    validator: (value) => value >= 100
  },
  showDots: {
    type: Boolean,
    default: true
  },
  showArrows: {
    type: Boolean,
    default: true
  },
  pauseOnHover: {
    type: Boolean,
    default: true
  }
})

const { getStrapiMedia } = useStrapiMedia()

// State
const currentIndex = ref(0)
const incomingIndex = ref(null)
const transitionDirection = ref('next') // 'next' or 'prev'
const interval = ref(null)
const isTransitioning = ref(false)
const isLoading = ref(true)
const loadedImages = ref(new Set())
const errorImages = ref(new Set())
const carouselContainer = ref(null)
const isMobile = ref(false)

// Touch / Swipe handling
const startX = ref(null)
const startY = ref(null)
const threshold = 50
const restraint = 100

// Unified single array of slides
const currentSlides = computed(() => {
  if (props.slides && props.slides.length > 0) {
    return props.slides
  }
  if (props.assets && props.assets.length > 0) {
    return props.assets
  }
  if (props.collections && props.collections.length > 0) {
    const matched = props.collections.find(c => c.assets && c.assets.length > 0)
    if (matched) return matched.assets
  }
  return []
})

const totalSlides = computed(() => currentSlides.value.length)

// Extract full clean image URL for a slide (supporting mobile override)
const getImageUrl = (slide) => {
  if (!slide) return ''
  const mediaObj = (isMobile.value && slide.mobileImage) ? slide.mobileImage : (slide.preview || slide.image || slide)
  return getStrapiMedia(mediaObj)
}

const updateDeviceState = () => {
  if (typeof window === 'undefined') return
  isMobile.value = window.innerWidth <= 640
}

// Methods
const initializeCarousel = () => {
  updateDeviceState()
  if (props.autoPlay && totalSlides.value > 1) {
    startCarousel()
  }
  isLoading.value = false
}

const startCarousel = () => {
  stopCarousel()
  interval.value = setInterval(() => {
    if (!isTransitioning.value) {
      nextSlide()
    }
  }, props.autoPlayInterval)
}

const stopCarousel = () => {
  if (interval.value) {
    clearInterval(interval.value)
    interval.value = null
  }
}

const nextSlide = () => {
  if (isTransitioning.value || totalSlides.value <= 1) return

  transitionDirection.value = 'next'
  isTransitioning.value = true
  incomingIndex.value = (currentIndex.value + 1) % totalSlides.value

  setTimeout(() => {
    if (isTransitioning.value) {
      currentIndex.value = incomingIndex.value
      incomingIndex.value = null
      isTransitioning.value = false
    }
  }, props.transitionDuration + 50)
}

const previousSlide = () => {
  if (isTransitioning.value || totalSlides.value <= 1) return

  transitionDirection.value = 'prev'
  isTransitioning.value = true
  incomingIndex.value = currentIndex.value === 0 ? totalSlides.value - 1 : currentIndex.value - 1

  setTimeout(() => {
    if (isTransitioning.value) {
      currentIndex.value = incomingIndex.value
      incomingIndex.value = null
      isTransitioning.value = false
    }
  }, props.transitionDuration + 50)
}

const goToSlide = (index) => {
  if (isTransitioning.value || index === currentIndex.value || index < 0 || index >= totalSlides.value) return

  transitionDirection.value = index > currentIndex.value ? 'next' : 'prev'
  isTransitioning.value = true
  incomingIndex.value = index

  setTimeout(() => {
    if (isTransitioning.value) {
      currentIndex.value = incomingIndex.value
      incomingIndex.value = null
      isTransitioning.value = false
    }
  }, props.transitionDuration + 50)
}

const getSlideClass = (index) => {
  const classes = []
  if (index === currentIndex.value) {
    classes.push('current')
  }
  if (index === incomingIndex.value) {
    classes.push('incoming')
    classes.push(`incoming-${transitionDirection.value}`)
  }
  if (errorImages.value.has(index)) {
    classes.push('error')
  }
  if (!loadedImages.value.has(index)) {
    classes.push('loading')
  }
  return classes.join(' ')
}

const handleAnimationEnd = (index) => {
  if (index === incomingIndex.value) {
    currentIndex.value = incomingIndex.value
    incomingIndex.value = null
    isTransitioning.value = false
  }
}

const handleImageLoad = (index) => {
  loadedImages.value.add(index)
  if (loadedImages.value.size === totalSlides.value) {
    isLoading.value = false
  }
}

const handleImageError = (index) => {
  errorImages.value.add(index)
  console.warn(`Failed to load hero image at slide index ${index}`)
}

const preloadImages = () => {
  if (typeof window === 'undefined') return
  currentSlides.value.forEach((slide, index) => {
    const src = getImageUrl(slide)
    if (!src) return
    const img = new Image()
    img.onload = () => handleImageLoad(index)
    img.onerror = () => handleImageError(index)
    img.src = src
  })
}

const handleMouseEnter = () => {
  if (props.pauseOnHover) {
    stopCarousel()
  }
}

const handleMouseLeave = () => {
  if (props.pauseOnHover && props.autoPlay) {
    startCarousel()
  }
}

const handleTouchStart = (event) => {
  const touch = event.changedTouches[0]
  startX.value = touch.pageX
  startY.value = touch.pageY
}

const handleTouchEnd = (event) => {
  if (startX.value === null || startY.value === null) return
  const touch = event.changedTouches[0]
  const distX = touch.pageX - startX.value
  const distY = touch.pageY - startY.value
  if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
    if (distX > 0) {
      previousSlide()
    } else {
      nextSlide()
    }
  }
  startX.value = null
  startY.value = null
}

const handleKeyDown = (event) => {
  if (event.key === 'ArrowLeft') {
    previousSlide()
  } else if (event.key === 'ArrowRight') {
    nextSlide()
  }
}

const getSlideAlt = (slide, index) => {
  return slide.alt || slide.title || `Hero Slide ${index + 1}`
}

onMounted(() => {
  initializeCarousel()
  preloadImages()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateDeviceState)
  }
})

onBeforeUnmount(() => {
  stopCarousel()
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateDeviceState)
  }
})
</script>

<template>
  <section 
    class="hero-carousel"
    :style="{ '--transition-duration': `${transitionDuration}ms` }"
    ref="carouselContainer"  
    tabindex="0"
    @keydown="handleKeyDown"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
    aria-label="Hero Carousel"
  >
    <Spinner v-if="isLoading" size="lg" message="Loading Slides..." />

    <!-- Empty State Fallback -->
    <div v-if="!isLoading && totalSlides === 0" class="hero-carousel-empty">
      <div class="empty-content">
        <p class="text-xs uppercase tracking-widest text-gray-400">Badmos Fashion</p>
      </div>
    </div>

    <!-- Single Carousel Slides Container -->
    <div v-else class="carousel-slides">
      <div
        v-for="(slide, index) in currentSlides"
        :key="`hero-slide-${index}`"
        class="slide-wrapper"
        :class="getSlideClass(index)"
        @animationend="handleAnimationEnd(index)"
      >
        <img
          :src="getImageUrl(slide)"
          :alt="getSlideAlt(slide, index)"
          @load="handleImageLoad(index)"
          @error="handleImageError(index)"
          loading="lazy"
        />

        <!-- Dark Contrast Overlay -->
        <div class="slide-overlay"></div>

        <!-- Text Content & CTA Banner -->
        <div 
          v-if="slide.title || slide.subtitle || slide.buttonText" 
          class="slide-content-container"
        >
          <div class="slide-content">
            <h3 v-if="slide.subtitle" class="slide-subtitle">{{ slide.subtitle }}</h3>
            <h2 v-if="slide.title" class="slide-title">{{ slide.title }}</h2>
            
            <div v-if="slide.link" class="slide-cta">
              <NuxtLink :to="slide.link" class="cta-button">
                <span>{{ slide.buttonText || 'Discover Now' }}</span>
                <svg class="cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Arrow Previous -->
    <button
      v-if="showArrows && totalSlides > 1"
      class="nav-arrow nav-arrow-prev"
      @click.stop="previousSlide"
      aria-label="Previous Slide"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <!-- Navigation Arrow Next -->
    <button
      v-if="showArrows && totalSlides > 1"
      class="nav-arrow nav-arrow-next"
      @click.stop="nextSlide"
      aria-label="Next Slide"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Navigation Dots -->
    <div v-if="showDots && totalSlides > 1" class="carousel-dots">
      <button
        v-for="(_, index) in currentSlides"
        :key="`dot-${index}`"
        :class="['dot-indicator', { active: index === (incomingIndex !== null ? incomingIndex : currentIndex) }]"
        @click="goToSlide(index)"
        :aria-label="`Go to slide ${index + 1}`"
      >
        <span class="dot-bar"></span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.hero-carousel {
  position: relative;
  width: 100%;
  max-width: 100vw;
  height: calc(80vh - 88px);
  min-height: 400px;
  overflow: hidden;
  margin: 0 auto;
  background: #0d0d0d;
  user-select: none;
  outline: none;
}

.hero-carousel-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #111827 0%, #000000 100%);
  color: #fff;
  text-align: center;
}

.carousel-slides {
  position: relative;
  width: 100%;
  height: 100%;
}

.slide-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.slide-wrapper.current {
  opacity: 1;
  z-index: 1;
  pointer-events: auto;
}

.slide-wrapper.incoming {
  opacity: 1;
  z-index: 2;
  pointer-events: auto;
}

.slide-wrapper.incoming-next {
  clip-path: inset(0 100% 0 0);
  animation: uncoverNext var(--transition-duration, 800ms) cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.slide-wrapper.incoming-prev {
  clip-path: inset(0 0 0 100%);
  animation: uncoverPrev var(--transition-duration, 800ms) cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.slide-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

/* Overlay gradient for text legibility */
/* .slide-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg, 
    rgba(0, 0, 0, 0.15) 0%, 
    rgba(0, 0, 0, 0.4) 60%, 
    rgba(0, 0, 0, 0.7) 100%
  );
  pointer-events: none;
} */

/* Slide Content */
.slide-content-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 4rem 5%;
  z-index: 5;
  pointer-events: none;
}

.slide-content {
  max-width: 650px;
  color: #ffffff;
  pointer-events: auto;
  transform: translateY(0);
}

.slide-wrapper.current .slide-content {
  animation: slideContentUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.slide-subtitle {
  font-size: 0.875rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: rgba(255, 255, 255, 0.85);
}

.slide-title {
  font-size: clamp(2rem, 5vw, 3.75rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 1.75rem;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.slide-cta {
  display: inline-block;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 2rem;
  background: #ffffff;
  color: #000000;
  font-weight: 600;
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: 9999px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  text-decoration: none;
}

.cta-button:hover {
  background: #f3f4f6;
  transform: translateY(-2px);
  box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.4);
}

.cta-icon {
  width: 1.125rem;
  height: 1.125rem;
  transition: transform 0.3s ease;
}

.cta-button:hover .cta-icon {
  transform: translateX(4px);
}

/* Arrow Navigation */
.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-arrow svg {
  width: 22px;
  height: 22px;
}

.nav-arrow:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #000000;
  transform: translateY(-50%) scale(1.08);
}

.nav-arrow-prev {
  left: 1.5rem;
}

.nav-arrow-next {
  right: 1.5rem;
}

/* Dots / Indicators */
.carousel-dots {
  position: absolute;
  bottom: 1.75rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 20;
}

.dot-indicator {
  padding: 0.5rem 0.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
}

.dot-bar {
  display: block;
  width: 24px;
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.35);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.dot-indicator:hover .dot-bar {
  background: rgba(255, 255, 255, 0.7);
}

.dot-indicator.active .dot-bar {
  width: 48px;
  background: #ffffff;
}

/* Keyframes */
@keyframes uncoverNext {
  to {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes uncoverPrev {
  to {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes slideContentUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive queries */
@media (max-width: 768px) {
  .hero-carousel {
    height: 65vh;
    min-height: 350px;
  }

  .slide-content-container {
    padding: 2.5rem 1.5rem;
  }

  .slide-title {
    font-size: 2.25rem;
    margin-bottom: 1.25rem;
  }

  .nav-arrow {
    width: 40px;
    height: 40px;
  }

  .nav-arrow-prev {
    left: 0.75rem;
  }

  .nav-arrow-next {
    right: 0.75rem;
  }
}

@media (max-width: 480px) {
  .hero-carousel {
    height: 75vh;
  }

  .slide-title {
    font-size: 1.75rem;
  }

  .cta-button {
    padding: 0.75rem 1.5rem;
    font-size: 0.75rem;
  }
}
</style>
