<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useLivros } from '~/composables/useLivros';
import { useListas } from '~/composables/useListas';
import { useSearch } from '~/composables/useSearch';

const { $pb } = useNuxtApp();
const route = useRoute();

const searchTerm = ref('');
const results = ref([]);
const loading = ref(false);
const error = ref('');
const saveStatus = ref({}); 
const minhasListas = ref([]);
const mostrarModalListas = ref(false);
const livroSelecionado = ref(null);
const listaEspecifica = ref(null); // Para quando vier de uma lista específica
const searchType = ref('livros'); // 'livros'
const sortBy = ref('relevancia'); // 'relevancia', 'data', 'nota'

// Infinite scroll
const startIndex = ref(0);
const maxResults = ref(20); // Quantidade de livros por página
const totalItems = ref(0);
const loadingMore = ref(false);
const hasMore = ref(true);

// Composables
const { salvarLivro } = useLivros();
const { buscarListasUsuario, adicionarLivroNaLista } = useListas();
const { buscarLivros, prepararDadosLivro } = useSearch();


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

  // Adicionar listener para infinite scroll
  window.addEventListener('scroll', handleScroll);
});

// Remover listener ao desmontar componente
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

// Detectar quando usuário chega ao final da página
function handleScroll() {
  const scrollPosition = window.innerHeight + window.scrollY;
  const pageHeight = document.documentElement.scrollHeight;
  
  // Se chegou a 80% do final da página e não está carregando
  if (scrollPosition >= pageHeight * 0.8 && !loadingMore.value && hasMore.value && results.value.length > 0) {
    loadMoreBooks();
  }
}


async function searchBooks() {
  error.value = '';
  results.value = [];
  startIndex.value = 0;
  hasMore.value = true;
  
  if (!searchTerm.value.trim()) return;
  loading.value = true;
  
  try {
    const resultado = await buscarLivros(
      searchTerm.value, 
      startIndex.value, 
      maxResults.value
    );
    
    if (resultado.sucesso) {
      results.value = resultado.dados;
      totalItems.value = resultado.totalItems || 0;
      startIndex.value = maxResults.value;
      
      // Verifica se há mais resultados
      hasMore.value = results.value.length < totalItems.value;
    } else {
      error.value = resultado.erro || 'Nenhum livro encontrado.';
      hasMore.value = false;
    }
  } catch (e) {
    console.error('Erro ao buscar livros:', e);
    error.value = 'Erro ao buscar livros.';
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
}

async function loadMoreBooks() {
  if (loadingMore.value || !hasMore.value) return;
  
  loadingMore.value = true;
  
  try {
    const resultado = await buscarLivros(
      searchTerm.value,
      startIndex.value,
      maxResults.value
    );
    
    if (resultado.sucesso && resultado.dados.length > 0) {
      results.value = [...results.value, ...resultado.dados];
      startIndex.value += resultado.dados.length;
      
      // Verifica se há mais resultados
      hasMore.value = results.value.length < totalItems.value;
    } else {
      hasMore.value = false;
    }
  } catch (e) {
    console.error('Erro ao carregar mais livros:', e);
    hasMore.value = false;
  } finally {
    loadingMore.value = false;
  }
}

async function salvarLivroNoBanco(item) {
  const id = item.id;
  saveStatus.value[id] = 'salvando';

  // Usar composable para preparar dados
  const dadosLivro = prepararDadosLivro(item);

  if (!dadosLivro) {
    saveStatus.value[id] = 'erro';
    console.log('Erro: Nome ou ISBN não encontrados');
    return { sucesso: false, erro: 'Nome ou ISBN não encontrados' };
  }

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

// Nova função: salva o livro e redireciona para página de detalhes
async function verDetalhesLivro(item) {
  console.log('Clicou no livro:', item.volumeInfo.title);
  
  // Salva o livro no banco primeiro
  const resultado = await salvarLivroNoBanco(item);
  
  console.log('Resultado do salvamento:', resultado);
  
  if (resultado.sucesso) {
    // Extrai o ISBN para usar na URL
    const dadosLivro = prepararDadosLivro(item);
    console.log('Dados do livro preparados:', dadosLivro);
    
    if (dadosLivro && dadosLivro.ISBN) {
      // Redireciona para a página de detalhes
      console.log('Redirecionando para:', `/livro/${dadosLivro.ISBN}`);
      navigateTo(`/livro/${dadosLivro.ISBN}`);
    } else {
      alert('ISBN não encontrado para este livro.');
    }
  } else {
    alert('Erro ao salvar livro: ' + resultado.erro);
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
    <!-- Header Component -->
    <Header
      :show-search="true"
      :expandable="true"
      :loading="loading"
      v-model:search-term="searchTerm"
      @search="searchBooks"
      variant="search"
    />

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
            <span class="font-bold">{{ results.length }}</span>
            <span v-if="totalItems > 0" class="text-texto/70"> de {{ totalItems }}</span>
            <span class="font-normal"> resultados para</span>
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
        >          <div 
            v-for="item in results" 
            :key="item.id"
            @click="verDetalhesLivro(item)"
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
            </div>            <!-- Info do livro -->
            <div class="p-3">
              <p class="text-xs text-texto/70 mb-1">
                <span v-if="item.volumeInfo.authors">
                  Autor: {{ item.volumeInfo.authors[0] }}
                  <span v-if="item.volumeInfo.authors.length > 1">...</span>
                </span>
                <span v-else>Editora</span>
              </p>
              <h3 
                class="text-sm font-medium text-texto line-clamp-2" 
                :title="item.volumeInfo.title"
              >
                {{ item.volumeInfo.title }}
              </h3>
            </div>
          </div>
        </div>

        <!-- Indicador de loading para infinite scroll -->
        <div v-if="loadingMore" class="text-center py-8">
          <div class="inline-block animate-spin i-mdi:loading text-3xl text-roxo"></div>
          <p class="text-texto mt-2 text-sm">Carregando mais livros...</p>
        </div>

        <!-- Mensagem de fim dos resultados -->
        <div v-if="!hasMore && results.length > 0 && !loading" class="text-center py-8">
          <div class="i-mdi:check-circle text-3xl text-roxo/60 mb-2"></div>
          <p class="text-texto/60 text-sm">Todos os resultados foram carregados</p>
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

<style src="~/styles/pages/search.css"></style>

