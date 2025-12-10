<template>
  <div class="min-h-screen bg-incipit-fundo font-sono">
    <Header :show-search="true" />

    <main class="container mx-auto px-4 py-8 max-w-7xl box-border">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center min-h-[400px]">
        <div class="text-texto text-xl">Carregando perfil...</div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center min-h-[400px] gap-4"
      >
        <p class="text-vermelho text-lg">{{ error }}</p>
        <button @click="$router.push('/')" class="botao">Voltar</button>
      </div>

      <!-- usuario-->
      <div v-else-if="usuario" class="grid grid-cols-1 lg:grid-cols-[520px_1fr] gap-6">
        <div class="flex flex-col gap-6 lg:max-w-[520px]">
          <div
            class="bg-incipit-card rounded-[30px] shadow-xl pt-8 px-8 relative overflow-visible"
          >
            <div class="grid grid-cols-[200px_1fr] gap-6 mb-6">
              <div class="flex flex-col items-center">
                <div class="relative">
                  <img
                    v-if="avatarUrl"
                    :src="avatarUrl"
                    alt="Avatar do usuário"
                    class="w-48 h-48 rounded-full object-cover shadow-lg"
                  />
                  <div
                    v-else
                    class="w-48 h-48 rounded-full bg-incipit-base flex items-center justify-center text-texto/40 text-sm shadow-lg"
                  >
                    <div class="i-mdi:account"></div>
                  </div>

                  <div v-if="isProprioUsuario" class="absolute -top-1 -left-1">
                    <input
                      type="file"
                      @change="handleFileUpload"
                      accept="image/*"
                      ref="fileInput"
                      style="display: none"
                    />
                    <button
                      @click="$refs.fileInput.click()"
                      class="bg-roxo text-branco w-12 h-12 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center border-0"
                      title="Alterar Foto"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-6 h-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path
                          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                        />
                        <path
                          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex flex-col justify-start">
                <div class="flex items-center gap-3 mb-1">
                  <h1 class="text-4xl font-display text-texto leading-none">
                    {{ usuario.name || usuario.username }}
                  </h1>
                  <div
                    class="bg-roxo text-branco rounded-full px-4 py-1.5 text-sm font-bold whitespace-nowrap"
                  >
                    NV. {{ calcularNivel(usuario.XP || 0) }}
                  </div>
                </div>

                <p v-if="usuario.username" class="text-texto/70 text-lg">
                  @{{ usuario.username }}
                </p>

                <div v-if="!editandoDescricao" class="rounded-[20px] max-w-md">
                  <p class="text-texto text-base mt-0 break-all">
                    {{ usuario.Description || "Descrição vazia" }}
                  </p>
                </div>

                <div v-else class="space-y-3 max-w-md">
                  <textarea
                    v-model="novaDescricao"
                    placeholder="Escreva sua descrição..."
                    rows="3"
                    maxlength="255"
                    class="w-full px-4 py-3 rounded-lg box-border bg-incipit-base text-texto placeholder-texto/60 border-none outline-none focus:ring-2 focus:ring-roxo/50 resize-none"
                  ></textarea>
                  <div class="flex gap-2">
                    <button @click="salvarDescricao" class="botao flex-1">Salvar</button>
                    <button
                      @click="cancelarEdicaoDescricao"
                      class="bg-vermelho text-branco py-2 px-6 rounded-full border-0 hover:brightness-90 transition cursor-pointer font-medium flex-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>

                <button
                  v-if="isProprioUsuario && !editandoDescricao"
                  @click="iniciarEdicaoDescricao"
                  class="botao self-start mt-3"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>

          <div class="relative mb-8">
            <div class="bg-roxo/30 rounded-full h-8 overflow-hidden">
              <div
                class="bg-roxo h-full transition-all duration-500"
                :style="{ width: `${usuario.XP % 100}%` }"
              ></div>
            </div>
            <div class="absolute inset-0 flex items-center justify-between px-5">
              <span class="text-texto text-base text-sm font-bold"
                >NV. {{ calcularNivel(usuario.XP || 0) }}</span
              >
              <span class="text-texto text-base text-sm font-bold"
                >NV. {{ calcularNivel(usuario.XP || 0) + 1 }}</span
              >
            </div>
          </div>

          <div class="bg-incipit-card rounded-[30px] shadow-xl p-6">
            <h2 class="text-xxl mt-0 font-display text-texto mb-4 text-center">
              Conquistas
            </h2>
            <div v-if="conquistas.length > 0" class="flex flex-wrap justify-center gap-3">
              <div
                v-for="conquista in conquistas"
                :key="conquista.id"
                class="bg-roxo w-16 h-16 rounded-lg flex items-center justify-center text-3xl hover:scale-110 transition-transform cursor-pointer"
                :title="conquista.nome"
              >
                {{ conquista.icone }}
              </div>
            </div>
            <p v-else class="text-texto/60 text-center text-sm mb-0">
              Nenhuma conquista ainda
            </p>
          </div>

          <div class="bg-incipit-card rounded-[30px] shadow-xl p-8 text-center">
            <h2 class="text-6xl font-display text-texto mb-2 mt-0 font-display">
              {{ totalLivrosLidos }}
            </h2>
            <p class="text-texto/70 text-lg mb-0">Total de livros lidos</p>
          </div>
        </div>

        <div class="flex flex-col gap-10">
          <div>
            <div class="w-full max-w-screen-lg">
              <h2
                class="bg-incipit-card text-texto font-display text-center mt-0 rounded-[30px] justify-self-start px-15 shadow-lg"
              >
                Livros Favoritos
              </h2>
            </div>

            <section class="bg-incipit-card rounded-[30px] shadow-xl p-8">
              <div v-if="livrosFavoritos.length > 0" class="grid grid-cols-3 gap-4">
                <div
                  v-for="livro in livrosFavoritos.slice(0, 3)"
                  :key="livro.id"
                  @click="navegarParaLivro(livro.expand?.livro?.ISBN)"
                  class="cursor-pointer hover:scale-105 transition-transform"
                >
                  <div
                    class="bg-incipit-base rounded-[20px] aspect-[2/3] overflow-hidden shadow-md"
                  >
                    <img
                      v-if="livro.capaUrl"
                      :src="livro.capaUrl"
                      :alt="livro.expand?.livro?.Nome"
                      class="w-full h-full object-cover"
                    />
                    <div
                      v-else
                      class="w-full h-full flex items-center justify-center text-texto/50 text-xs text-center px-2"
                    >
                      Sem capa
                    </div>
                  </div>
                  <p class="text-roxo text-xs font-bold mt-1 mb-0">
                    ★ {{ livro.avaliacao }}/5
                  </p>
                </div>
              </div>
              <p v-else class="text-texto/60 text-center">Nenhum livro favorito ainda</p>
            </section>
          </div>

          <div>
            <div class="w-full max-w-screen-lg">
              <h2
                class="bg-incipit-card text-texto font-display text-center mt-0 rounded-[30px] justify-self-start px-15 shadow-lg"
              >
                Listas
              </h2>
            </div>
            <section class="bg-incipit-card rounded-[30px] shadow-xl p-8">
              <div v-if="listas.length > 0" class="grid grid-cols-3 gap-4">
                <div
                  v-for="lista in listas"
                  :key="lista.id"
                  @click="navegarParaLista(lista.id)"
                  class="bg-incipit-base rounded-[20px] p-6 cursor-pointer hover:scale-105 transition-transform shadow-md aspect-[2/3] flex flex-col justify-between"
                >
                  <div>
                    <h3 class="text-texto font-display text-lg mb-2 line-clamp-2">
                      {{ lista.nome }}
                    </h3>
                    <p class="text-texto/70 text-sm line-clamp-3">
                      {{ lista.descricao || "Sem descrição" }}
                    </p>
                  </div>
                  <div class="mt-auto pt-4 border-t border-texto/20">
                    <span class="text-texto/70 text-sm font-bold">
                      {{ lista.totalLivros || 0 }} livros</span
                    >
                  </div>
                </div>
              </div>
              <p v-else class="text-texto/60 text-center">Nenhuma lista criada ainda</p>
              <div class="flex justify-between items-center mt-6">
                <button v-if="isProprioUsuario" @click="criarNovaLista" class="botao">
                  + Nova Lista
                </button>
              </div>
            </section>
          </div>

          <div>
            <div class="w-full max-w-screen-lg">
              <h2
                class="bg-incipit-card text-texto font-display text-center mt-0 rounded-[30px] justify-self-start px-15 shadow-lg"
              >
                Comunidades
              </h2>
            </div>
            <section class="bg-incipit-card rounded-[30px] shadow-xl p-8">
              <div v-if="comunidades.length > 0" class="grid grid-cols-3 gap-4">
                <div
                  v-for="comunidade in comunidades"
                  :key="comunidade.id"
                  @click="navegarParaComunidade(comunidade.id)"
                  class="bg-incipit-base rounded-[20px] p-6 cursor-pointer hover:scale-105 transition-transform shadow-md aspect-[2/3] flex flex-col justify-between"
                >
                  <div>
                    <img
                      v-if="getComunidadeImageUrl(comunidade)"
                      :src="getComunidadeImageUrl(comunidade)"
                      alt="Avatar da comunidade"
                      class="w-full aspect-square rounded-full object-cover shadow-lg mb-3"
                    />
                    <div
                      v-else
                      class="w-full aspect-square rounded-full bg-incipit-base flex items-center justify-center text-texto/40 text-4xl shadow-lg mb-3"
                    >
                      <div class="i-mdi:account"></div>
                    </div>
                    <h3 class="text-texto font-display text-center text-lg mt-0 mb-2 line-clamp-2">
                      {{ comunidade.nome }}
                    </h3>
                    <p class="text-texto/70 text-sm text-center line-clamp-3">
                      {{ comunidade.descricao || "Sem descrição" }}
                    </p>
                  </div>
                </div>
              </div>
              <p v-else class="text-texto/60 text-center">Nenhuma comunidade ainda</p>
              <div class="flex justify-center items-center mt-6">
                <button v-if="isProprioUsuario" @click="criarNovaComunidade" class="botao">
                  + Nova Comunidade
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import Header from "~/components/Header.vue";

const route = useRoute();
const router = useRouter();
const { $pb } = useNuxtApp();

// Composables
const {
  buscarUsuarioPorId,
  atualizarPerfil,
  calcularNivel,
  buscarConquistasUsuario,
  buscarTotalLivrosLidos,
  buscarLivrosFavoritos,
  buscarListasUsuario,
  ehProprioUsuario,
  buscarComunidadesUsuario
} = useUsuario();

const { buscarDadosLivroAPI } = useLivros();

// Estados locais
const usuario = ref(null);
const loading = ref(true);
const error = ref("");
const conquistas = ref([]);
const totalLivrosLidos = ref(0);
const livrosFavoritos = ref([]);
const listas = ref([]);
const comunidades = ref([]);
const editandoDescricao = ref(false);
const novaDescricao = ref("");
const fileInput = ref(null);

// ID do usuário da URL
const userId = computed(() => route.params.id);

// Verifica se é o próprio usuário
const isProprioUsuario = computed(() => {
  return ehProprioUsuario(userId.value);
});

// URL do avatar
const avatarUrl = computed(() => {
  if (!usuario.value?.avatar) return null;
  return $pb.files.getURL(usuario.value, usuario.value.avatar);
});

// Função para obter URL da imagem da comunidade
const getComunidadeImageUrl = (comunidade) => {
  if (!comunidade?.imagem_comunidade) return null;
  return $pb.files.getURL(comunidade, comunidade.imagem_comunidade);
};

// Carrega dados do perfil
onMounted(async () => {
  if (!userId.value) {
    error.value = "Usuário não encontrado";
    loading.value = false;
    return;
  }

  try {
    loading.value = true;

    // Busca dados básicos do usuário
    const resultadoUsuario = await buscarUsuarioPorId(userId.value);

    if (!resultadoUsuario.sucesso) {
      throw new Error(resultadoUsuario.erro);
    }
    usuario.value = resultadoUsuario.dados;

    // Busca dados adicionais em paralelo
    const [conquistasData, totalLivros, favoritos, listasData, comunidadesData] = await Promise.all([
      buscarConquistasUsuario(userId.value),
      buscarTotalLivrosLidos(userId.value),
      buscarLivrosFavoritos(userId.value),
      buscarListasUsuario(userId.value),
      buscarComunidadesUsuario(userId.value)
    ]);

    conquistas.value = conquistasData.dados || [];
    totalLivrosLidos.value = totalLivros.total || 0;
    livrosFavoritos.value = favoritos.dados || [];
    listas.value = listasData.dados || [];
    comunidades.value = comunidadesData.dados || [];

    // Buscar capas e autores da API para livros favoritos
    await carregarCapasLivrosFavoritos();
  } catch (err) {
    error.value = "Erro ao carregar dados do perfil";
  } finally {
    loading.value = false;
  }
});

// Carregar capas dos livros favoritos da API
async function carregarCapasLivrosFavoritos() {
  if (!livrosFavoritos.value || livrosFavoritos.value.length === 0) return;

  const promessas = livrosFavoritos.value.map(async (livro) => {
    const isbn = livro.expand?.livro?.ISBN;
    if (!isbn) return livro;

    const dadosAPI = await buscarDadosLivroAPI(isbn);

    if (dadosAPI.sucesso) {
      livro.capaUrl = dadosAPI.dados.capa;
      livro.autorNome = dadosAPI.dados.autor;
    }

    return livro;
  });

  await Promise.all(promessas);
}

// Funções de edição de descrição
function iniciarEdicaoDescricao() {
  editandoDescricao.value = true;
  novaDescricao.value = usuario.value.Description || "";
}

function cancelarEdicaoDescricao() {
  editandoDescricao.value = false;
  novaDescricao.value = "";
}

async function salvarDescricao() {
  try {
    const resultado = await atualizarPerfil(userId.value, {
      description: novaDescricao.value,
    });

    if (resultado.sucesso) {
      usuario.value = resultado.dados;
      editandoDescricao.value = false;
      alert("Descrição atualizada com sucesso!");
    } else {
      alert("Erro ao atualizar descrição: " + resultado.erro);
    }
  } catch (err) {
    alert("Erro ao atualizar descrição: " + err.message);
  }
}

// Upload de foto
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validação básica
  if (!file.type.startsWith("image/")) {
    alert("Por favor, selecione uma imagem válida");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    // 5MB
    alert("A imagem deve ter no máximo 5MB");
    return;
  }

  try {
    const resultado = await atualizarPerfil(userId.value, {
      avatar: file,
    });

    if (resultado.sucesso) {
      usuario.value = resultado.dados;
      alert("Foto atualizada com sucesso!");
    } else {
      alert("Erro ao atualizar foto: " + resultado.erro);
    }
  } catch (err) {
    alert("Erro ao atualizar foto: " + err.message);
  }
}

// Navegação
function navegarParaLivro(isbn) {
  if (isbn) {
    router.push(`/livro/${isbn}`);
  }
}

function navegarParaLista(listaId) {
  if (listaId) {
    router.push(`/lista/${listaId}`);
  }
}

function navegarParaComunidade(comunidadeId) {
  if (comunidadeId) {
    router.push(`/comunidade/${comunidadeId}`);
  }
}

function criarNovaLista() {
  router.push("/criarlistas");
}

function criarNovaComunidade() {
  router.push("/criarcomunidade");
}
</script>