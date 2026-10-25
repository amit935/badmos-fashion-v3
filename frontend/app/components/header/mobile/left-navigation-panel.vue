<script setup>
import { ref, onMounted, computed } from 'vue';
import { useQueryCollection } from '~/composables/useQueryCollection.js';
import { useStrapiHeader } from '~/composables/useStrapiHeader.js';

const { fetchCollection } = useQueryCollection();
const { fetchHeader } = useStrapiHeader();

const headerData = ref(null);
const shopByCategory = ref({ name: 'Shop By Categories', children: [] });
const shopByCollection = ref({ name: 'Shop By Collections', children: [] });

// Track which top-level tabs are open
const openTabs = ref(new Set());
// Track which sections are expanded
const expandedItems = ref(new Set());

const toggleTab = (tabKey) => {
  if (openTabs.value.has(tabKey)) {
    openTabs.value.delete(tabKey);
  } else {
    openTabs.value.add(tabKey);
  }
};

const toggleItem = (itemKey) => {
  if (expandedItems.value.has(itemKey)) {
    expandedItems.value.delete(itemKey);
  } else {
    expandedItems.value.add(itemKey);
  }
};

onMounted(async () => {
  try {
    headerData.value = await fetchHeader();
    if (!headerData.value?.leftNavTabs || headerData.value.leftNavTabs.length === 0) {
      const catData = await fetchCollection('shop-by-categories');
      const collData = await fetchCollection('shop-by-collections');
      const categoriesList = await fetchCollection('categories');
      const collectionsList = await fetchCollection('collections');
      
      shopByCategory.value = {
        name: typeof catData === 'string' ? catData : catData?.name || 'Shop By Categories',
        children: Array.isArray(categoriesList) ? categoriesList : categoriesList?.children || []
      };
      shopByCollection.value = {
        name: typeof collData === 'string' ? collData : collData?.name || 'Shop By Collections',
        children: Array.isArray(collectionsList) ? collectionsList : collectionsList?.children || []
      };
    }
  } catch (err) {
    console.error('Error fetching navigation data:', err);
  }
});

const navTabs = computed(() => {
  if (headerData.value?.leftNavTabs && headerData.value.leftNavTabs.length > 0) {
    return headerData.value.leftNavTabs;
  }
  
  return [
    {
      tabName: shopByCategory.value.name,
      type: 'dropdown',
      categories: (shopByCategory.value.children || []).map(cat => ({
        title: cat.name,
        url: `/${cat.slug || ''}`,
        sections: (cat.children || []).map(child => ({
          title: child.name,
          url: `/${child.slug || ''}`,
          items: (child.children || []).map(grand => ({
            title: grand.name,
            url: `/${grand.slug || ''}`
          }))
        }))
      }))
    },
    {
      tabName: shopByCollection.value.name,
      type: 'dropdown',
      categories: (shopByCollection.value.children || []).map(col => ({
        title: col.name,
        url: `/${col.slug || ''}`,
        sections: (col.children || []).map(child => ({
          title: child.name,
          url: `/${child.slug || ''}`,
          items: (child.children || []).map(grand => ({
            title: grand.name,
            url: `/${grand.slug || ''}`
          }))
        }))
      }))
    }
  ];
});

const props = defineProps({
  toggleMenu: {
    type: Function,
    default: null
  }
});

const emit = defineEmits(['toggleMenu']);
</script>

<template>
  <button 
    @click="emit('toggleMenu')" 
    class="p-1 absolute top-0 left-0 m-10 text-gray-400 hover:text-red-600 transition-colors"
    aria-label="Close menu"
  >
    <Icon name="material-symbols:close" size="24" />
  </button>
  <nav class="mt-12">
    <ul class="flex flex-col gap-4 p-4">
      <li v-for="tab in navTabs" :key="tab.tabName + (tab.url || '')">
        <a 
          v-if="tab.type === 'direct_link'"
          :href="tab.url || '#'"
          class="font-bold uppercase block py-2 text-lg hover:text-gray-600"
        >
          {{ tab.tabName }}
        </a>

        <div v-else>
          <button 
            @click="toggleTab(tab.tabName)" 
            class="font-bold uppercase flex items-center justify-between w-full py-2"
          >
            <span>{{ tab.tabName }}</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-5 w-5 transition-transform"
              :class="{ 'rotate-180': openTabs.has(tab.tabName) }"
              fill="none" 
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          
          <div v-show="openTabs.has(tab.tabName)" class="mt-2 ml-4">
            <div
              v-for="category in tab.categories"
              :key="category.title + (category.url || '')"
              class="flex flex-col mb-3"
            >
              <a
                :href="category.url || '#'"
                class="text-lg font-semibold py-2 hover:text-gray-600"
              >
                {{ category.title }}
              </a>

              <div v-if="category.sections && category.sections.length > 0">
                <div
                  v-for="section in category.sections"
                  :key="section.title + (section.url || '')"
                  class="ml-4"
                >
                  <button
                    v-if="section.items && section.items.length > 0"
                    @click="toggleItem(section.title)"
                    class="flex items-center justify-between w-full text-gray-800 text-lg font-medium py-1 hover:text-gray-600"
                  >
                    <span>{{ section.title }}</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      class="h-4 w-4 transition-transform"
                      :class="{ 'rotate-180': expandedItems.has(section.title) }"
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  <a
                    v-else
                    :href="section.url || '#'"
                    class="block text-gray-800 text-lg font-medium py-1 hover:text-gray-600"
                  >
                    {{ section.title }}
                  </a>

                  <div 
                    v-if="section.items && expandedItems.has(section.title)"
                    class="ml-4"
                  >
                    <a
                      v-for="item in section.items"
                      :key="item.title + (item.url || '')"
                      :href="item.url || '#'"
                      class="block text-gray-700 text-lg font-normal py-1 hover:text-gray-600"
                    >
                      {{ item.title }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
button {
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
}

a {
  text-decoration: none;
  color: inherit;
  transition: color 0.2s ease;
}

svg {
  flex-shrink: 0;
}
</style>