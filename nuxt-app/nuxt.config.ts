// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    'pocketbase-nuxt',
    '@unocss/nuxt'
  ],

  
  pocketbase: {
    url: 'http://127.0.0.1:8090',
  }
})

  