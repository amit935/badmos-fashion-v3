<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/store/auth'
import { useSignout } from '~/composables/useSignout.js'
import { useCartStore } from '~/store/cart'

const cart = useCartStore()
const { isPanelOpen } = storeToRefs(cart)

const toggleCartPanel = () => {
  isPanelOpen.value = !isPanelOpen.value
}

const props = defineProps({
  headerData: { type: Object, default: null }
})

const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)
const { signOut } = useSignout()
const router = useRouter()

const activeHeaderData = computed(() => props.headerData)

const userMenuItems = computed(() => {
  const strapiLinks = activeHeaderData.value?.userMenu?.userLinks
  if (strapiLinks && strapiLinks.length > 0) {
    return strapiLinks.map(l => ({ name: l.title, url: l.url }))
  }
  return []
})

const showCartButton = computed(() => activeHeaderData.value?.showCartButton !== false)
const guestTitle = computed(() => activeHeaderData.value?.userMenu?.guestTitle || 'Welcome to Badmos Fashion')
const joinClanLabel = computed(() => activeHeaderData.value?.userMenu?.joinClanButtonLabel || 'Join The Clan')
const joinClanUrl = computed(() => activeHeaderData.value?.userMenu?.joinClanButtonUrl || '/login')
const signOutLabel = computed(() => activeHeaderData.value?.userMenu?.signOutLabel || 'Sign Out')

const goToJoinClan = () => {
  if (joinClanUrl.value.startsWith('http')) {
    window.location.href = joinClanUrl.value
  } else {
    router.push(joinClanUrl.value)
  }
}

const signOutAndRedirect = async () => {
  try {
    await signOut()
    window.location.href = '/'
  } catch (error) {
    console.error('Error during sign out:', error)
  }
}

const menuOpen = ref(false)
const toggleMenu = () => { menuOpen.value = !menuOpen.value }
</script>

<template>
    <nav>
        <ul class="flex gap-6">
           <li v-if="showCartButton">
              <button
                @click="toggleCartPanel"
                class="relative h-full px-2 py-1 flex items-center border-b-3 border-transparent cursor-pointer"
                aria-label="Open cart"
              >
                <Icon name="material-symbols:shopping-bag" size="24" />
                <span
                  v-if="cart.itemCount > 0"
                  class="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center"
                >
                  {{ cart.itemCount }}
                </span>
              </button>

              <div
                v-if="isPanelOpen"
                class="fixed h-[100vh] w-[100%] md:w-[35%] top-0 right-0 bg-white z-20 pt-10 px-8 border-l-2 border-black"
              >
                <CartPanel @toggleMenu="toggleCartPanel" />
              </div>
            </li>
            <li>
                <UiDropdown panelDir="right">
                    <template #header>
                        <Icon name="material-symbols:person" size="24" />
                    </template>
                    <template #panel>
                        <div v-if="isAuthenticated" class="p-4 flex flex-col gap-1">
                            <div v-for="userLink in userMenuItems" :key="userLink.name + userLink.url">
                                <NuxtLink
                                    v-if="!userLink.url.startsWith('http')"
                                    :to="userLink.url"
                                    class="block text-base font-semibold text-center py-1 hover:text-gray-600 border-b border-gray-100"
                                >
                                    {{ userLink.name }}
                                </NuxtLink>
                                <a
                                    v-else
                                    :href="userLink.url"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="block text-base font-semibold text-center py-1 hover:text-gray-600 border-b border-gray-100"
                                >
                                    {{ userLink.name }}
                                </a>
                            </div>
                            <button
                                @click="signOutAndRedirect()"
                                class="w-full text-center text-base font-semibold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                            >
                                {{ signOutLabel }}
                            </button>
                        </div>
                        <div v-else class="flex flex-col gap-4 p-6 items-center min-w-[220px]">
                            <h1 class="text-2xl text-center font-bold secondary-font">{{ guestTitle }}</h1>
                            <UiButton @click="goToJoinClan" :text="joinClanLabel" class="w-full text-center"/>
                        </div>
                    </template>
                </UiDropdown>
            </li>

        </ul>
    </nav>
</template>