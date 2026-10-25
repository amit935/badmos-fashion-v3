import { ref } from 'vue'

export function useStrapiFooter() {
  const footerData = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchFooter = async () => {
    loading.value = true
    error.value = null
    const config = useRuntimeConfig()
    const cmsUrl = config.public?.cmsUrl || 'http://localhost:1337/api'

    try {
      const populateQuery = 'populate[columns][populate]=links&populate[socialLinks][populate]=iconImage'
      const response = await fetch(`${cmsUrl}/footer?${populateQuery}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch footer: ${response.statusText}`)
      }
      const json = await response.json()
      footerData.value = json?.data || null
      return footerData.value
    } catch (err) {
      console.error('useStrapiFooter Error:', err)
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    footerData,
    loading,
    error,
    fetchFooter,
  }
}
