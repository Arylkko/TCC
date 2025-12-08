<template>
  <div class="livro-page font-sono text-texto">
    <Header :show-search="true" />

    <main class="livro-container">
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Carregando informações do livro...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <div class="i-mdi:alert-circle error-icon"></div>
        <p>{{ error }}</p>
        <button @click="$router.push('/search')" class="btn-primary">
          Voltar à Busca
        </button>
      </div>

      <div
        v-else-if="livro"
        class="grid gap-10 relative z-10 container mx-auto py-8 max-w-7xl"
      >
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <div class="bg-incipit-card rounded-[30px] shadow-xl p-8">
              <div class="flex flex-col md:flex-row gap-6">
                <div class="flex-shrink-0">
                  <div class="w-48 h-72 mx-auto md:mx-0">
                    <img
                      :src="dadosAPI.capa || '/placeholder-book.jpg'"
                      :alt="livro.Nome"
                      class="w-full h-full object-cover rounded-lg shadow-lg"
                    />

                    <div
                      v-if="mostrarDropdownStatus"
                      class="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl overflow-hidden z-20"
                    >
                      <button
                        v-for="opcao in OPCOES_STATUS"
                        :key="opcao.valor"
                        @click="selecionarStatus(opcao.valor)"
                        class="w-full px-4 py-2 text-left hover:bg-incipit-roxo/10 transition text-texto"
                      >
                        {{ opcao.label }}
                      </button>
                    </div>
                  </div>

                  <div v-if="isAuthenticated" class="livro-status">
                    <select
                      id="status-select"
                      v-model="statusAtual"
                      @change="alterarStatus"
                      class="status-select"
                    >
                      <option value="">Selecione um status</option>
                      <option
                        v-for="opcao in OPCOES_STATUS"
                        :key="opcao.valor"
                        :value="opcao.valor"
                      >
                        {{ opcao.label }}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="flex-1">
                  <h1 class="text-3xl md:text-4xl font-bold text-texto mb-2 font-display">
                    {{ livro.Nome }}
                  </h1>
                  <h2 v-if="dadosAPI.autor" class="text-xl text-texto/80 mb-4">
                    {{ dadosAPI.autor }}
                  </h2>

                  <div class="space-y-1 mb-4">
                    <p v-if="dadosAPI.editora" class="text-sm text-texto/70">
                      <span class="font-semibold">Editora:</span> {{ dadosAPI.editora }}
                      <span v-if="dadosAPI.dataPublicacao"
                        >, {{ dadosAPI.dataPublicacao }}</span
                      >
                    </p>

                    <p v-if="dadosAPI.paginas" class="text-sm text-texto/70">
                      <span class="font-semibold">Páginas:</span> {{ dadosAPI.paginas }}
                    </p>

                    <p class="text-sm text-texto/70">
                      <span class="font-semibold">ISBN:</span> {{ livro.ISBN }}
                    </p>
                  </div>

                  <div v-if="dadosAPI.descricao" class="mt-6">
                    <h3 class="text-sm font-semibold text-texto mb-2">Sinopse</h3>
                    <p class="text-texto/80 leading-relaxed text-sm">
                      {{ descricaoExibida }}
                      <button 
                      v-if="precisaBotaoVerMais"
                      @click="toggleDescricao"
                      class="botao py-0.5"
                    >
                      {{ descricaoExpandida ? 'Ver menos' : 'Ver mais' }}
                    </button>
                    </p>
                    
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-incipit-card rounded-[30px] shadow-xl p-6 h-fit">
            <h3 class="text-2xl font-bold text-texto text-center mb-4 font-display">
              Nota média
            </h3>
            <div class="text-6xl font-bold text-texto text-center mb-2 font-display">
              {{ livro.AvaliacaoMedia ? livro.AvaliacaoMedia.toFixed(1) : "0.0" }}
            </div>
            <p class="text-center text-texto/60 text-sm mb-6">
              {{ livro.TotalAvaliacoes || 0 }}
              {{ livro.TotalAvaliacoes === 1 ? "avaliação" : "avaliações" }}
            </p>
            <div class="mb-6">
              <div v-for="n in 5" :key="n" class="flex items-center gap-2 mb-2">
                <span class="text-sm text-texto/70 w-8">{{ 6 - n }}★</span>
                <div class="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-incipit-roxo transition-all"
                    :style="{ width: calcularDistribuicao(6 - n) + '%' }"
                  ></div>
                </div>
              </div>
            </div>

            <div class="livro-tags">
              <h3 class="tags-title">Gêneros/Tags</h3>
              <div class="tags-list text-texto font-bold">
                <span
                  v-for="tag in tagsLivro"
                  :key="tag.id"
                  class="tag bg-incipit-base shadow-lg font-bo"
                >
                  <div class="i-mdi:tag text-texto"></div>
                  {{ tag.nome }}
                  <button
                    v-if="isAuthenticated"
                    @click="removerTag(tag.id)"
                    class="tag-remove"
                    title="Remover tag"
                  >
                    <div class="i-mdi:close text-texto"></div>
                  </button>
                </span>

                <div v-if="isAuthenticated" class="tag-add-container">
                  <input
                    v-if="mostrarInputTag"
                    v-model="novaTag"
                    @keyup.enter="adicionarTag"
                    @blur="cancelarNovaTag"
                    placeholder="Nome da tag"
                    class="tag-input"
                    ref="tagInput"
                  />
                  <button
                    v-else
                    @click="mostrarInputNovaTag"
                    class="tag-add-button"
                    title="Adicionar tag"
                  >
                    <div class="i-mdi:plus"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="reviews-comments-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div class="w-full max-w-screen-lg mb-6 sm:mb-8">
              <h2
                class="bg-incipit-card text-texto font-display text-center rounded-[30px] justify-self-start px-15 shadow-lg"
              >
                Resenhas
                <span class="count">({{ notas.length }})</span>
              </h2>
            </div>

            <div v-if="isAuthenticated" class="add-review">
              <h3 class="subsection-title">
                {{
                  minhaNotaExistente ? "Editar minha avaliação" : "Deixe sua avaliação"
                }}
              </h3>

              <div class="rating-input">
                <label>Nota:</label>
                <div class="rating-stars-input">
                  <button
                    v-for="n in 5"
                    :key="n"
                    @click="avaliacaoNova = n"
                    :class="[
                      'star-button',
                      n <= avaliacaoNova ? 'star-filled' : 'star-empty',
                    ]"
                    type="button"
                  >
                    <div class="i-mdi:star"></div>
                  </button>
                </div>
              </div>

              <textarea
                v-model="resenhaTexto"
                placeholder="Escreva sua resenha (opcional)..."
                class="review-textarea"
                rows="5"
              ></textarea>

              <button
                @click="enviarAvaliacao"
                :disabled="avaliacaoNova === 0"
                class="btn-primary"
              >
                {{ minhaNotaExistente ? "Atualizar Avaliação" : "Publicar Avaliação" }}
              </button>
            </div>

            <div
              v-for="nota in notas"
              :key="nota.id"
              @click="ExpandirResenha(nota)"
              class="review-item grid gap-5"
            >
              <div class="bg-incipit-card rounded-[30px] shadow-lg p-6 mb-4">
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <h3 class="text-lg font-semibold text-texto m-0">Título</h3>
                    <div class="flex gap-1">
                      <div
                        v-for="n in 5"
                        :key="n"
                        :class="[
                          'star-small',
                          n <= nota.avaliacao ? 'star-filled' : 'star-empty',
                        ]"
                      >
                        <div class="i-mdi:star"></div>
                      </div>
                    </div>
                  </div>

                  <div v-if="nota.resenha" class="review-text break-all line-clamp-2">
                    {{ nota.resenha }}
                  </div>
                </div>

                <div class="flex items-end justify-between mt-10">
                  <div class="flex items-end gap-3">
                    <div class="w-10 h-10 rounded-full bg-roxo flex-shrink-0"></div>

                    <div class="flex flex-col">
                      <span class="text-roxo">
                        {{ nota.expand?.autor?.name || "Usuário" }}
                      </span>
                      <span class="text-sm text-texto/60">{{
                        formatarData(nota.created)
                      }}</span>
                    </div>

                    <div class="flex items-center gap-1 ml-2">
                      <div class="i-mdi:heart text-roxo text-lg"></div>
                      <span class="text-texto/60 text-xs">likes</span>
                    </div>
                  </div>
                  <button
                    class="bg-roxo text-branco py-1 px-2 rounded-full border-0 font-sono"
                  >
                    S/C spoilers
                  </button>
                </div>
              </div>

              <p v-if="notas.length === 0" class="empty-message">
                Nenhuma avaliação ainda. Seja o primeiro a avaliar!
              </p>
            </div>
          </div>

          <div>
            <div class="comments-section">
              <h2
                class="bg-incipit-card text-texto font-display text-center rounded-[30px] justify-self-start px-15 shadow-lg"
              >
                Comentários
                <span class="count">({{ comentarios.length }})</span>
              </h2>

              <div v-if="isAuthenticated" class="add-comment">
                <textarea
                  v-model="novoComentario"
                  placeholder="Escreva um comentário..."
                  class="comment-textarea"
                  rows="3"
                ></textarea>
                <button
                  @click="enviarComentario"
                  :disabled="!novoComentario.trim()"
                  class="btn-secondary"
                >
                  Publicar Comentário
                </button>
              </div>

              <div class="comments-list">
                <div
                  v-for="comentario in comentarios"
                  :key="comentario.id"
                  class="comment-item flex items-start gap-4"
                  @click="ExpandirComentario(comentario)"
                >
                  <div class="flex flex-col items-center gap-1 flex-shrink-0 w-16">
                    <div
                      class="w-15 h-15 rounded-full border-2 border-roxo overflow-hidden bg-roxo"
                    >
                      <div
                        class="w-full h-full flex items-center justify-center bg-roxo"
                      ></div>
                    </div>
                    <span
                      class="font-display mt-2 text-texto text-center leading-tight truncate w-full"
                    >
                      {{ comentario.expand?.autor?.name || "User" }}
                    </span>
                  </div>

                  <div
                    class="relative flex-1 bg-incipit-card rounded-[20px] p-5 shadow-sm min-w-0"
                  >
                    <div
                      class="absolute top-6 -left-2 w-4 h-4 bg-incipit-card transform rotate-45"
                    ></div>

                    <button
                      class="absolute top-3 right-3 text-[#3d3131]/30 hover:text-red-500 transition"
                    >
                      <div class="i-mdi:close font-bold"></div>
                    </button>

                    <h4 class="font-bold text-[#3d3131] mb-1 mt-0 text-sm">
                      {{ comentario.expand?.autor?.name || "Leitor" }} diz:
                    </h4>
                    <p
                      class="text-[#3d3131] text-sm leading-relaxed mb-4 break-words whitespace-pre-wrap"
                    >
                      {{ comentario.conteudo }}
                    </p>

                    <div class="flex justify-between items-center">
                      <div class="flex gap-4 text-roxo text-xs">
                        <div class="flex items-center gap-1">
                          <div class="i-mdi:heart text-roxo text-lg"></div>
                          <span class="text-texto/60 text-xs">likes</span>
                        </div>

                        <div class="flex items-center gap-1">
                            <div class="i-mdi:comment"></div>
                          comentários
                        </div>
                      </div>

                      <button
                        class="bg-roxo text-branco py-1 px-2 rounded-full border-0 font-sono"
                      >
                        S/C spoilers
                      </button>
                    </div>
                  </div>
                </div>

                <p v-if="comentarios.length === 0" class="empty-message">
                  Nenhum comentário ainda. Inicie a conversa!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import Header from "~/components/Header.vue";
import { useLivros } from "~/composables/useLivros";
import { useNotas } from "~/composables/useNotas";
import { useComentarios } from "~/composables/useComentarios";
import { useStatus } from "~/composables/useStatus";
import { useTags } from "~/composables/useTags";

const route = useRoute();
const { $pb } = useNuxtApp();

// State
const loading = ref(true);
const error = ref("");
const livro = ref(null);
const dadosAPI = ref({});
const notas = ref([]);
const comentarios = ref([]);
const tagsLivro = ref([]);
const statusAtual = ref("");

// Reviews
const avaliacaoNova = ref(0);
const resenhaTexto = ref("");
const minhaNotaExistente = ref(null);

// Comments
const novoComentario = ref("");

// Tags
const mostrarInputTag = ref(false);
const novaTag = ref("");
const tagInput = ref(null);

// Status dropdown
const mostrarDropdownStatus = ref(false);

const descricaoExpandida = ref(false);
const MAX_CARACTERES_SINOPSE = 300;

// Composables
const { buscarLivroPorISBN, buscarDadosLivroAPI } = useLivros();
const {
  buscarNotasLivro,
  criarNota,
  atualizarNota,
  buscarNotaUsuario,
  atualizarMediaAvaliacoes,
} = useNotas();
const {
  buscarComentariosComRespostas
} = useComentarios();
const { OPCOES_STATUS, buscarStatus, definirStatus } = useStatus();
const { buscarTagsLivro, adicionarOuCriarTag, removerTagDoLivro } = useTags();

const isAuthenticated = computed(() => $pb.authStore.isValid);
const isbn = computed(() => route.params.isbn);


const descricaoExibida = computed(() => {
  if (!dadosAPI.value.descricao) return '';
  
  if (descricaoExpandida.value || dadosAPI.value.descricao.length <= MAX_CARACTERES_SINOPSE) {
    return dadosAPI.value.descricao;
  }
  
  return dadosAPI.value.descricao.substring(0, MAX_CARACTERES_SINOPSE) + '...';
});

const precisaBotaoVerMais = computed(() => {
  return dadosAPI.value.descricao && dadosAPI.value.descricao.length > MAX_CARACTERES_SINOPSE;
});

function toggleDescricao() {
  descricaoExpandida.value = !descricaoExpandida.value;
}

// Load book data
onMounted(async () => {
  await carregarDadosLivro();
});

async function carregarDadosLivro() {
  loading.value = true;
  error.value = "";

  try {
    // Busca livro no banco
    const resultadoLivro = await buscarLivroPorISBN(isbn.value);

    if (!resultadoLivro.sucesso) {
      error.value = "Livro não encontrado.";
      return;
    }

    livro.value = resultadoLivro.dados;

    // Busca dados da API
    const resultadoAPI = await buscarDadosLivroAPI(isbn.value);
    if (resultadoAPI.sucesso) {
      dadosAPI.value = {
        ...resultadoAPI.dados,
        editora: resultadoAPI.dados.editora || "",
        dataPublicacao: resultadoAPI.dados.dataPublicacao || "",
        paginas: resultadoAPI.dados.paginas || "",
      };
    }

    // Busca notas, comentários, tags
    await Promise.all([carregarNotas(), carregarComentarios(), carregarTags()]);

    // Se autenticado, busca status e nota do usuário
    if (isAuthenticated.value) {
      await carregarStatusUsuario();
      await carregarMinhaAvaliacao();
    }
  } catch (err) {
    console.error("Erro ao carregar livro:", err);
    error.value = "Erro ao carregar informações do livro.";
  } finally {
    loading.value = false;
  }
}

async function carregarNotas() {
  const resultado = await buscarNotasLivro(livro.value.id);
  if (resultado.sucesso) {
    notas.value = resultado.dados;
  }
}

async function carregarComentarios() {
  const resultado = await buscarComentariosComRespostas(livro.value.id);
  if (resultado.sucesso) {
    comentarios.value = resultado.dados;
  }
}

async function carregarTags() {
  const resultado = await buscarTagsLivro(livro.value.id);
  if (resultado.sucesso) {
    tagsLivro.value = resultado.dados;
  }
}

async function carregarStatusUsuario() {
  const resultado = await buscarStatus(livro.value.id, $pb.authStore.model.id);
  if (resultado.sucesso) {
    statusAtual.value = resultado.dados.nome;
  }
}

async function carregarMinhaAvaliacao() {
  const resultado = await buscarNotaUsuario(livro.value.id, $pb.authStore.model.id);
  if (resultado.sucesso) {
    minhaNotaExistente.value = resultado.dados;
    avaliacaoNova.value = resultado.dados.avaliacao;
    resenhaTexto.value = resultado.dados.resenha || "";
  }
}

// Comments
async function enviarComentario() {
  if (!novoComentario.value.trim()) return;

  try {
    const dados = {
      conteudo: novoComentario.value.trim(),
      autor: $pb.authStore.model.id,
      livro: livro.value.id
    };

    const resultado = await $pb.collection('comentario').create(dados);

    if (resultado) {
      novoComentario.value = '';
      await carregarComentarios();
      alert('Comentário publicado com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao enviar comentário:', error);
    alert('Erro ao publicar comentário: ' + error.message);
  }
}

// Status
async function alterarStatus() {
  if (!statusAtual.value) return;

  const resultado = await definirStatus(
    livro.value.id,
    $pb.authStore.model.id,
    statusAtual.value
  );

  if (resultado.sucesso) {
    console.log("Status atualizado com sucesso!");
  } else {
    alert("Erro ao atualizar status: " + resultado.erro);
  }
}

// Reviews
async function enviarAvaliacao() {
  if (avaliacaoNova.value === 0) return;

  const dados = {
    livro: livro.value.id,
    autor: $pb.authStore.model.id,
    avaliacao: avaliacaoNova.value,
    resenha: resenhaTexto.value.trim(),
  };

  let resultado;
  if (minhaNotaExistente.value) {
    resultado = await atualizarNota(minhaNotaExistente.value.id, dados);
  } else {
    resultado = await criarNota(dados);
  }

  if (resultado.sucesso) {
    // Atualiza média do livro
    await atualizarMediaAvaliacoes(livro.value.id);

    // Recarrega dados
    await carregarDadosLivro();

    alert(minhaNotaExistente.value ? "Avaliação atualizada!" : "Avaliação publicada!");
  } else {
    alert("Erro ao enviar avaliação: " + resultado.erro);
  }
}

// Tags
function mostrarInputNovaTag() {
  mostrarInputTag.value = true;
  nextTick(() => {
    tagInput.value?.focus();
  });
}

function cancelarNovaTag() {
  setTimeout(() => {
    mostrarInputTag.value = false;
    novaTag.value = "";
  }, 200);
}

async function adicionarTag() {
  if (!novaTag.value.trim()) return;

  const resultado = await adicionarOuCriarTag(livro.value.id, novaTag.value.trim());

  if (resultado.sucesso) {
    novaTag.value = "";
    mostrarInputTag.value = false;
    await carregarTags();
  } else {
    alert("Erro ao adicionar tag: " + resultado.erro);
  }
}

async function removerTag(tagId) {
  if (!confirm("Remover esta tag do livro?")) return;

  const resultado = await removerTagDoLivro(livro.value.id, tagId);

  if (resultado.sucesso) {
    await carregarTags();
  } else {
    alert("Erro ao remover tag: " + resultado.erro);
  }
}

// Utilities
function formatarData(data) {
  const date = new Date(data);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calcularDistribuicao(estrelas) {
  if (notas.value.length === 0) return 0;
  const count = notas.value.filter((n) => Math.round(n.avaliacao) === estrelas).length;
  return (count / notas.value.length) * 100;
}

function ExpandirResenha(nota) {
  console.log(nota.id);
  if (nota.id) {
    navigateTo(`/nota/${nota.id}`);
  } else {
    alert("Nota não encontrada.");
  }
}

function ExpandirComentario(comentario) {
  console.log(comentario.id);
  if (comentario.id) {
    navigateTo(`/comentario/c${comentario.id}`);
  } else {
    alert("Comentário não encontrada.");
  }
}
</script>

<style src="~/styles/pages/livro.css"></style>