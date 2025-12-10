<script setup>
import { ref, onMounted, watch } from "vue";
import { useComunidades } from "~/composables/useComunidades";

const { $pb } = useNuxtApp();
const router = useRouter();
const route = useRoute();

const comunidades = ref([]);
const loading = ref(true);
const buscaTexto = ref("");
const filtroAtivo = ref("");
const ordenacaoData = ref("desc");

const { buscarComunidades } = useComunidades();

// Watch para sincronizar com a URL (similar à página de busca de livros)
watch(
  () => route.query.q,
  (newQ) => {
    if (newQ !== buscaTexto.value) {
      buscaTexto.value = newQ || "";
    }
    if (newQ && !loading.value) {
      carregarComunidades();
    }
  },
  { immediate: true }
);

// Watch para atualizar URL quando digitar
let updateTimeout = null;
watch(buscaTexto, (newTerm) => {
  clearTimeout(updateTimeout);
  
  if (route.query.q !== newTerm) {
    updateTimeout = setTimeout(() => {
      router.replace({ query: { ...route.query, q: newTerm || undefined } });
    }, 300);
  }
});

async function carregarComunidades() {
  loading.value = true;
  const resultado = await buscarComunidades(buscaTexto.value);

  if (resultado.sucesso) {
    comunidades.value = resultado.dados;
    aplicarOrdenacao();
  }

  loading.value = false;
}

async function buscar() {
  await carregarComunidades();
}

function toggleFiltroData() {
  if (filtroAtivo.value === "data") {
    ordenacaoData.value = ordenacaoData.value === "desc" ? "asc" : "desc";
  } else {
    filtroAtivo.value = "data";
    ordenacaoData.value = "desc";
  }
  aplicarOrdenacao();
}

function aplicarOrdenacao() {
  if (comunidades.value.length === 0 || filtroAtivo.value !== "data") return;

  comunidades.value.sort((a, b) => {
    const dataA = a.created || (ordenacaoData.value === "desc" ? "0000" : "9999");
    const dataB = b.created || (ordenacaoData.value === "desc" ? "0000" : "9999");
    return ordenacaoData.value === "desc" ? dataB.localeCompare(dataA) : dataA.localeCompare(dataB);
  });
}

onMounted(() => {
  // Se não há query na URL, carrega todas as comunidades
  if (!route.query.q) {
    carregarComunidades();
  }
});
</script>

<template>
  <div class="min-h-screen bg-incipit-fundo overflow-hidden relative font-sono">
    <Header 
      :show-search="true" 
      search-context="comunidades"
      :expandable="true"
      :loading="loading"
      v-model:search-term="buscaTexto"
      @search="buscar"
      variant="search"
    />

    <main class="relative z-10 p-6">  
      <div class="max-w-screen-xl mx-auto mb-6">
        
        <!-- Título sempre visível -->
        <div class="text-center mb-6">
          <h2 class="text-3xl text-texto mb-4">
            <span class="font-bold">{{ comunidades.length }}</span>
            <span class="font-normal"> {{ comunidades.length === 1 ? ' comunidade encontrada' : ' comunidades encontradas' }}</span>
          </h2>

          <!-- Filtros superiores -->
          <div class="flex items-center justify-center gap-3 mb-3">
            <span class="text-texto text-sm">Pesquisar por:</span>
            <button
              class="inline-flex bg-incipit-card rounded-lg p-1 gap-1 border-0 font-sono text-texto"
              @click="router.push('/search')"
            >
              Livros
            </button>

            <button
              class="inline-flex bg-incipit-card rounded-lg p-1 gap-1 border-0 font-sono font-bold text-texto"
            >
              Comunidades
            </button>
          </div>

          <!-- Filtros de ordenação -->
          <div class="flex items-center justify-end gap-2 text-sm">
            <button
              class="flex items-center gap-1 px-3 py-1.5 font-sono rounded-full border-0 transition-all"
              :class="filtroAtivo === 'data' ? 'bg-roxo text-branco font-bold' : 'bg-incipit-card text-texto hover:bg-incipit-base'"
              @click="toggleFiltroData"
            >
              <span>Data</span>
              <div v-if="filtroAtivo === 'data'" class="text-base transition-transform" :class="ordenacaoData === 'desc' ? 'i-mdi:arrow-down' : 'i-mdi:arrow-up'"></div>
              <div v-else class="i-mdi:unfold-more-horizontal text-base"></div>
            </button>

            <button 
              v-if="$pb.authStore.model" 
              class="botao"
              @click="router.push('/criar-comunidade')"
            >
              Criar comunidade
            </button>
          </div>
        </div>

        <!-- Estado de loading -->
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin i-mdi:loading text-4xl text-roxo"></div>
          <p class="text-texto mt-4">Buscando Comunidades...</p>
        </div>

        <!-- Nenhum resultado -->
        <div v-else-if="comunidades.length === 0" class="text-center py-12">
          <div class="i-mdi:image-search text-6xl text-texto/30 mb-4"></div>
          <p class="text-texto text-xl mb-2">Nenhuma comunidade encontrada</p>
          <p class="text-texto/60">
            <span v-if="buscaTexto">Tente buscar por outro termo ou </span>
            <button 
              v-if="$pb.authStore.model"
              @click="router.push('/criar-comunidade')"
              class="botao"
            >
              crie uma nova comunidade
            </button>
          </p>
        </div>

        <!-- Grid de Comunidades -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="comunidade in comunidades" 
            :key="comunidade.id"
            class="bg-incipit-card rounded-[30px] shadow-xl p-8 text-center hover:shadow-2xl transition cursor-pointer"
            @click="router.push(`/comunidade/${comunidade.id}`)"
          >
            <!-- Avatar da Comunidade -->
            <div class="w-48 h-48 mx-auto mb-6 rounded-full border-4 border-roxo bg-incipit-base overflow-hidden">
              <img 
                v-if="comunidade.imagem_comunidade"
                :src="$pb.files.getURL(comunidade, comunidade.imagem_comunidade)"
                :alt="comunidade.nome"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <div class="i-mdi:account-group text-8xl text-roxo"></div>
              </div>
            </div>

            <!-- Nome da Comunidade -->
            <h2 class="text-2xl font-bold text-texto mb-2 break-words">
              {{ comunidade.nome }}
            </h2>

            <!-- Criador -->
            <p class="text-texto text-sm mb-6">
              Criado por
              <span class="text-roxo font-medium">
                {{ comunidade.expand?.lider?.name || "Desconhecido" }}
              </span>
            </p>

            <!-- Botão Acessar -->
            <button 
              class="botao"
            >
              Acessar
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>