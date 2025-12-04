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

const { buscarListaPorId, removerLivroDaLista } = useListas();
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
            </div>

            <div class="flex items-end">
              <button
                v-if="podeEditar"
                @click="$router.push('/searchteste?lista=' + lista.id)"
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
    </main>
  </div>
</template>
