<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useLivros } from "~/composables/useLivros";
import { useListas } from "~/composables/useListas";
import { useSearch } from "~/composables/useSearch";

const { $pb } = useNuxtApp();
const route = useRoute();
const router = useRouter();

const searchTerm = ref("");
const results = ref([]);
const todosOsResultados = ref([]); 
const loading = ref(false);
const error = ref("");
const saveStatus = ref({});
const minhasListas = ref([]);
const mostrarModalListas = ref(false);
const mostrarModalFiltros = ref(false);
const livroSelecionado = ref(null);
const listaEspecifica = ref(null);
const searchType = ref("livros");
const filtroAtivo = ref(""); 
const ordenacaoData = ref("desc"); 
const ordenacaoNota = ref("desc");
const mostrandoRecomendados = ref(false);

// Filtros avançados
const generosSelecionados = ref([]);
const tagsSelecionadas = ref([]);
const generosDisponiveis = ref([]);
const tagsDisponiveis = ref([]); 

// Infinite scroll
const startIndex = ref(0);
const maxResults = ref(20);
const totalItems = ref(0);
const loadingMore = ref(false);
const hasMore = ref(true);

// Composables
const { salvarLivro } = useLivros();
const { buscarListasUsuario, adicionarLivroNaLista } = useListas();
const { buscarLivros, buscarLivroPorISBN, prepararDadosLivro } = useSearch();

// Watch para aplicar ordenação automaticamente
watch([filtroAtivo, ordenacaoData, ordenacaoNota], () => {
  if (results.value.length > 0) {
    aplicarOrdenacao();
  }
});

// Watch para sincronizar o termo de busca com a URL
watch(
  () => route.query.q,
  (newQ) => {
    if (newQ !== searchTerm.value) {
      searchTerm.value = newQ || "";
    }
    if (newQ && !loading.value) {
      searchBooks(false);
    } else if (!newQ && !loading.value) {
      // Se não há busca, carregar livros recomendados
      carregarLivrosRecomendados();
    }
  },
  { immediate: true }
);

// Watch para garantir que ao digitar o URL reflita o estado
let updateTimeout = null;
watch(searchTerm, (newTerm) => {
  clearTimeout(updateTimeout);
  
  if (route.query.q !== newTerm) {
    updateTimeout = setTimeout(() => {
      router.replace({ query: { ...route.query, q: newTerm || undefined } });
    }, 300);
  }
});

onMounted(async () => {
  if (route.query.lista) {
    listaEspecifica.value = route.query.lista;
  }

  if ($pb.authStore.isValid) {
    const resultado = await buscarListasUsuario($pb.authStore.model.id);
    if (resultado.sucesso) {
      minhasListas.value = resultado.dados;
    }
  }

  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});

// Carregar livros recentes do banco de dados
async function carregarLivrosRecomendados() {
  loading.value = true;
  mostrandoRecomendados.value = true;
  error.value = "";
  results.value = [];
  todosOsResultados.value = [];
  
  try {
    // Buscar livros mais recentes do banco de dados
    const livrosPB = await $pb.collection('livro').getList(1, 28, {
      sort: '-created', // Mais recentes primeiro
      expand: 'tags',
    });

    if (livrosPB.items.length === 0) {
      error.value = "Nenhum livro disponível no momento.";
      loading.value = false;
      return;
    }

    // Converter livros do PocketBase para o formato do Google Books
    const livrosConvertidos = await Promise.all(
      livrosPB.items.map(async (livro) => {
        // Buscar dados completos da API do Google Books usando ISBN
        try {
          const resultado = await buscarLivroPorISBN(livro.ISBN);
          if (resultado.sucesso && resultado.dados.length > 0) {
            const livroGoogle = resultado.dados[0];
            // Adicionar tags do PocketBase
            livroGoogle.tagsNomes = livro.expand?.tags?.map(t => t.nome) || [];
            return livroGoogle;
          }
        } catch (e) {
          console.error(`Erro ao buscar livro ${livro.ISBN}:`, e);
        }
        
        // Fallback: criar objeto básico se não encontrar na API
        return {
          id: livro.id,
          volumeInfo: {
            title: livro.Nome,
            authors: ['Autor desconhecido'],
            imageLinks: {
              thumbnail: '/placeholder-book.jpg'
            },
            industryIdentifiers: [{ type: 'ISBN_13', identifier: livro.ISBN }]
          },
          tagsNomes: livro.expand?.tags?.map(t => t.nome) || []
        };
      })
    );

    // Filtrar livros válidos
    const livrosValidos = livrosConvertidos.filter(l => l !== null && l !== undefined);
    
    todosOsResultados.value = livrosValidos;
    results.value = livrosValidos;
    
    atualizarFiltrosDisponiveis();
    hasMore.value = false;
    
  } catch (e) {
    console.error("Erro ao carregar livros recentes:", e);
    error.value = "Erro ao carregar livros recentes.";
  } finally {
    loading.value = false;
  }
}

// Função de enriquecimento com tags
async function enriquecerResultadosComTags(livrosGoogle) {
  const isbns = livrosGoogle
    .map((item) => {
      const ids = item.volumeInfo.industryIdentifiers || [];
      return ids.find(id => id.type === "ISBN_13")?.identifier || 
             ids.find(id => id.type === "ISBN_10")?.identifier;
    })
    .filter(isbn => isbn); 

  if (isbns.length === 0) return livrosGoogle;

  try {
    const filtro = isbns.map(isbn => `ISBN="${isbn}"`).join(" || ");
    const livrosPB = await $pb.collection('livro').getList(1, 50, {
      filter: filtro,
      expand: 'tags', 
      fields: 'ISBN,expand.tags.nome'
    });

    const mapaTags = {};
    livrosPB.items.forEach(livro => {
      const tagsObjs = livro.expand?.tags || [];
      mapaTags[livro.ISBN] = tagsObjs.map(t => t.nome);
    });

    livrosGoogle.forEach(item => {
      const ids = item.volumeInfo.industryIdentifiers || [];
      const isbn = ids.find(id => id.type === "ISBN_13")?.identifier || 
                   ids.find(id => id.type === "ISBN_10")?.identifier;
      
      item.tagsNomes = mapaTags[isbn] || [];
    });

  } catch (err) {
    console.error("Erro ao buscar tags para os resultados:", err);
  }
}

function atualizarFiltrosDisponiveis() {
  const generosSet = new Set();
  const tagsSet = new Set();
  
  todosOsResultados.value.forEach((livro) => {
    const categorias = livro.volumeInfo?.categories;
    if (categorias && Array.isArray(categorias)) {
      categorias.forEach((cat) => generosSet.add(cat));
    }

    const tags = livro.tagsNomes; 
    if (tags && Array.isArray(tags)) {
      tags.forEach((tag) => tagsSet.add(tag));
    }
  });

  generosDisponiveis.value = Array.from(generosSet).sort();
  tagsDisponiveis.value = Array.from(tagsSet).sort();
}

function aplicarFiltrosAvancados() {
  mostrarModalFiltros.value = false;

  if (generosSelecionados.value.length === 0 && tagsSelecionadas.value.length === 0) {
    results.value = [...todosOsResultados.value];
    aplicarOrdenacao();
    return;
  }

  loading.value = true;

  try {
    const filtrados = todosOsResultados.value.filter((item) => {
      const categoriasGoogle = item.volumeInfo.categories || [];
      const passaGenero = generosSelecionados.value.length === 0 || 
        generosSelecionados.value.some(g => categoriasGoogle.includes(g));

      const tagsLivro = item.tagsNomes || []; 
      const passaTag = tagsSelecionadas.value.length === 0 ||
        tagsSelecionadas.value.some(t => tagsLivro.includes(t));

      return passaGenero && passaTag;
    });

    results.value = filtrados;
    aplicarOrdenacao();
    
  } catch (error) {
    console.error("Erro ao aplicar filtros:", error);
  } finally {
    loading.value = false;
  }
}

function limparFiltrosAvancados() {
  generosSelecionados.value = [];
  tagsSelecionadas.value = [];
  results.value = [...todosOsResultados.value];
  aplicarOrdenacao();
}

// Busca de livros
async function searchBooks(updateUrl = true) {
  error.value = "";
  results.value = [];
  todosOsResultados.value = [];
  startIndex.value = 0;
  hasMore.value = true;
  filtroAtivo.value = "";
  generosSelecionados.value = [];
  tagsSelecionadas.value = [];
  mostrandoRecomendados.value = false;

  const currentTerm = searchTerm.value.trim();
  if (!currentTerm) {
    // Se não há termo, carregar recomendados
    await carregarLivrosRecomendados();
    return;
  }

  if (updateUrl && route.query.q !== currentTerm) {
    router.push({ query: { ...route.query, q: currentTerm } });
    return; 
  }

  loading.value = true;

  try {
    const resultado = await buscarLivros(
      currentTerm,
      startIndex.value,
      maxResults.value
    );

    if (resultado.sucesso) {
      const novosLivros = resultado.dados;
      await enriquecerResultadosComTags(novosLivros);
      todosOsResultados.value = novosLivros;
      results.value = novosLivros;
      
      atualizarFiltrosDisponiveis();

      totalItems.value = resultado.totalItems || 0;
      startIndex.value = maxResults.value;
      hasMore.value = todosOsResultados.value.length < totalItems.value;
    } else {
      error.value = resultado.erro || "Nenhum livro encontrado.";
      hasMore.value = false;
    }
  } catch (e) {
    console.error("Erro ao buscar livros:", e);
    error.value = "Erro ao buscar livros.";
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
}

async function loadMoreBooks() {
  if (loadingMore.value || !hasMore.value || mostrandoRecomendados.value) return;

  loadingMore.value = true;

  try {
    const resultado = await buscarLivros(
      searchTerm.value,
      startIndex.value,
      maxResults.value
    );

    if (resultado.sucesso && resultado.dados.length > 0) {
      const novosLivros = resultado.dados;
      await enriquecerResultadosComTags(novosLivros);
      todosOsResultados.value = [...todosOsResultados.value, ...novosLivros];
      
      atualizarFiltrosDisponiveis();
      
      if (generosSelecionados.value.length > 0 || tagsSelecionadas.value.length > 0) {
        aplicarFiltrosAvancados();
      } else {
        results.value = [...results.value, ...novosLivros];
        aplicarOrdenacao();
      }

      startIndex.value += novosLivros.length;
      hasMore.value = todosOsResultados.value.length < totalItems.value;
    } else {
      hasMore.value = false;
    }
  } catch (e) {
    console.error("Erro ao carregar mais livros:", e);
    hasMore.value = false;
  } finally {
    loadingMore.value = false;
  }
}

function handleScroll() {
  const scrollPosition = window.innerHeight + window.scrollY;
  const pageHeight = document.documentElement.scrollHeight;

  if (
    scrollPosition >= pageHeight * 0.8 &&
    !loadingMore.value &&
    hasMore.value &&
    todosOsResultados.value.length > 0 &&
    !mostrandoRecomendados.value
  ) {
    loadMoreBooks();
  }
}

// Ordenação
function toggleFiltroData() {
  if (filtroAtivo.value === "data") {
    ordenacaoData.value = ordenacaoData.value === "desc" ? "asc" : "desc";
  } else {
    filtroAtivo.value = "data";
    ordenacaoData.value = "desc";
  }
}

function toggleFiltroNota() {
  if (filtroAtivo.value === "nota") {
    ordenacaoNota.value = ordenacaoNota.value === "desc" ? "asc" : "desc";
  } else {
    filtroAtivo.value = "nota";
    ordenacaoNota.value = "desc";
  }
}

function abrirModalFiltros() {
  mostrarModalFiltros.value = true;
}

function toggleGenero(genero) {
  const index = generosSelecionados.value.indexOf(genero);
  if (index > -1) {
    generosSelecionados.value.splice(index, 1);
  } else {
    generosSelecionados.value.push(genero);
  }
}

function toggleTag(tag) {
  const index = tagsSelecionadas.value.indexOf(tag);
  if (index > -1) {
    tagsSelecionadas.value.splice(index, 1);
  } else {
    tagsSelecionadas.value.push(tag);
  }
}

async function aplicarOrdenacao() {
  if (results.value.length === 0) return;

  let resultadosOrdenados = [...results.value];

  if (filtroAtivo.value === "nota") {
    resultadosOrdenados.sort((a, b) => {
      const notaA = a.volumeInfo.averageRating || 0;
      const notaB = b.volumeInfo.averageRating || 0;
      return ordenacaoNota.value === "desc" ? notaB - notaA : notaA - notaB;
    });
  }

  if (filtroAtivo.value === "data") {
    resultadosOrdenados.sort((a, b) => {
      const dataA = a.volumeInfo.publishedDate || (ordenacaoData.value === "desc" ? "0000" : "9999");
      const dataB = b.volumeInfo.publishedDate || (ordenacaoData.value === "desc" ? "0000" : "9999");
      return ordenacaoData.value === "desc" ? dataB.localeCompare(dataA) : dataA.localeCompare(dataB);
    });
  }

  results.value = resultadosOrdenados;
}

// Funções de salvamento e lista
async function salvarLivroNoBanco(item) {
  const id = item.id;
  saveStatus.value[id] = "salvando";
  const dadosLivro = prepararDadosLivro(item);
  if (!dadosLivro) {
    saveStatus.value[id] = "erro";
    return { sucesso: false, erro: "Nome ou ISBN não encontrados" };
  }
  const resultado = await salvarLivro(dadosLivro);
  if (resultado.sucesso) {
    saveStatus.value[id] = "salvo";
    return resultado;
  } else {
    saveStatus.value[id] = "erro";
    return resultado;
  }
}

async function verDetalhesLivro(item) {
  const resultado = await salvarLivroNoBanco(item);
  if (resultado.sucesso) {
    const dadosLivro = prepararDadosLivro(item);
    if (dadosLivro && dadosLivro.ISBN) {
      navigateTo(`/livro/${dadosLivro.ISBN}`);
    } else {
      alert("ISBN não encontrado para este livro.");
    }
  } else {
    alert("Erro ao salvar livro: " + resultado.erro);
  }
}

function abrirModalListas(item) {
  if (!$pb.authStore.isValid) {
    alert("Você precisa estar logado!");
    return;
  }
  livroSelecionado.value = item;
  if (listaEspecifica.value) {
    adicionarLivroALista(listaEspecifica.value);
  } else {
    mostrarModalListas.value = true;
  }
}

async function adicionarLivroALista(listaId) {
  if (!livroSelecionado.value) return;
  const item = livroSelecionado.value;
  try {
    const resultadoSalvar = await salvarLivroNoBanco(item);
    if (!resultadoSalvar.sucesso) {
      alert("Erro ao salvar livro.");
      return;
    }
    const livroNoBanco = resultadoSalvar.dados;
    const resultado = await adicionarLivroNaLista(listaId, livroNoBanco.id);
    if (resultado.sucesso) {
      alert("Adicionado com sucesso!");
      mostrarModalListas.value = false;
      livroSelecionado.value = null;
    } else {
      alert("Erro ao adicionar: " + resultado.erro);
    }
  } catch (error) {
    alert("Erro: " + error.message);
  }
}
</script>

<template>
  <div class="min-h-screen bg-incipit-fundo overflow-hidden relative font-sono">
    <Header
      :show-search="true"
      :expandable="true"
      :loading="loading"
      v-model:search-term="searchTerm"
      @search="searchBooks"
      variant="search"
    />

    <div v-if="listaEspecifica" class="p-6">
      <button @click="$router.push(`/lista/${listaEspecifica}`)" class="flex items-center space-x-2 bg-incipit-card text-texto px-4 py-2 rounded-full hover:brightness-95 transition">
        <div class="i-mdi:arrow-left"></div>
        <span>Voltar para a Lista</span>
      </button>
    </div>

    <main class="relative z-10 p-6">
      <div class="max-w-screen-xl mx-auto mb-6">
        <div v-if="results.length > 0 || todosOsResultados.length > 0" class="text-center mb-6">
          <h2 class="text-3xl text-texto mb-4">
            <span v-if="mostrandoRecomendados">
              <span class="font-bold">Livros Recentes</span>
              <span class="font-display"> - Adicionados recentemente</span>
            </span>
            <span v-else>
              <span class="font-bold">{{ results.length }}</span>
              <span class="font-display"> resultados para </span>
              <span class="font-display text-roxo">"{{ searchTerm }}"</span>
            </span>
          </h2>          <!-- Filtros superiores -->
          <div class="flex items-center justify-center gap-3 mb-3">
            <span class="text-texto text-sm">Pesquisar por:</span>
              <button 
                class="inline-flex bg-incipit-card rounded-lg p-1 gap-1 border-0 font-sono font-bold text-texto"
                @click="searchType = 'livros'"
              >
                Livros
              </button>

              <button 
                class="inline-flex bg-incipit-card rounded-lg p-1 gap-1 border-0 font-sono text-texto"
                @click="navigateTo('/comunidades')"
              >
                Comunidades
              </button>

              <button 
                class="inline-flex bg-incipit-card rounded-lg p-1 gap-1 border-0 font-sono text-texto"
                @click="navigateTo('/listas')"
              >
                Listas
              </button>
            </div>
            

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
              class="flex items-center gap-1 px-3 py-1.5 font-sono rounded-full border-0 transition-all"
              :class="filtroAtivo === 'nota' ? 'bg-roxo text-branco font-bold' : 'bg-incipit-card text-texto hover:bg-incipit-base'"
              @click="toggleFiltroNota"
            >
              <span>Nota</span>
              <div v-if="filtroAtivo === 'nota'" class="text-base transition-transform" :class="ordenacaoNota === 'desc' ? 'i-mdi:arrow-down' : 'i-mdi:arrow-up'"></div>
              <div v-else class="i-mdi:unfold-more-horizontal text-base"></div>
            </button>

            <button
              class="flex items-center gap-1 px-3 py-1.5 font-sono rounded-full border-0 bg-roxo text-branco font-bold hover:brightness-110 transition-all"
              @click="abrirModalFiltros"
            >
              <div class="i-mdi:filter-variant text-base"></div>
              <span>Filtros</span>
              <span v-if="generosSelecionados.length > 0 || tagsSelecionadas.length > 0" class="ml-1 px-1.5 py-0.5 bg-branco text-roxo rounded-full text-xs font-bold">
                {{ generosSelecionados.length + tagsSelecionadas.length }}
              </span>
            </button>
          </div>
        </div>

        <div v-if="loading && results.length === 0" class="text-center py-12">
          <div class="inline-block animate-spin i-mdi:loading text-4xl text-roxo"></div>
          <p class="text-texto mt-4">{{ mostrandoRecomendados ? 'Carregando livros recentes...' : 'Buscando livros...' }}</p>
        </div>

        <div v-if="error && !loading" class="text-center py-12">
          <p class="text-red-500">{{ error }}</p>
        </div>

        <div v-if="!loading && results.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6">
          <div
            v-for="item in results"
            :key="item.id"
            @click="verDetalhesLivro(item)"
            class="bg-incipit-card rounded-[20px] overflow-hidden shadow-lg hover:shadow-xl transition group cursor-pointer relative"
          >
            <div v-if="item.tagsNomes && item.tagsNomes.length > 0" class="absolute top-2 right-2 z-10">
               <div class="bg-roxo text-branco text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                 <div class="i-mdi:tag-multiple text-xs"></div>
                 {{ item.tagsNomes.length }}
               </div>
            </div>

            <div class="relative aspect-[2/3] bg-incipit-base overflow-hidden">
              <img
                v-if="item.volumeInfo.imageLinks?.thumbnail"
                :src="item.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:')"
                :alt="item.volumeInfo.title"
                class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-incipit-base">
                <div class="i-mdi:book text-6xl text-texto"></div>
              </div>
            </div>
            <div class="px-3 text-center">
              <p class="text-xs text-roxo mb-1 font-bold">
                <span v-if="item.volumeInfo.authors">{{ item.volumeInfo.authors[0] }}...</span>
                <span v-else>Autor desconhecido</span>
              </p>
              <h3 class="text-sm font-bold text-texto line-clamp-2" :title="item.volumeInfo.title">{{ item.volumeInfo.title }}</h3>
            </div>
          </div>
        </div>

        <div v-if="loadingMore" class="text-center py-8">
          <div class="inline-block animate-spin i-mdi:loading text-3xl text-roxo"></div>
        </div>
      </div>
    </main>

    <div v-if="mostrarModalFiltros" @click="mostrarModalFiltros = false" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div @click.stop class="bg-incipit-card rounded-[30px] shadow-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-display mt-0 text-texto">Filtros Avançados</h3>
          <button @click="mostrarModalFiltros = false" class="flex-shrink-0 w-10 h-10 bg-roxo/50 text-texto/50 rounded-full flex items-center justify-center shadow-md hover:bg-roxo/60 hover:scale-110 transition border-0 cursor-pointer">
            <div class="i-mdi:close text-2xl"></div>
          </button>
        </div>

        <div class="mb-6">
          <h4 class="text-lg font-bold text-texto mb-3 flex items-center gap-2">
            <div class="i-mdi:bookshelf"></div>
            Gêneros
          </h4>
          <div class="flex flex-wrap gap-3">
            <button
              v-for="genero in generosDisponiveis"
              :key="genero"
              @click="toggleGenero(genero)"
              class="px-3 py-1 rounded-full text-sm transition-all shadow-l border-0 hover:scale-110 transition"
              :class="generosSelecionados.includes(genero) ? 'bg-roxo text-branco font-bold' : 'bg-incipit-base text-texto hover:bg-incipit-base/80'"
            >
              {{ genero }}
            </button>
          </div>
          <p v-if="generosDisponiveis.length === 0" class="text-texto/50 text-sm italic">Nenhum gênero disponível.</p>
        </div>

        <div class="mb-6">
          <h4 class="text-lg font-bold text-texto mb-3 flex items-center gap-2">
            <div class="i-mdi:tag-multiple"></div>
            Tags
          </h4>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in tagsDisponiveis"
              :key="tag"
              @click="toggleTag(tag)"
              class="px-3 py-1 rounded-full text-sm transition-all shadow-l border-0 hover:scale-110 transition"
              :class="tagsSelecionadas.includes(tag) ? 'bg-roxo text-branco font-bold' : 'bg-incipit-base text-texto hover:bg-incipit-base/80'"
            >
              {{ tag }}
            </button>
          </div>
          <p v-if="tagsDisponiveis.length === 0" class="text-texto/50 text-sm italic">
            Nenhuma tag encontrada nos livros pesquisados até o momento.
          </p>
        </div>

        <div class="flex gap-3 mt-10">
          <button @click="limparFiltrosAvancados" class="flex-1 botao bg-vermelho rounded-full text-sm transition-all shadow-l border-0 hover:scale-105 transition">Limpar Filtros</button>
          <button @click="aplicarFiltrosAvancados" class="flex-1 botao rounded-full text-sm transition-all shadow-l border-0 hover:scale-105 transition">Aplicar Filtros</button>
        </div>
      </div>
    </div>
  </div>
</template>