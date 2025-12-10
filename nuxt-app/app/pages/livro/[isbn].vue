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
                    class="h-full transition-all duration-300"
                    :style="{ 
                      width: calcularDistribuicao(6 - n) + '%',
                      backgroundColor: '#a68dad'
                    }"
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

            
            <div v-if="isAuthenticated" class="bg-[#e6decf] rounded-[30px] p-4 shadow-sm mb-4">
              <div class="flex gap-4 items-start">
                <div class="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                  <img v-if="getAvatarUsuario(usuarioAtual)" :src="getAvatarUsuario(usuarioAtual)" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full bg-roxo"></div>
                </div>
                
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm text-texto/80">Nota:</span>
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
                    rows="3"
                    class="w-full bg-incipit-fundo box-border rounded-xl p-3 border-none focus:ring-2 focus:ring-roxo outline-none resize-none text-sm mb-2"
                  ></textarea>
                  
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 ml-2">
                      <input 
                        type="checkbox" 
                        id="resenha-spoiler-checkbox"
                        v-model="resenhaTemSpoiler"
                        class="w-4 h-4 text-roxo border-gray-300 rounded focus:ring-roxo cursor-pointer"
                      />
                      <label for="resenha-spoiler-checkbox" class="text-xs text-texto cursor-pointer">
                        Esta resenha contém spoilers
                      </label>
                    </div>
                    
                    <button 
                      @click="enviarAvaliacao"
                      :disabled="avaliacaoNova === 0"
                      class="text-roxo border-0 hover:text-[#7a6a8f] disabled:opacity-50"
                    >
                      <div class="i-mdi:send text-xl"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-for="nota in notas"
              :key="nota.id"
              @click="ExpandirResenha(nota)"
              class="mb-4"
            >
              <div class="bg-incipit-card rounded-[30px] shadow-lg p-6 cursor-pointer hover:shadow-xl transition">
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <h3 class="text-lg font-semibold text-texto m-0">Resenha</h3>
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

                  <!-- Conteúdo da resenha com/sem spoiler -->
                  <div v-if="nota.resenha">
                    <div v-if="nota.spoiler && !resenhaRevelada(nota.id)" 
                         @click.stop="toggleSpoilerResenha(nota.id)"
                         class="cursor-pointer text-[#3d3131]/60 italic text-sm py-2">
                      <span class="hover:text-[#3d3131] transition">
                        Esta resenha contém spoilers. Clique para revelar.
                      </span>
                    </div>
                    
                    <div v-else
                         @click.stop="nota.spoiler ? toggleSpoilerResenha(nota.id) : null"
                         :class="['review-text break-all line-clamp-2 mb-4', 
                                  nota.spoiler && resenhaRevelada(nota.id) ? 'cursor-pointer' : '']">
                      {{ nota.resenha }}
                      <span v-if="nota.spoiler && resenhaRevelada(nota.id)" 
                            class="text-xs text-roxo/60 italic block mt-2">
                        (Clique para ocultar)
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex items-end justify-between mt-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                      <img 
                        v-if="getAvatarUsuario(nota.expand?.autor)" 
                        :src="getAvatarUsuario(nota.expand?.autor)" 
                        class="w-full h-full object-cover" 
                      />
                      <div v-else class="w-full h-full bg-roxo"></div>
                    </div>

                    <div class="flex flex-col">
                      <span class="text-roxo font-semibold">
                        {{ nota.expand?.autor?.name || "Usuário" }}
                      </span>
                      <span class="text-sm text-texto/60">{{
                        formatarData(nota.created)
                      }}</span>
                    </div>

                    <div class="flex items-center gap-1 ml-2">
                      <div 
                        @click.stop="darLikeNota(nota.id)"
                        class="flex items-center gap-1 cursor-pointer hover:scale-110 transition"
                        :class="{ 'text-red-500': usuarioDeulLikeNota(nota, $pb.authStore.model?.id) }"
                      >
                        <div 
                          :class="[
                            'text-lg',
                            usuarioDeulLikeNota(nota, $pb.authStore.model?.id) 
                              ? 'i-mdi:heart' 
                              : 'i-mdi:heart-outline'
                          ]"
                        ></div>
                        <span class="text-texto/60 text-xs">{{ nota.likes?.length || 0 }}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    class="bg-roxo text-branco py-1 px-2 rounded-full border-0 font-sono text-xs"
                  >
                    {{ nota.spoiler ? 'COM spoilers' : 'SEM spoilers' }}
                  </button>
                </div>
              </div>
            </div>

            <p v-if="notas.length === 0" class="empty-message">
              Nenhuma avaliação ainda. Seja o primeiro a avaliar!
            </p>
          </div>

          <div>
            <div class="comments-section">
              <h2
                class="bg-incipit-card text-texto font-display text-center rounded-[30px] justify-self-start px-15 shadow-lg"
              >
                Comentários
                <span class="count">({{ comentarios.length }})</span>
              </h2>              
              
              <div v-if="isAuthenticated" class="bg-[#e6decf] rounded-[30px] p-4 shadow-sm flex gap-4 items-start mb-4">
                <div class="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                  <img v-if="getAvatarUsuario(usuarioAtual)" :src="getAvatarUsuario(usuarioAtual)" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full bg-roxo"></div>
                </div>
                <div class="flex-1">
                  <textarea 
                    v-model="novoComentario"
                    placeholder="Escreva algo..."   
                    rows="2"
                    class="w-full bg-incipit-fundo box-border rounded-xl p-3 border-none focus:ring-2 focus:ring-roxo outline-none resize-none text-sm mb-2"
                  ></textarea>
                  
                  <!-- Checkbox de Spoiler -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 ml-2">
                      <input 
                        type="checkbox" 
                        id="comentario-spoiler-checkbox"
                        v-model="comentarioTemSpoiler"
                        class="w-4 h-4 text-roxo border-gray-300 rounded focus:ring-roxo cursor-pointer"
                      />
                      <label for="comentario-spoiler-checkbox" class="text-xs text-texto cursor-pointer">
                        Este comentário contém spoilers
                      </label>
                    </div>
                    
                    <button 
                      @click="enviarComentario"
                      :disabled="!novoComentario.trim() || enviandoComentario"
                      class="text-roxo border-0 hover:text-[#7a6a8f] disabled:opacity-50"
                    >
                      <div class="i-mdi:send text-xl"></div>
                    </button>
                  </div>
                </div>
              </div>

              <div class="comments-list">
                <div
                  v-for="comentario in comentarios"
                  :key="comentario.id"
                  class="comment-item flex items-start gap-4 cursor-pointer"
                  @click="ExpandirComentario(comentario)"
                >
                  <div class="flex flex-col items-center gap-1 flex-shrink-0 w-16">
                    <div class="w-15 h-15 rounded-full border-2 border-roxo overflow-hidden bg-gray-300">
                      <img 
                        v-if="getAvatarUsuario(comentario.expand?.autor)" 
                        :src="getAvatarUsuario(comentario.expand?.autor)" 
                        class="w-full h-full object-cover" 
                      />
                      <div v-else class="w-full h-full bg-roxo"></div>
                    </div>
                    <span class="font-display mt-2 text-texto text-center leading-tight truncate w-full text-xs">
                      {{ comentario.expand?.autor?.name || "User" }}
                    </span>
                  </div>
                  
                  <div class="relative flex-1 bg-incipit-card rounded-[20px] p-5 shadow-sm min-w-0">
                    <div class="absolute top-6 -left-2 w-4 h-4 bg-incipit-card transform rotate-45"></div>

                    <button
                      v-if="comentario.expand?.autor?.id === $pb.authStore.model?.id"
                      @click.stop="removerComentario(comentario.id, comentario.expand?.autor?.id)"
                      class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition border-0 cursor-pointer"
                      title="Deletar comentário"
                    >
                      <div class="i-mdi:close text-sm"></div>
                    </button>

                    <h4 class="font-bold text-[#3d3131] mb-1 mt-0 text-sm">
                      {{ comentario.expand?.autor?.name || "Leitor" }} diz:
                    </h4>
                    
                    <!-- Conteúdo com/sem spoiler -->
                    <div v-if="comentario.spoiler && !comentarioRevelado(comentario.id)" 
                         @click.stop="toggleSpoiler(comentario.id)"
                         class="cursor-pointer text-[#3d3131]/60 italic text-sm py-2 mb-4">
                      <span class="hover:text-[#3d3131] transition">
                        Este comentário contém spoilers. Clique para revelar.
                      </span>
                    </div>
                    
                    <p v-else
                      @click.stop="comentario.spoiler ? toggleSpoiler(comentario.id) : null"
                      :class="['text-[#3d3131] text-sm leading-relaxed mb-4 break-words whitespace-pre-wrap', 
                               comentario.spoiler && comentarioRevelado(comentario.id) ? 'cursor-pointer' : '']"
                    >
                      {{ comentario.conteudo }}
                      <span v-if="comentario.spoiler && comentarioRevelado(comentario.id)" 
                            class="text-xs text-roxo/60 italic block mt-2">
                        (Clique para ocultar)
                      </span>
                    </p>

                    <div class="flex justify-between items-center">
                      <div class="flex gap-4 text-roxo text-xs">
                        <div 
                          @click.stop="darLikeComentario(comentario.id)"
                          class="flex items-center gap-1 cursor-pointer hover:scale-110 transition"
                          :class="{ 'text-red-500': usuarioDeulLikeComentario(comentario, $pb.authStore.model?.id) }"
                        >
                          <div 
                            :class="[
                              'text-lg',
                              usuarioDeulLikeComentario(comentario, $pb.authStore.model?.id) 
                                ? 'i-mdi:heart' 
                                : 'i-mdi:heart-outline'
                            ]"
                          ></div>
                          <span class="text-texto/60 text-xs">{{ comentario.likes?.length || 0 }}</span>
                        </div>

                        <div class="flex items-center gap-1">
                          <div class="i-mdi:comment"></div>
                          comentários
                        </div>
                      </div>

                      <button
                        class="bg-roxo text-branco py-1 px-2 rounded-full border-0 font-sono text-xs"
                      >
                        {{ comentario.spoiler ? 'COM spoilers' : 'SEM spoilers' }}
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
const resenhaTemSpoiler = ref(false);
const resenhasReveladas = ref(new Set());

// Comments
const novoComentario = ref("");
const comentarioTemSpoiler = ref(false);
const comentariosRevelados = ref(new Set());
const enviandoComentario = ref(false);

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
  buscarComentariosComRespostas,
  deletarComentario
} = useComentarios();
const { OPCOES_STATUS, buscarStatus, definirStatus } = useStatus();
const { buscarTagsLivro, adicionarOuCriarTag, removerTagDoLivro } = useTags();
const { toggleLikeComentario, toggleLikeNota, usuarioDeulLikeComentario, usuarioDeulLikeNota } = useLikes();
const { ganharXPAbrirLivro, ganharXPComentario, ganharXPResenha } = useXP();

const isAuthenticated = computed(() => $pb.authStore.isValid);
const isbn = computed(() => route.params.isbn);
const usuarioAtual = computed(() => $pb.authStore.model);

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
  
  if (isAuthenticated.value && $pb.authStore.model?.id) {
    await ganharXPAbrirLivro($pb.authStore.model.id);
  }
});

async function carregarDadosLivro() {
  loading.value = true;
  error.value = "";

  try {
    const resultadoLivro = await buscarLivroPorISBN(isbn.value);

    if (!resultadoLivro.sucesso) {
      error.value = "Livro não encontrado.";
      return;
    }

    livro.value = resultadoLivro.dados;

    const resultadoAPI = await buscarDadosLivroAPI(isbn.value);
    if (resultadoAPI.sucesso) {
      dadosAPI.value = {
        ...resultadoAPI.dados,
        editora: resultadoAPI.dados.editora || "",
        dataPublicacao: resultadoAPI.dados.dataPublicacao || "",
        paginas: resultadoAPI.dados.paginas || "",
      };
    }

    await Promise.all([carregarNotas(), carregarComentarios(), carregarTags()]);

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
    resenhaTemSpoiler.value = resultado.dados.spoiler || false;
  }
}

// Comments
async function enviarComentario() {
  if (!novoComentario.value.trim()) return;

  try {
    enviandoComentario.value = true;
    const dados = {
      conteudo: novoComentario.value.trim(),
      autor: $pb.authStore.model.id,
      livro: livro.value.id,
      spoiler: comentarioTemSpoiler.value
    };

    const resultado = await $pb.collection('comentario').create(dados);

    if (resultado) {
      novoComentario.value = '';
      comentarioTemSpoiler.value = false;
      await carregarComentarios();
      await ganharXPComentario($pb.authStore.model.id);
      alert('Comentário publicado com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao enviar comentário:', error);
    alert('Erro ao publicar comentário: ' + error.message);
  } finally {
    enviandoComentario.value = false;
  }
}

function toggleSpoiler(comentarioId) {
  if (comentariosRevelados.value.has(comentarioId)) {
    comentariosRevelados.value.delete(comentarioId);
  } else {
    comentariosRevelados.value.add(comentarioId);
  }
}

function comentarioRevelado(comentarioId) {
  return comentariosRevelados.value.has(comentarioId);
}

function getAvatarUsuario(usuario) {
  if (usuario?.avatar) {
    return $pb.files.getURL(usuario, usuario.avatar);
  }
  return null;
}

async function removerComentario(comentarioId, autorId) {
  if (autorId !== $pb.authStore.model?.id) {
    alert('Você só pode deletar seus próprios comentários');
    return;
  }

  if (!confirm('Tem certeza que deseja deletar este comentário?')) {
    return;
  }

  const resultado = await deletarComentario(comentarioId);
  if (resultado.sucesso) {
    await carregarComentarios();
  } else {
    alert('Erro ao deletar comentário: ' + resultado.erro);
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
    spoiler: resenhaTemSpoiler.value
  };

  let resultado;
  if (minhaNotaExistente.value) {
    resultado = await atualizarNota(minhaNotaExistente.value.id, dados);
  } else {
    resultado = await criarNota(dados);
    
    if (resultado.sucesso && resenhaTexto.value.trim()) {
      await ganharXPResenha($pb.authStore.model.id);
    }
  }

  if (resultado.sucesso) {
    await atualizarMediaAvaliacoes(livro.value.id);
    await carregarDadosLivro();
    resenhaTemSpoiler.value = false;
    alert(minhaNotaExistente.value ? "Avaliação atualizada!" : "Avaliação publicada!");
  } else {
    alert("Erro ao enviar avaliação: " + resultado.erro);
  }
}

function toggleSpoilerResenha(resenhaId) {
  if (resenhasReveladas.value.has(resenhaId)) {
    resenhasReveladas.value.delete(resenhaId);
  } else {
    resenhasReveladas.value.add(resenhaId);
  }
}

function resenhaRevelada(resenhaId) {
  return resenhasReveladas.value.has(resenhaId);
}

// Likes
async function darLikeComentario(comentarioId) {
  if (!isAuthenticated.value) {
    alert('Faça login para curtir');
    return;
  }

  const resultado = await toggleLikeComentario(comentarioId);
  if (resultado.sucesso) {
    await carregarComentarios();
  } else {
    alert('Erro ao curtir: ' + resultado.erro);
  }
}

async function darLikeNota(notaId) {
  if (!isAuthenticated.value) {
    alert('Faça login para curtir');
    return;
  }

  const resultado = await toggleLikeNota(notaId);
  if (resultado.sucesso) {
    await carregarNotas();
  } else {
    alert('Erro ao curtir: ' + resultado.erro);
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
  if (!notas.value || notas.value.length === 0) return 0;
  const count = notas.value.filter((n) => n.avaliacao === estrelas).length;
  return (count / notas.value.length) * 100;
}

function ExpandirResenha(nota) {
  if (nota.id) {
    navigateTo(`/nota/${nota.id}`);
  } else {
    alert("Nota não encontrada.");
  }
}

function ExpandirComentario(comentario) {
  if (comentario.id) {
    navigateTo(`/comentario/c${comentario.id}`);
  } else {
    alert("Comentário não encontrada.");
  }
}</script>

<style src="~/styles/pages/livro.css"></style>