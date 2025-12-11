<template>
  <header
    class="header-livro"
    :class="{
      'header-search-page': variant === 'search',
      'header-book-page': variant === 'book',
      'header-auth-page': variant === 'auth',
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
          'search-expanded': isExpanded || localSearchTerm,
        }"
      >
        <div class="flex">
          <input
            v-model="localSearchTerm"
            type="text"
            :placeholder="searchPlaceholder"
            class="search-input-livro font-sono !bg-incipit-card box-border"
            :class="{ 'input-expanded': isExpanded || localSearchTerm }"
            @focus="handleFocus"
            @blur="handleBlur"
          />
        </div>
      </form>
      <!-- User Menu (apenas se showUserMenu for true E não for página de auth) -->
      <div v-if="showUserMenu && variant !== 'auth'" class="user-menu-livro">
        <div
          class="i-mdi:account-circle user-icon"
          title="Perfil"
          @click="irParaPerfil"
          style="cursor: pointer"
        ></div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  showSearch: {
    type: Boolean,
    default: false,
  },
  showUserMenu: {
    type: Boolean,
    default: true,
  },
  expandable: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  searchTerm: {
    type: String,
    default: "",
  },
  variant: {
    type: String,
    default: "book",
    validator: (value) => ["book", "search", "auth"].includes(value),
  },  // Nova prop para identificar o contexto de busca
  searchContext: {
    type: String,
    default: "livros", // 'livros', 'comunidades' ou 'listas'
    validator: (value) => ["livros", "comunidades", "listas"].includes(value),
  },
});

const emit = defineEmits(["search", "update:searchTerm"]);

const { $pb } = useNuxtApp();
const router = useRouter();

// Estado local
const localSearchTerm = ref(props.searchTerm);
const isExpanded = ref(false);
const showMenu = ref(false);

const isAuthenticated = computed(() => $pb.authStore.isValid);

// Placeholder dinâmico baseado no contexto
const searchPlaceholder = computed(() => {
  if (props.searchContext === "comunidades") {
    return "Pesquisar comunidades...";
  } else if (props.searchContext === "listas") {
    return "Pesquisar listas...";
  }
  return "Pesquisar livros...";
});

// Sincroniza prop com estado local
watch(
  () => props.searchTerm,
  (newVal) => {
    localSearchTerm.value = newVal;
  }
);

// Sincroniza estado local com prop (two-way binding)
watch(localSearchTerm, (newVal) => {
  emit("update:searchTerm", newVal);
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
  emit("search", localSearchTerm.value);

  // Se não houver listener, faz navegação baseada no contexto
  if (props.variant === "book") {
    if (props.searchContext === "comunidades") {
      router.push(`/comunidades?q=${encodeURIComponent(localSearchTerm.value)}`);
    } else if (props.searchContext === "listas") {
      router.push(`/listas?q=${encodeURIComponent(localSearchTerm.value)}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(localSearchTerm.value)}`);
    }
    localSearchTerm.value = "";
  }
}

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function handleLogout() {
  $pb.authStore.clear();
  showMenu.value = false;
  router.push("/login");
}

function irParaPerfil() {
  const userId = $pb.authStore.model?.id;
  if (userId) {
    router.push(`/usuario/${userId}`);
  }
}
</script>

<style src="~/styles/components/header.css"></style>