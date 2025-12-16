<script setup>
import { ref, onMounted, computed } from "vue";
import { useListas } from "~/composables/useListas";
import { useLivros } from "~/composables/useLivros";

const { $pb } = useNuxtApp();
const route = useRoute();
const router = useRouter();

const lista = ref(null);
const livros = ref([]);
const livrosComDados = ref([]);
const loading = ref(true);
const error = ref("");

// Modal de adicionar livro
const mostrarModalLivro = ref(false);
const buscaLivro = ref('');
const resultadosBusca = ref([]);
const buscandoLivros = ref(false);
const livroSelecionado = ref(null);

const { buscarListaPorId, removerLivroDaLista, adicionarLivroNaLista } = useListas();
const { buscarDadosLivroAPI } = useLivros();

onMounted(async () => {
  await carregarLista();
});

const carregarLista = async () => {
  const listaId = route.params.id;

  if (!listaId) {
    error.value = "ID da lista não encontrado";
    loading.value = false;
    return;
  }

  loading.value = true;

  try {
    const resultado = await $pb.collection("listas").getOne(listaId, {
      expand: "livros,autor",
    });

    lista.value = resultado;
    livros.value = resultado.expand?.livros || [];

    console.log("Lista carregada:", resultado);
    console.log("Livros expandidos:", resultado.expand?.livros);

    await enriquecerLivrosComAPI();
  } catch (error) {
    console.error("Erro ao carregar lista:", error);
    error.value = "Erro ao carregar a lista";
  } finally {
    loading.value = false;
  }
};

const enriquecerLivrosComAPI = async () => {
  const livrosEnriquecidos = [];

  for (const livro of livros.value) {
    console.log("Buscando dados para livro:", livro.Nome, "ISBN:", livro.ISBN);

    const dadosAPI = await buscarDadosLivroAPI(livro.ISBN);

    if (dadosAPI.sucesso) {
      livrosEnriquecidos.push({
        ...livro,
        autor: dadosAPI.dados.autor,
        capa: dadosAPI.dados.capa,
        descricao: dadosAPI.dados.descricao,
      });
    } else {
      livrosEnriquecidos.push({
        ...livro,
        autor: "Autor não informado",
        capa: "",
        descricao: "",
      });
    }
  }

  livrosComDados.value = livrosEnriquecidos;
  console.log("Livros enriquecidos:", livrosComDados.value);
};

const removerLivro = async (livroId) => {
  if (!confirm("Tem certeza que deseja remover este livro da lista?")) {
    return;
  }

  const resultado = await removerLivroDaLista(lista.value.id, livroId);

  if (resultado.sucesso) {
    await carregarLista();
  } else {
    alert("Erro ao remover livro: " + resultado.erro);
  }
};

const podeEditar = computed(() => {
  return (
    $pb.authStore.isValid && lista.value && lista.value.autor === $pb.authStore.model?.id
  );
});

const formatarData = (dataString) => {
  return new Date(dataString).toLocaleDateString("pt-BR");
};

const verDetalhesLivro = (livro) => {
  if (livro.ISBN) {
    navigateTo(`/livro/${livro.ISBN}`);
  }
};

// Buscar livros na API do Google Books
async function buscarLivrosAPI() {
  if (!buscaLivro.value.trim()) {
    resultadosBusca.value = [];
    return;
  }

  buscandoLivros.value = true;
  
  try {
    const query = encodeURIComponent(buscaLivro.value.trim());
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=10`);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      resultadosBusca.value = data.items.map(item => ({
        googleId: item.id,
        isbn: item.volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || 
              item.volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier || '',
        nome: item.volumeInfo.title || 'Título não disponível',
        autor: item.volumeInfo.authors?.join(', ') || 'Autor desconhecido',
        capa: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
        editora: item.volumeInfo.publisher || '',
        anoPublicacao: item.volumeInfo.publishedDate?.split('-')[0] || ''
      }));
    } else {
      resultadosBusca.value = [];
    }
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    alert('Erro ao buscar livros');
  } finally {
    buscandoLivros.value = false;
  }
}

// Selecionar livro e salvar no PocketBase se não existir
async function selecionarLivro(livro) {
  try {
    let livroNoBanco = null;
    
    if (livro.isbn) {
      try {
        livroNoBanco = await $pb.collection('livro').getFirstListItem(`ISBN = "${livro.isbn}"`);
      } catch (error) {
        if (error.status === 404) {
          const novoLivro = await $pb.collection('livro').create({
            ISBN: livro.isbn,
            Nome: livro.nome,
            Autor: livro.autor,
            Editora: livro.editora,
            Ano_publicacao: livro.anoPublicacao
          });
          livroNoBanco = novoLivro;
        } else {
          throw error;
        }
      }
    } else {
      const novoLivro = await $pb.collection('livro').create({
        ISBN: livro.googleId,
        Nome: livro.nome,
        Autor: livro.autor,
        Editora: livro.editora,
        Ano_publicacao: livro.anoPublicacao
      });
      livroNoBanco = novoLivro;
    }

    livroSelecionado.value = {
      ...livroNoBanco,
      capa: livro.capa
    };

  } catch (error) {
    console.error('Erro ao selecionar livro:', error);
    alert('Erro ao selecionar livro: ' + error.message);
  }
}

// Limpar seleção
function limparSelecao() {
  livroSelecionado.value = null;
}

// Adicionar livro à lista
async function adicionarLivro() {
  if (!livroSelecionado.value) {
    alert('Selecione um livro primeiro');
    return;
  }

  const resultado = await adicionarLivroNaLista(lista.value.id, livroSelecionado.value.id);
  
  if (resultado.sucesso) {
    alert('Livro adicionado à lista com sucesso!');
    mostrarModalLivro.value = false;
    livroSelecionado.value = null;
    buscaLivro.value = '';
    resultadosBusca.value = [];
    await carregarLista();
  } else {
    alert('Erro: ' + resultado.erro);
  }
}
</script>

<template>
  <div class="min-h-screen bg-incipit-fundo overflow-hidden relative font-sono">
    <Header :show-search="true" />

    <main class="relative z-10 container mx-auto px-4 mt-8 max-w-6xl">
      <!-- Loading -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center min-h-[60vh] gap-4"
      >
        <div
          class="w-10 h-10 border-4 border-roxo border-t-transparent rounded-full animate-spin"
        ></div>
        <p class="text-lg animate-pulse text-texto">Carregando lista...</p>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-red-500"
      >
        <div class="i-mdi:alert-circle text-6xl"></div>
        <p class="text-xl">{{ error }}</p>
        <button
          @click="$router.push('/Criarlistas')"
          class="px-6 py-2 bg-roxo text-white rounded-full hover:opacity-90 transition"
        >
          Voltar às Minhas Listas
        </button>
      </div>

      <div v-else-if="lista" class="animate-fade-in">
                  <button
            @click="$router.go(-1)"
            class="mb-6 rounded-[50%] w-10 h-10 border-0 flex items-center justify-center bg-[rgba(166,141,173,0.2)] text-roxo hover:bg-roxo/20 transition"
            >
            <div class="i-mdi:arrow-left text-xl"></div>
            </button>
        <div class="bg-incipit-card rounded-[30px] shadow-xl p-8 mb-8">
          <div class="flex flex-col md:flex-row justify-between gap-4">
            <div class="flex-1">
              <h1
                class="text-3xl md:text-4xl font-bold text-texto mb-2 mt-0 font-display"
              >
                {{ lista.nome }}
              </h1>
              <div class="flex flex-wrap gap-3 text-sm text-texto/70 mb-4">
                <span class="flex items-center gap-1">
                  <div class="i-mdi:calendar"></div>
                  Criada em {{ formatarData(lista.created) }}
                </span>
                <span class="flex items-center gap-1">
                  <div class="i-mdi:account te"></div>
                  Por
                  <span class="text-roxo">{{
                    lista.expand?.autor?.name || "Usuário"
                  }}</span>
                </span>
                <span
                  class="flex items-center gap-1 px-2 py-1 rounded-full"
                  :class="
                    lista.publica
                      ? 'bg-green-100/50 text-green-700'
                      : 'bg-gray-100/50 text-gray-700'
                  "
                >
                  <div :class="lista.publica ? 'i-mdi:earth' : 'i-mdi:lock'"></div>
                  {{ lista.publica ? "Pública" : "Privada" }}
                </span>
              </div>
              <p v-if="lista.descricao" class="text-texto/80 leading-relaxed">
                {{ lista.descricao }}
              </p>
            </div>            <div class="flex items-end">
              <button
                v-if="podeEditar"
                @click="mostrarModalLivro = true"
                class="botao flex items-center gap-2"
              >
                <div class="i-mdi:plus"></div>
                Adicionar Livros
              </button>
            </div>
          </div>
        </div>


        <div class="mb-8">
          <div class="w-full max-w-screen-lg mb-6 sm:mb-8">
            <h2
              class="bg-incipit-card text-texto font-display text-center rounded-[30px] justify-self-start px-15 shadow-lg"
            >
              Livros na lista
              <span class="text-xl text-texto opacity-60 font-medium"
                >({{ livrosComDados.length }})</span
              >
            </h2>
          </div>


          <div
            v-if="livrosComDados.length === 0 && !loading"
            class="text-center py-12 rounded-[30px]"
          >
            <h3 class="text-xl text-texto mb-2">Esta lista está vazia</h3>
            <p class="text-texto/60 mb-4">Comece adicionando livros à sua lista</p>

          </div>

          <!-- livros -->
          <div
            v-else
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
          >
            <div
              v-for="livro in livrosComDados"
              :key="livro.id"
              class="bg-incipit-card rounded-[20px] overflow-hidden shadow-lg hover:shadow-xl transition group relative"
            >
              <button
                v-if="podeEditar"
                @click.stop="removerLivro(livro.id)"
                class="absolute top-2 right-2 z-10 w-8 h-8 bg-red-500/50 text-white rounded-full flex items-center justify-center opacity-0 border-0 group-hover:opacity-100 transition hover:bg-red-600/50"
                title="Remover da lista"
              >
                <div class="i-mdi:close text-lg"></div>
              </button>

              <!-- Card clicável -->
              <div @click="verDetalhesLivro(livro)" class="cursor-pointer">
                <!-- Capa do livro -->
                <div class="relative aspect-[2/3] bg-incipit-base overflow-hidden">
                  <img
                    v-if="livro.capa && livro.capa.trim() !== ''"
                    :src="livro.capa"
                    :alt="livro.Nome"
                    class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    @error="$event.target.style.display = 'none'"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center bg-incipit-base"
                  >
                    <div class="i-mdi:book text-6xl text-texto/30"></div>
                  </div>
                </div>

                <!-- Info do livro -->
                <div class="px-3 py-3 text-center">
                  <p class="text-xs text-roxo mb-1 font-bold">
                    {{ livro.autor || "Autor desconhecido" }}
                  </p>
                  <h3
                    class="text-sm font-bold text-texto line-clamp-2"
                    :title="livro.Nome"
                  >
                    {{ livro.Nome }}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>    <!-- Modal Selecionar Livro -->
    <div v-if="mostrarModalLivro" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-incipit-card rounded-[30px] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 class="text-2xl font-display text-texto mb-6 text-center">Adicionar Livro à Lista</h3>
        
        <!-- Campo de Busca -->
        <div class="mb-6">
          <div class="relative">
            <input 
              v-model="buscaLivro"
              @input="buscarLivrosAPI"
              type="text" 
              placeholder="Digite o nome do livro para buscar..."
              class="w-full bg-incipit-fundo rounded-xl box-border p-4 pr-12 border-none outline-none focus:ring-2 focus:ring-roxo text-texto"
            />
            <div v-if="buscandoLivros" class="absolute right-4 top-1/2 -translate-y-1/2">
              <div class="i-mdi:loading animate-spin text-2xl text-roxo"></div>
            </div>
            <div v-else class="absolute right-4 top-1/2 -translate-y-1/2">
              <div class="i-mdi:magnify text-2xl text-roxo/50"></div>
            </div>
          </div>
          <p class="text-xs mt-2 ml-2 text-texto/60">Busque por título, autor ou ISBN</p>
        </div>

        <!-- Livro Selecionado -->
        <div v-if="livroSelecionado" class="mb-6 p-4 bg-roxo/10 rounded-xl border-2 border-roxo">
          <div class="flex items-center gap-4">
            <img 
              v-if="livroSelecionado.capa" 
              :src="livroSelecionado.capa" 
              :alt="livroSelecionado.Nome"
              class="w-16 h-24 object-cover rounded-lg shadow-md"
            />
            <div class="flex-1">
              <h4 class="font-bold text-lg text-texto">{{ livroSelecionado.Nome }}</h4>
              <p class="text-sm text-texto/70">{{ livroSelecionado.Autor }}</p>
              <p class="text-xs mt-1 text-roxo font-bold">✓ Selecionado</p>
            </div>
            <button 
              @click="limparSelecao"
              class="text-red-500 hover:text-red-700 border-0 cursor-pointer bg-transparent"
            >
              <div class="i-mdi:close text-2xl"></div>
            </button>
          </div>
        </div>

        <!-- Resultados da Busca -->
        <div v-if="resultadosBusca.length > 0 && !livroSelecionado" class="mb-6 max-h-96 overflow-y-auto space-y-2">
          <p class="text-sm font-bold mb-3 text-texto">Resultados da busca:</p>
          <div 
            v-for="livro in resultadosBusca" 
            :key="livro.googleId"
            @click="selecionarLivro(livro)"
            class="flex gap-3 p-3 bg-incipit-fundo rounded-xl hover:bg-roxo/20 cursor-pointer transition"
          >
            <img 
              v-if="livro.capa" 
              :src="livro.capa" 
              :alt="livro.nome"
              class="w-12 h-16 object-cover rounded shadow-sm"
            />
            <div class="w-12 h-16 bg-incipit-base rounded flex items-center justify-center" v-else>
              <div class="i-mdi:book text-texto/40"></div>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-sm truncate text-texto">{{ livro.nome }}</h4>
              <p class="text-xs text-texto/70 truncate">{{ livro.autor }}</p>
              <p class="text-xs text-texto/50">{{ livro.anoPublicacao }}</p>
            </div>
            <div class="i-mdi:chevron-right text-2xl text-roxo/50"></div>
          </div>
        </div>

        <!-- Mensagem vazia -->
        <div v-if="buscaLivro && resultadosBusca.length === 0 && !buscandoLivros && !livroSelecionado" class="text-center py-8 text-texto/50">
          <div class="i-mdi:book-search text-5xl mb-2"></div>
          <p>Nenhum livro encontrado</p>
        </div>
        
        <!-- Botões -->
        <div class="flex gap-4 mt-6">
          <button 
            @click="mostrarModalLivro = false; limparSelecao(); buscaLivro = ''; resultadosBusca = [];" 
            class="flex-1 botao bg-vermelho cursor-pointer font-medium"
          >
            Cancelar
          </button>
          <button 
            @click="adicionarLivro" 
            :disabled="!livroSelecionado"
            class="flex-1 botao disabled:opacity-50 disabled:cursor-not-allowed border-0"
          >
            Adicionar à Lista
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
