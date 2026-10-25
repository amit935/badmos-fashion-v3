<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePriceFormatter } from '~/composables/usePriceFormatter';
import { useStrapiMedia } from '~/composables/useStrapiMedia';

const router = useRouter();
const { getStrapiMedia } = useStrapiMedia();
const { formatPrice } = usePriceFormatter();

const props = defineProps({
  product: {
    type: Object,
    required: true,
    validator: (product) => {
      return product && (product.name || product.title) && (product.variants?.length > 0 || product.price !== undefined || product.priceWithTax !== undefined);
    }
  }
});

// Get the parent option group with fallback logic
const parentOptionGroup = computed(() => {
  if (!props.product?.optionGroups) return null;
  
  // First try to find by customFields.isParentGroup
  let parent = props.product.optionGroups.find(g => g.customFields?.isParentGroup === true);
  
  // Fallback: look for common parent group codes
  if (!parent) {
    const commonParentCodes = ['size', 'color', 'style'];
    parent = props.product.optionGroups.find(g => commonParentCodes.includes(g.code?.toLowerCase()));
  }
  
  // If still not found, use the first option group
  if (!parent && props.product.optionGroups.length > 0) {
    parent = props.product.optionGroups[0];
  }
  
  return parent;
});

// Filter parent options to show only those that have actual variants
const filteredParentOptions = computed(() => {
  if (!parentOptionGroup.value) return [];

  const parentCodesSet = new Set();
  
  // Collect all option codes that exist in variants for this option group
  (props.product.variants || []).forEach(variant => {
    (variant.options || []).forEach(opt => {
      if (opt.group?.code === parentOptionGroup.value.code) {
        parentCodesSet.add(opt.code);
      }
    });
  });

  // If variants have no explicit option objects, fallback to parentOptionGroup options
  if (parentCodesSet.size === 0 && parentOptionGroup.value.options) {
    return parentOptionGroup.value.options;
  }

  // Filter parent options to only include those with variants
  return parentOptionGroup.value.options.filter(opt => parentCodesSet.has(opt.code));
});

// Extract media URLs cleanly
const primaryImageUrl = computed(() => {
  const asset = props.product?.assets?.[0] || props.product?.image || props.product?.preview;
  return getStrapiMedia(asset) || asset?.preview || asset?.url || '';
});

const secondaryImageUrl = computed(() => {
  const asset = props.product?.assets?.[1] || props.product?.hoverImage;
  return getStrapiMedia(asset) || asset?.preview || asset?.url || '';
});

// Check if secondary image exists
const hasSecondaryImage = computed(() => {
  return !!secondaryImageUrl.value;
});

const goToProductDetail = (optionCode, productSlug) => {
  const targetSlug = productSlug || props.product?.id || '';
  if (!parentOptionGroup.value) {
    router.push({
      path: `/product/${targetSlug}`
    });
    return;
  }

  router.push({
    path: `/product/${targetSlug}`,
    query: { 
      [parentOptionGroup.value.code]: optionCode 
    }
  });
};
</script>

<template>
  <div class="product-card">
    <!-- Product Image -->
    <NuxtLink 
      :to="`/product/${product?.slug || product?.id || ''}`"
    >
      <div class="product-image-container">
        <!-- Default Image (First) -->
        <img 
          :src="primaryImageUrl" 
          :alt="product.name || product.title || 'Product'"
          class="product-image primary-image"
          :class="{ 'no-secondary': !hasSecondaryImage }"
          loading="lazy"
        />

        <!-- Hover Image (Second) - Fade in and zoom from center -->
        <img 
          v-if="hasSecondaryImage"
          :src="secondaryImageUrl" 
          :alt="product.name || product.title || 'Product'"
          class="product-image secondary-image"
          loading="lazy"
        />
        
        <!-- Image overlay -->
        <div class="image-overlay"></div>
      </div>
    </NuxtLink>
    
    <!-- Product Info -->
    <div class="product-info">
      <NuxtLink 
        :to="`/product/${product?.slug || product?.id || ''}`"
      >
        <h3 class="product-name">{{ product.name || product.title }}</h3>
      </NuxtLink>  
      
      <!-- Price -->
      <div class="product-price">
        <span class="current-price">
          {{ formatPrice(product.variants?.[0]?.priceWithTax || product.priceWithTax || product.price || 0) }}
        </span>
      </div>

      <!-- Parent Option Group - Filtered to show only available options -->
      <div v-if="filteredParentOptions.length" class="product-options">
        <div class="options-container">
          <button 
            v-for="option in filteredParentOptions" 
            :key="option.id || option.code"
            class="option-btn uppercase"
            @click.stop="goToProductDetail(option.code, product?.slug)"
          >
            {{ option.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  position: relative;
  background: white;
  border-radius: 0;
  border: 2px solid #000;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.product-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: var(--product-card-aspect-ratio, 1/1);
  overflow: hidden;
  border-bottom: 2px solid #000;
}

.product-image {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.4s ease;
}

/* Default/Primary Image - Always visible initially */
.primary-image {
  opacity: 1;
  transform: scale(1);
  z-index: 1;
}

/* Primary image when there's NO secondary image - just scale on hover */
.primary-image.no-secondary {
  transform: scale(1);
  transform-origin: center center;
}

.product-image-container:hover .primary-image.no-secondary {
  transform: scale(1.05);
}

/* Secondary Image - Hidden by default, shows on hover */
.secondary-image {
  opacity: 0;
  transform: scale(1);
  transform-origin: center center;
  z-index: 2;
}

/* Hover Effects - Only when secondary image exists */
.product-image-container:hover .primary-image:not(.no-secondary) {
  opacity: 0;
  transform: scale(1.05);
}

.product-image-container:hover .secondary-image {
  opacity: 1;
  transform: scale(1);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 3;
}

.product-info {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #000;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-price {
  font-size: 18px;
  font-weight: 700;
  color: #000;
}

/* Product Options */
.product-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.option-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #666;
}

.options-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.option-btn {
  padding: 6px 10px;
  border: 1px solid #000;
  background: #fff;
  color: #000;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  border-radius: 2px;
}

.option-btn:hover {
  background: #000;
  color: #fff;
}

/* Responsive */
@media (max-width: 768px) {
  .product-image-container {
    aspect-ratio: var(--product-card-mobile-aspect-ratio, 1/1);
  }
  
  .product-info {
    padding: 12px;
  }
  
  .product-name {
    font-size: 14px;
  }
  
  .current-price {
    font-size: 16px;
  }

  .option-btn {
    padding: 5px 8px;
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .product-info {
    padding: 10px;
  }
}
</style>
