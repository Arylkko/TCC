<template>  <header 
    class="header-livro" 
    :class="{ 
      'header-search-page': variant === 'search',
      'header-book-page': variant === 'book',
      'header-auth-page': variant === 'auth'
    }"
  >
    <!-- Logo -->
    <NuxtLink to="/" class="logo-link">
      <span class="logo-text font-sono">Incipit</span>
    </NuxtLink>

    <!-- Search Form (apenas se showSearch for true) -->
     <div class="flex">
    <form 
      v-if="showSearch" 
      @submit.prevent="handleSearch" 
      class="search-form-livro"
      :class="{ 
        'search-expandable': expandable,
        'search-expanded': isExpanded || localSearchTerm
      }"
    >
      <div class="flex">
        <input
          v-model="localSearchTerm"
          type="text"
          placeholder="Pesquisar livros..."
          class="search-input-livro font-sono !bg-incipit-card box-border"
          :class="{ 'input-expanded': isExpanded || localSearchTerm }"
          @focus="handleFocus"
          @blur="handleBlur"
        />
      </div>
                    <button 
          type="submit" 
          class="search-button-livro"
          :disabled="loading"
        >
          <div 
            class="i-mdi:magnify" 
            :class="loading ? 'animate-pulse' : ''"
          ></div>
        </button>
      
      
    </form>    <!-- User Menu (apenas se showUserMenu for true E não for página de auth) -->
    <div v-if="showUserMenu && variant !== 'auth'" class="user-menu-livro">
      <div class="i-mdi:account-circle user-icon" title="Perfil"></div>
      <div class="i-mdi:menu menu-icon" title="Menu"></div>
    </div>

    <!-- Menu simples para páginas de autenticação -->
    <div v-if="variant === 'auth'" class="auth-menu-livro">
      <div class="i-mdi:menu menu-icon" title="Menu"></div>
    </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  // Controla se mostra a barra de busca
  showSearch: {
    type: Boolean,
    default: false
  },
  // Controla se mostra o menu de usuário (ícones de perfil e menu)
  showUserMenu: {
    type: Boolean,
    default: true
  },
  // Permite que o campo de busca expanda ao focar
  expandable: {
    type: Boolean,
    default: false
  },
  // Estado de loading (para animação na lupa)
  loading: {
    type: Boolean,
    default: false
  },
  // Termo de busca (v-model)
  searchTerm: {
    type: String,
    default: ''
  },
  // Variante do header ('book', 'search' ou 'auth')
  variant: {
    type: String,
    default: 'book',
    validator: (value) => ['book', 'search', 'auth'].includes(value)
  }
});

const emit = defineEmits(['search', 'update:searchTerm']);

const { $pb } = useNuxtApp();
const router = useRouter();

// Estado local
const localSearchTerm = ref(props.searchTerm);
const isExpanded = ref(false);
const showMenu = ref(false);

const isAuthenticated = computed(() => $pb.authStore.isValid);

// Sincroniza prop com estado local
watch(() => props.searchTerm, (newVal) => {
  localSearchTerm.value = newVal;
});

// Sincroniza estado local com prop (two-way binding)
watch(localSearchTerm, (newVal) => {
  emit('update:searchTerm', newVal);
});

function handleFocus() {
  if (props.expandable) {
    isExpanded.value = true;
  }
}

function handleBlur() {
  if (props.expandable) {
    isExpanded.value = false;
  }
}

function handleSearch() {
  if (!localSearchTerm.value.trim()) return;
  
  // Emite evento para a página pai
  emit('search', localSearchTerm.value);
  
  // Se não houver listener, faz navegação padrão
  if (props.variant === 'book') {
    router.push(`/search?q=${encodeURIComponent(localSearchTerm.value)}`);
    localSearchTerm.value = '';
  }
}

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function handleLogout() {
  $pb.authStore.clear();
  showMenu.value = false;
  router.push('/login');
}
</script>

<style src="~/styles/components/header.css"></style>
