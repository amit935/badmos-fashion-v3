<script setup>
import { computed } from 'vue';
import { useNavTabs } from '~/composables/useNavTabs.js';

const props = defineProps({
  headerData: { type: Object, default: null },
});

const headerRef = computed(() => props.headerData);
const { navTabs } = await useNavTabs(headerRef);
</script>

<template>
  <nav>
    <ul class="flex gap-6">
      <li v-for="tab in navTabs" :key="tab.tabName + (tab.url || '')">
        <NuxtLink 
          v-if="tab.type === 'direct_link'" 
          :to="tab.url || '#'"
          class="font-bold uppercase flex items-center hover:text-gray-600 h-full"
        >
          {{ tab.tabName }}
        </NuxtLink>

        <UiDropdown v-else panelDir="center">
          <template #header>
            <p class="font-bold uppercase flex items-center">{{ tab.tabName }}</p>
          </template>
          <template #panel>
            <div class="flex flex-wrap items-start justify-center py-8 gap-y-4">
              <div
                v-for="category in tab.categories"
                :key="category.title + (category.url || '')"
                class="min-w-[144px] flex flex-col items-center justify-center gap-y-2"
              >
                <NuxtLink
                  v-if="!(category.url || '#').startsWith('http')"
                  :to="category.url || '#'"
                  class="text-lg font-semibold text-center hover:text-gray-600"
                >
                  {{ category.title }}
                </NuxtLink>
                <a
                  v-else
                  :href="category.url || '#'"
                  class="text-lg font-semibold text-center hover:text-gray-600"
                >
                  {{ category.title }}
                </a>

                <div
                  v-if="category.sections && category.sections.length > 0"
                  v-for="section in category.sections"
                  :key="section.title + (section.url || '')"
                  class="flex flex-col gap-y-2 items-center"
                >
                  <NuxtLink
                    v-if="!(section.url || '#').startsWith('http')"
                    :to="section.url || '#'"
                    class="text-gray-800 text-base font-medium text-center hover:text-gray-600"
                  >
                    {{ section.title }}
                  </NuxtLink>
                  <a
                    v-else
                    :href="section.url || '#'"
                    class="text-gray-800 text-base font-medium text-center hover:text-gray-600"
                  >
                    {{ section.title }}
                  </a>

                  <div
                    v-if="section.items && section.items.length > 0"
                    v-for="item in section.items"
                    :key="item.title + (item.url || '')"
                    class="flex flex-col gap-y-1 items-center"
                  >
                    <NuxtLink
                      v-if="!(item.url || '#').startsWith('http')"
                      :to="item.url || '#'"
                      class="text-gray-700 text-sm font-normal text-center hover:text-gray-600"
                    >
                      {{ item.title }}
                    </NuxtLink>
                    <a
                      v-else
                      :href="item.url || '#'"
                      class="text-gray-700 text-sm font-normal text-center hover:text-gray-600"
                    >
                      {{ item.title }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </UiDropdown>
      </li>
    </ul>
  </nav>
</template>