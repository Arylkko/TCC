// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    'pocketbase-nuxt',
    '@unocss/nuxt'
  ],

  runtimeConfig: {
    // Variáveis privadas (apenas server-side)
    // apiSecret: '',

    // Variáveis públicas (acessíveis no client)
    public: {
      googleBooksApiKey: process.env.NUXT_PUBLIC_GOOGLE_BOOKS_API_KEY,
      pocketbaseUrl: process.env.NUXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090',
    }
  },
  
  pocketbase: {
    url: process.env.NUXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090',
  }
})

  