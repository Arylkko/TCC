<script setup>
import { ref, onMounted } from "vue";
import { useComunidades } from "~/composables/useComunidades";

const { $pb } = useNuxtApp();
const router = useRouter();

const comunidades = ref([]);
const loading = ref(true);
const buscaTexto = ref("");

const { buscarComunidades } = useComunidades();

async function carregarComunidades() {
  loading.value = true;
  const resultado = await buscarComunidades(buscaTexto.value);

  if (resultado.sucesso) {
    comunidades.value = resultado.dados;
  }

  loading.value = false;
}

async function buscar() {
  await carregarComunidades();
}

onMounted(() => {
  carregarComunidades();
});
</script>

<template>
  <div class="min-h-screen bg-incipit-fundo overflow-hidden relative font-sono">
    <Header :show-search="true" />

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
              @click="searchType = 'livros'"
            >
              Livros
            </button>

            <button
              class="inline-flex bg-incipit-card rounded-lg p-1 gap-1 border-0 font-sono font-bold text-texto"
              @click="searchType = 'comunidades'"
            >
              Comunidades
            </button>
          </div>

          <!-- Campo de busca -->
          <div class="flex gap-2 max-w-md mx-auto mb-6">
            <input 
              v-model="buscaTexto" 
              type="text" 
              placeholder="Buscar comunidades..."
              @keyup.enter="buscar"
              class="flex-1 px-4 py-2 rounded-lg bg-incipit-card text-texto border-none outline-none focus:ring-2 focus:ring-roxo"
            />
            <button 
              @click="buscar"
              class="botao"
            >
              Buscar
            </button>
          </div>

          <!-- Filtros de ordenação -->
          <div class="flex items-center justify-end gap-2 text-sm">
            <div class="relative inline-block">
              <button
                class="flex items-center gap-1 px-3 py-1.5 font-sono text-texto rounded-full border-0 bg-incipit-card font-bold hover:bg-roxo/10 transition"
              >
                <span>Data</span>
                <div class="i-mdi:chevron-down text-sm"></div>
              </button>
            </div>

            <div class="relative inline-block">
              <button
                class="flex items-center gap-1 px-3 py-1.5 font-sono text-texto rounded-full border-0 bg-incipit-card font-bold hover:bg-roxo/10 transition"
              >
                <span>Nota</span>
                <div class="i-mdi:chevron-down text-sm"></div>
              </button>
            </div>

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
                :src="$pb.files.getUrl(comunidade, comunidade.imagem_comunidade)"
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