<script setup>
import { ref, onMounted } from 'vue';
import { useLivros } from '~/composables/useLivros';
import { useListas } from '~/composables/useListas';

const { $pb } = useNuxtApp();
const route = useRoute();
const config = useRuntimeConfig();

const searchTerm = ref('');
const results = ref([]);
const loading = ref(false);
const error = ref('');
const saveStatus = ref({}); 
const minhasListas = ref([]);
const mostrarModalListas = ref(false);
const livroSelecionado = ref(null);
const listaEspecifica = ref(null); // Para quando vier de uma lista específica
const searchExpanded = ref(false); // Controla se o campo de busca está expandido
const searchType = ref('livros'); // 'livros' ou 'comunidades'
const sortBy = ref('relevancia'); // 'relevancia', 'data', 'nota'

// API Key do Google Books via variável de ambiente
const apiKey = config.public.googleBooksApiKey;


const { salvarLivro } = useLivros();
const { buscarListasUsuario, adicionarLivroNaLista } = useListas();


onMounted(async () => {
  // Verifica se veio de uma lista específica
  if (route.query.lista) {
    listaEspecifica.value = route.query.lista;
  }
  
  // Verifica se há um termo de busca na URL (query parameter 'q')
  if (route.query.q) {
    searchTerm.value = route.query.q;
    searchBooks();
  }
  
  if ($pb.authStore.isValid) {
    const resultado = await buscarListasUsuario($pb.authStore.model.id);
    if (resultado.sucesso) {
      minhasListas.value = resultado.dados;
    }
  }
});


async function searchBooks() {
  error.value = '';
  results.value = [];
  if (!searchTerm.value.trim()) return;
  loading.value = true;
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm.value)}&key=${apiKey}`
    );
    const data = await res.json();
    if (Array.isArray(data.items)) {
      results.value = data.items; // Removida a ordenação por avaliação
    } else {
      results.value = [];
      error.value = 'Nenhum livro encontrado.';
    }
  } catch (e) {
    error.value = 'Erro ao buscar livros.';
    results.value = [];
  } finally {
    loading.value = false;
  }
}

async function salvarLivroNoBanco(item) {
  const id = item.id;
  saveStatus.value[id] = 'salvando';
  const volume = item.volumeInfo;
  const nome = volume.title;

  let isbn = '';
  if (Array.isArray(volume.industryIdentifiers)) {
    const isbnObj = volume.industryIdentifiers.find(i => i.type && i.identifier);
    if (isbnObj) isbn = isbnObj.identifier;
  }

  if (!nome || !isbn) {
    saveStatus.value[id] = 'erro';
    console.log('Erro: Nome ou ISBN não encontrados', { nome, isbn });
    return { sucesso: false, erro: 'Nome ou ISBN não encontrados' };
  }

  const dadosLivro = {
    Nome: nome,
    ISBN: isbn
  };

  console.log('Dados do livro para salvar:', dadosLivro);
  const resultado = await salvarLivro(dadosLivro);
  
  if (resultado.sucesso) {
    saveStatus.value[id] = 'salvo';
    console.log('Livro salvo/encontrado com sucesso:', resultado.dados);
    return resultado;
  } else {
    console.error('Erro ao salvar livro:', resultado.erro);
    saveStatus.value[id] = 'erro';
    return resultado;
  }
}

// Abrir modal para selecionar lista
function abrirModalListas(item) {
  if (!$pb.authStore.isValid) {
    alert('Você precisa estar logado para adicionar livros às listas!');
    return;
  }
  
  if (minhasListas.value.length === 0) {
    alert('Você não tem nenhuma lista criada. Crie uma lista primeiro!');
    return;
  }
  
  livroSelecionado.value = item;
  
  // Se veio de uma lista específica, adiciona diretamente
  if (listaEspecifica.value) {
    adicionarLivroALista(listaEspecifica.value);
  } else {
    mostrarModalListas.value = true;
  }
}


async function adicionarLivroALista(listaId) {
  console.log('Iniciando adicionarLivroALista com listaId:', listaId);
  
  if (!livroSelecionado.value) {
    console.log('Erro: Nenhum livro selecionado');
    return;
  }

  const item = livroSelecionado.value;
  const volume = item.volumeInfo;
  
  console.log('Livro selecionado:', volume.title);
  
  try {
    // Primeiro salva o livro no banco
    console.log('Salvando livro no banco...');
    const resultadoSalvar = await salvarLivroNoBanco(item);
    
    if (!resultadoSalvar.sucesso) {
      alert('Erro ao salvar livro: ' + resultadoSalvar.erro);
      return;
    }
    
    const livroNoBanco = resultadoSalvar.dados;
    console.log('Livro salvo/encontrado no banco:', livroNoBanco);
    
    console.log('Adicionando livro à lista...');
    const resultado = await adicionarLivroNaLista(listaId, livroNoBanco.id);
    console.log('Resultado da adição:', resultado);
    
    if (resultado.sucesso) {
      alert('Livro adicionado à lista com sucesso!');
      // Recarrega as listas do usuário
      const resultadoListas = await buscarListasUsuario($pb.authStore.model.id);
      if (resultadoListas.sucesso) {
        minhasListas.value = resultadoListas.dados;
      }
      
      // Se veio de uma lista específica, redireciona de volta
      if (listaEspecifica.value) {
        setTimeout(() => {
          navigateTo(`/lista/${listaEspecifica.value}`);
        }, 1500);
      }
    } else {
      alert('Erro ao adicionar livro à lista: ' + resultado.erro);
    }
  } catch (error) {
    console.error('Erro ao adicionar à lista:', error);
    alert('Erro ao adicionar livro à lista: ' + error.message);
  }
  
  mostrarModalListas.value = false;
  livroSelecionado.value = null;
}
</script>

<template>
  <div class="min-h-screen bg-incipit-fundo overflow-hidden relative">
    <!-- Header -->    <header class="flex justify-between items-center p-x-6 py-4 rounded-b-[40px] bg-incipit-base shadow-md">
      <NuxtLink to="/" class="text-2xl text-branco font-bold hover:opacity-90 transition">
        Incipit
      </NuxtLink>      <!-- Barra de pesquisa no header - com expansão -->
      <form @submit.prevent="searchBooks" class="flex items-center justify-end transition-all duration-300" :class="(searchExpanded || searchTerm) ? 'flex-1 max-w-3xl mx-8' : ''">
        <div class="relative transition-all duration-300 ease-in-out" 
     :class="(searchExpanded || searchTerm) ? 'w-full' : 'w-72'">
  <input 
    v-model="searchTerm" 
    type="text" 
    placeholder="Pesquisar livros..." 
    @focus="searchExpanded = true"
    @blur="searchExpanded = false"
    class="w-full pl-4 pr-12 py-2.5 rounded-full bg-branco text-texto placeholder-texto/60 border-none outline-none focus:ring-2 focus:ring-roxo/50 transition-all duration-300"
  />
  <button 
    type="submit" 
    :disabled="loading"
    class="absolute right-1 top-1/2 -translate-y-1/2 bg-roxo text-branco w-9 h-9 rounded-full hover:brightness-90 transition disabled:opacity-50 flex items-center justify-center shadow-md"
  >
    <div class="i-mdi:magnify text-xl" :class="loading ? 'animate-pulse' : ''"></div>
  </button>
</div>
      </form>

      <div class="flex items-center space-x-4 ml-4">
        <div class="i-mdi:account-circle text-branco text-3xl cursor-pointer"></div>
        <div class="i-mdi:menu text-branco text-2xl cursor-pointer"></div>
      </div>
    </header>

    <!-- Botão voltar (se vier de uma lista) -->
    <div v-if="listaEspecifica" class="p-6">
      <button 
        @click="$router.push(`/lista/${listaEspecifica}`)"
        class="flex items-center space-x-2 bg-incipit-card text-texto px-4 py-2 rounded-full hover:brightness-95 transition"
      >
        <div class="i-mdi:arrow-left"></div>
        <span>Voltar para a Lista</span>
      </button>
    </div>

    <!-- Main Content -->
    <main class="relative z-10 p-6">
      <!-- Título e contador de resultados -->
      <div class="max-w-screen-xl mx-auto mb-6">        <div v-if="results.length > 0" class="text-center mb-6">
          <!-- Contador de resultados -->
          <h2 class="text-3xl text-texto mb-4">
            <span class="font-bold">{{ results.length }} resultados</span> para
          </h2>
          
          <!-- Filtros superiores -->
          <div class="flex items-center justify-center gap-3 mb-3">
            <span class="text-texto text-sm">Pesquisar por:</span>
            <div class="inline-flex bg-incipit-card rounded-lg p-1 gap-1">
              <button 
                @click="searchType = 'livros'"
                :class="searchType === 'livros' ? 'bg-branco text-texto shadow-sm' : 'text-texto/60 hover:text-texto'"
                class="px-4 py-1.5 rounded-md text-sm transition-all font-medium"
              >
                Livros
              </button>
              <button 
                @click="searchType = 'comunidades'"
                :class="searchType === 'comunidades' ? 'bg-branco text-texto shadow-sm' : 'text-texto/60 hover:text-texto'"
                class="px-4 py-1.5 rounded-md text-sm transition-all font-medium"
              >
                Comunidades
              </button>
            </div>
          </div>

          <!-- Filtros de ordenação -->
          <div class="flex items-center justify-center gap-2 text-sm">
            <!-- Dropdown Data -->
            <div class="relative inline-block">
              <button 
                class="flex items-center gap-1 px-4 py-1.5 rounded-lg border border-texto/20 bg-branco text-texto hover:border-roxo/50 transition"
              >
                <span>Data</span>
                <div class="i-mdi:chevron-down text-sm"></div>
              </button>
            </div>

            <!-- Dropdown Nota -->
            <div class="relative inline-block">
              <button 
                class="flex items-center gap-1 px-4 py-1.5 rounded-lg border border-texto/20 bg-branco text-texto hover:border-roxo/50 transition"
              >
                <span>Nota</span>
                <div class="i-mdi:chevron-down text-sm"></div>
              </button>
            </div>

            <!-- Botão Aplicar filtros -->
            <button class="bg-roxo text-branco px-5 py-1.5 rounded-full hover:brightness-90 transition font-medium">
              Aplicar filtros
            </button>
          </div>
        </div>

        <!-- Estado de loading -->
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin i-mdi:loading text-4xl text-roxo"></div>
          <p class="text-texto mt-4">Buscando livros...</p>
        </div>

        <!-- Mensagem de erro -->
        <div v-if="error && !loading" class="text-center py-12">
          <div class="i-mdi:alert-circle text-4xl text-red-500 mb-4"></div>
          <p class="text-red-500">{{ error }}</p>
        </div>

        <!-- Estado inicial (sem busca) -->
        <div v-if="!loading && !error && results.length === 0 && !searchTerm" class="text-center py-12">
          <div class="i-mdi:book-search text-6xl text-texto/30 mb-4"></div>
          <h3 class="text-2xl text-texto mb-2">Pesquise por livros</h3>
          <p class="text-texto/60">Digite o nome de um livro na barra de pesquisa acima</p>
        </div>

        <!-- Grid de resultados -->
        <div 
          v-if="!loading && results.length > 0" 
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
        >
          <div 
            v-for="item in results" 
            :key="item.id"
            class="bg-incipit-card rounded-[20px] overflow-hidden shadow-lg hover:shadow-xl transition group cursor-pointer"
          >
            <!-- Capa do livro -->
            <div class="relative aspect-[2/3] bg-incipit-base overflow-hidden">
              <img 
                v-if="item.volumeInfo.imageLinks?.thumbnail"
                :src="item.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:')" 
                :alt="item.volumeInfo.title"
                class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div 
                v-else
                class="w-full h-full flex items-center justify-center bg-incipit-base"
              >
                <div class="i-mdi:book text-6xl text-texto/30"></div>
              </div>
              
              <!-- Overlay com botões -->
              <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center space-y-2 p-4">
                <button 
                  @click="salvarLivroNoBanco(item)" 
                  :disabled="saveStatus[item.id]==='salvando' || saveStatus[item.id]==='salvo'"
                  class="bg-roxo text-branco px-4 py-2 rounded-full text-sm hover:brightness-90 transition disabled:opacity-50 w-full"
                >
                  <span v-if="saveStatus[item.id]==='salvando'">Salvando...</span>
                  <span v-else-if="saveStatus[item.id]==='salvo'">✓ Salvo</span>
                  <span v-else-if="saveStatus[item.id]==='erro'">Erro</span>
                  <span v-else>Salvar</span>
                </button>
                
                <button 
                  v-if="$pb.authStore.isValid" 
                  @click="abrirModalListas(item)"
                  class="bg-branco text-texto px-4 py-2 rounded-full text-sm hover:brightness-90 transition w-full"
                >
                  + Lista
                </button>
              </div>
            </div>

            <!-- Info do livro -->
            <div class="p-3">
              <p class="text-xs text-texto/70 mb-1">
                <span v-if="item.volumeInfo.authors">
                  Autor: {{ item.volumeInfo.authors[0] }}
                  <span v-if="item.volumeInfo.authors.length > 1">...</span>
                </span>
                <span v-else>Editora</span>
              </p>
              <h3 class="text-sm font-medium text-texto line-clamp-2" :title="item.volumeInfo.title">
                {{ item.volumeInfo.title }}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal para selecionar lista -->
    <div 
      v-if="mostrarModalListas" 
      @click="mostrarModalListas = false"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div 
        @click.stop
        class="bg-incipit-card rounded-[30px] shadow-2xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto"
      >
        <h3 class="text-2xl font-bold text-texto mb-2">Adicionar à Lista</h3>
        <p class="text-texto/70 mb-6">
          Selecione uma lista para adicionar 
          <span class="font-medium">"{{ livroSelecionado?.volumeInfo?.title }}"</span>:
        </p>
        
        <div class="space-y-3">
          <button 
            v-for="lista in minhasListas" 
            :key="lista.id"
            @click="adicionarLivroALista(lista.id)"
            class="w-full bg-incipit-base hover:bg-roxo hover:text-branco text-texto px-4 py-3 rounded-lg transition flex items-center justify-between"
          >
            <span class="font-medium">{{ lista.nome }}</span>
            <span class="text-sm opacity-70">({{ lista.livros?.length || 0 }} livros)</span>
          </button>
        </div>
        
        <button 
          @click="mostrarModalListas = false"
          class="w-full mt-6 bg-texto/10 text-texto px-4 py-3 rounded-lg hover:bg-texto/20 transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Truncar texto em múltiplas linhas */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Animação de loading */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Animação de pulse para o ícone de busca durante loading */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Transição suave para expansão do campo de busca */
input:focus {
  box-shadow: 0 0 0 3px rgba(166, 141, 173, 0.1);
}

/* Melhorar aparência dos botões de filtro */
button {
  font-family: inherit;
}
</style>
