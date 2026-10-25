import { ref } from 'vue'

export function useStrapiHeader() {
  const headerData = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const defaultMockHeader = {
    logoText: 'BADMOS',
    logoLink: '/',
    showCartButton: true,
    topBar: {
      enabled: false,
      announcementText: '',
      linkUrl: ''
    },
    userMenu: {
      showUserDropdown: true,
      guestTitle: 'guest.profileDropdown.title',
      loginButtonLabel: 'auth.login.altTitle',
      registerButtonLabel: 'auth.register.altTitle',
      signOutLabel: 'Sign Out',
      userLinks: []
    },
    leftNavTabs: [
      {
        tabName: 'Shop By Categories',
        type: 'dropdown',
        url: '',
        categories: []
      },
      {
        tabName: 'Shop By Collections',
        type: 'dropdown',
        url: '',
        categories: []
      }
    ]
  }

  async function fetchHeader() {
    loading.value = true
    error.value = null
    const config = useRuntimeConfig()
    const cmsUrl = config.public?.cmsUrl || 'http://localhost:1337/api'

    try {
      const populateQuery = 'populate[leftNavTabs][populate][categories][populate][sections][populate]=items&populate[userMenu][populate]=userLinks&populate[topBar][populate]=announcements&populate[logoImage]=true'
      const response = await fetch(`${cmsUrl}/header?${populateQuery}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch header: ${response.statusText}`)
      }
      const json = await response.json()
      if (json && json.data) {
        headerData.value = json.data
      } else {
        headerData.value = defaultMockHeader
      }
    } catch (err) {
      console.warn('Unable to fetch header from Strapi, using default schema structure:', err)
      error.value = err
      headerData.value = defaultMockHeader
    } finally {
      loading.value = false
    }

    return headerData.value
  }

  return {
    headerData,
    loading,
    error,
    fetchHeader,
    defaultMockHeader
  }
}
