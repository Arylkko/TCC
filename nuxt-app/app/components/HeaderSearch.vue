<script setup>
const props = defineProps({
  searchTerm: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  // Se true, a busca está ativa (página de search)
  enableSearch: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:searchTerm', 'search']);

const localSearchTerm = ref(props.searchTerm);

watch(() => props.searchTerm, (newVal) => {
  localSearchTerm.value = newVal;
});

const handleSearch = () => {
  if (props.enableSearch) {
    emit('update:searchTerm', localSearchTerm.value);
    emit('search');
  } else {
    // Redireciona para a página de busca
    navigateTo(`/searchteste?q=${encodeURIComponent(localSearchTerm.value)}`);
  }
};
</script>

<template>
  <header class="flex justify-between items-center p-x-6 py-4 rounded-b-[40px] bg-incipit-base shadow-md">
    <NuxtLink to="/" class="text-2xl text-branco font-bold hover:opacity-90 transition">
      Incipit
    </NuxtLink>
      <!-- Barra de pesquisa no header -->
    <form @submit.prevent="handleSearch" class="flex-1 max-w-2xl mx-8">
      <div class="relative">
        <input 
          v-model="localSearchTerm" 
          type="text" 
          placeholder="Pesquisar livros..." 
          class="w-full pl-4 pr-12 py-2.5 rounded-full bg-branco text-texto placeholder-texto/60 border-none outline-none focus:ring-2 focus:ring-roxo/50"
        />
        <button 
          type="submit" 
          :disabled="loading"
          class="absolute right-1 top-1/2 -translate-y-1/2 bg-roxo text-branco w-9 h-9 rounded-full hover:brightness-90 transition disabled:opacity-50 flex items-center justify-center shadow-md"
        >
          <div class="i-mdi:magnify text-xl"></div>
        </button>
      </div>
    </form>

    <div class="flex items-center space-x-4">
      <div class="i-mdi:account-circle text-branco text-3xl cursor-pointer"></div>
      <div class="i-mdi:menu text-branco text-2xl cursor-pointer"></div>
    </div>
  </header>
</template>
