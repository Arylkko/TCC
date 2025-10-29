<template>
  <div class="livro-page">
    <Header :show-search="true" />

    <main class="livro-container">
      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Carregando informações do livro...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-container">
        <div class="i-mdi:alert-circle error-icon"></div>
        <p>{{ error }}</p>
        <button @click="$router.push('/search')" class="btn-primary">
          Voltar à Busca
        </button>
      </div>

      <!-- Book Content -->
      <div v-else-if="livro" class="livro-content">
        <!-- Book Header -->
        <div class="livro-header">
          <!-- Cover Image -->
          <div class="livro-capa">
            <img 
              :src="dadosAPI.capa || '/placeholder-book.jpg'" 
              :alt="livro.Nome"
              class="capa-image"
            >
          </div>

          <!-- Book Info -->
          <div class="livro-info">
            <h1 class="livro-titulo">{{ livro.Nome }}</h1>
            
            <p v-if="dadosAPI.autor" class="livro-autor">
              <span class="label">Autor:</span> {{ dadosAPI.autor }}
            </p>

            <p v-if="dadosAPI.editora" class="livro-meta">
              <span class="label">Editora:</span> {{ dadosAPI.editora }}
            </p>

            <p v-if="dadosAPI.dataPublicacao" class="livro-meta">
              <span class="label">Publicação:</span> {{ dadosAPI.dataPublicacao }}
            </p>

            <p v-if="dadosAPI.paginas" class="livro-meta">
              <span class="label">Páginas:</span> {{ dadosAPI.paginas }}
            </p>

            <p class="livro-meta">
              <span class="label">ISBN:</span> {{ livro.ISBN }}
            </p>

            <!-- Rating -->
            <div class="livro-rating">
              <div class="rating-stars">
                <div 
                  v-for="n in 5" 
                  :key="n"
                  :class="['star', n <= Math.round(livro.AvaliacaoMedia || 0) ? 'star-filled' : 'star-empty']"
                >
                  <div class="i-mdi:star"></div>
                </div>
              </div>
              <span class="rating-text">
                {{ livro.AvaliacaoMedia ? livro.AvaliacaoMedia.toFixed(1) : '0.0' }}
                ({{ livro.TotalAvaliacoes || 0 }} {{ livro.TotalAvaliacoes === 1 ? 'avaliação' : 'avaliações' }})
              </span>
            </div>

            <!-- Status Dropdown -->
            <div v-if="isAuthenticated" class="livro-status">
              <label for="status-select" class="status-label">Meu Status:</label>
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

            <!-- Tags -->
            <div class="livro-tags">
              <h3 class="tags-title">Gêneros/Tags</h3>
              <div class="tags-list">
                <span 
                  v-for="tag in tagsLivro" 
                  :key="tag.id"
                  class="tag"
                >
                  {{ tag.nome }}
                  <button 
                    v-if="isAuthenticated"
                    @click="removerTag(tag.id)"
                    class="tag-remove"
                    title="Remover tag"
                  >
                    <div class="i-mdi:close"></div>
                  </button>
                </span>
                
                <!-- Add Tag -->
                <div v-if="isAuthenticated" class="tag-add-container">
                  <input
                    v-if="mostrarInputTag"
                    v-model="novaTag"
                    @keyup.enter="adicionarTag"
                    @blur="cancelarNovaTag"
                    placeholder="Nome da tag"
                    class="tag-input"
                    ref="tagInput"
                  >
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

        <!-- Description -->
        <div v-if="dadosAPI.descricao" class="livro-descricao">
          <h2 class="section-title">Sinopse</h2>
          <p class="descricao-text">{{ dadosAPI.descricao }}</p>
        </div>

        <!-- Reviews Section -->
        <div class="reviews-section">
          <h2 class="section-title">
            Avaliações e Resenhas
            <span class="count">({{ notas.length }})</span>
          </h2>

          <!-- Add Review (if authenticated) -->
          <div v-if="isAuthenticated" class="add-review">
            <h3 class="subsection-title">
              {{ minhaNotaExistente ? 'Editar minha avaliação' : 'Deixe sua avaliação' }}
            </h3>
            
            <!-- Star Rating -->
            <div class="rating-input">
              <label>Nota:</label>
              <div class="rating-stars-input">
                <button
                  v-for="n in 5"
                  :key="n"
                  @click="avaliacaoNova = n"
                  :class="['star-button', n <= avaliacaoNova ? 'star-filled' : 'star-empty']"
                  type="button"
                >
                  <div class="i-mdi:star"></div>
                </button>
              </div>
            </div>

            <!-- Review Text -->
            <textarea
              v-model="resenhaTexto"
              placeholder="Escreva sua resenha (opcional)..."
              class="review-textarea"
              rows="5"
            ></textarea>

            <!-- Submit Button -->
            <button 
              @click="enviarAvaliacao"
              :disabled="avaliacaoNova === 0"
              class="btn-primary"
            >
              {{ minhaNotaExistente ? 'Atualizar Avaliação' : 'Publicar Avaliação' }}
            </button>
          </div>

          <!-- Reviews List -->
          <div class="reviews-list">
            <div 
              v-for="nota in notas" 
              :key="nota.id"
              class="review-item"
            >              <div class="review-header">
                <div class="review-author">
                  <div class="i-mdi:account-circle author-icon"></div>
                  <span class="author-name">
                    {{ nota.expand?.autor?.name || nota.expand?.autor?.email || 'Usuário' }}
                  </span>
                </div>
                <div class="review-rating">
                  <div 
                    v-for="n in 5" 
                    :key="n"
                    :class="['star-small', n <= nota.avaliacao ? 'star-filled' : 'star-empty']"
                  >
                    <div class="i-mdi:star"></div>
                  </div>
                </div>
              </div>
              
              <p v-if="nota.resenha" class="review-text">{{ nota.resenha }}</p>
              
              <div class="review-footer">
                <span class="review-date">{{ formatarData(nota.created) }}</span>
              </div>
            </div>

            <p v-if="notas.length === 0" class="empty-message">
              Nenhuma avaliação ainda. Seja o primeiro a avaliar!
            </p>
          </div>
        </div>

        <!-- Comments Section -->
        <div class="comments-section">
          <h2 class="section-title">
            Comentários
            <span class="count">({{ comentarios.length }})</span>
          </h2>

          <!-- Add Comment (if authenticated) -->
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

          <!-- Comments List -->
          <div class="comments-list">
            <div 
              v-for="comentario in comentarios" 
              :key="comentario.id"
              class="comment-item"
            >              <div class="comment-header">
                <div class="comment-author">
                  <div class="i-mdi:account-circle author-icon"></div>
                  <span class="author-name">
                    {{ comentario.expand?.autor?.name || comentario.expand?.autor?.email || 'Usuário' }}
                  </span>
                </div>
                <span class="comment-date">{{ formatarData(comentario.created) }}</span>
              </div>
              
              <p class="comment-text">{{ comentario.conteudo }}</p>
              
              <!-- Reply Button -->
              <button 
                v-if="isAuthenticated"
                @click="iniciarResposta(comentario.id)"
                class="comment-reply-button"
              >
                <div class="i-mdi:reply"></div>
                Responder
              </button>

              <!-- Reply Form -->
              <div v-if="comentarioRespondendo === comentario.id" class="reply-form">
                <textarea
                  v-model="respostaTexto"
                  placeholder="Escreva sua resposta..."
                  class="reply-textarea"
                  rows="2"
                ></textarea>
                <div class="reply-actions">
                  <button 
                    @click="enviarResposta(comentario.id)"
                    :disabled="!respostaTexto.trim()"
                    class="btn-small btn-primary"
                  >
                    Enviar
                  </button>
                  <button 
                    @click="cancelarResposta"
                    class="btn-small btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              <!-- Replies -->
              <div v-if="comentario.respostas && comentario.respostas.length > 0" class="replies-list">
                <div 
                  v-for="resposta in comentario.respostas" 
                  :key="resposta.id"
                  class="reply-item"
                >                  <div class="comment-header">
                    <div class="comment-author">
                      <div class="i-mdi:account-circle author-icon"></div>
                      <span class="author-name">
                        {{ resposta.expand?.autor?.name || resposta.expand?.autor?.email || 'Usuário' }}
                      </span>
                    </div>
                    <span class="comment-date">{{ formatarData(resposta.created) }}</span>
                  </div>
                  <p class="comment-text">{{ resposta.conteudo }}</p>
                </div>
              </div>
            </div>

            <p v-if="comentarios.length === 0" class="empty-message">
              Nenhum comentário ainda. Inicie a conversa!
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import Header from '~/components/Header.vue';
import { useLivros } from '~/composables/useLivros';
import { useNotas } from '~/composables/useNotas';
import { useComentarios } from '~/composables/useComentarios';
import { useStatus } from '~/composables/useStatus';
import { useTags } from '~/composables/useTags';

const route = useRoute();
const { $pb } = useNuxtApp();

// State
const loading = ref(true);
const error = ref('');
const livro = ref(null);
const dadosAPI = ref({});
const notas = ref([]);
const comentarios = ref([]);
const tagsLivro = ref([]);
const statusAtual = ref('');

// Reviews
const avaliacaoNova = ref(0);
const resenhaTexto = ref('');
const minhaNotaExistente = ref(null);

// Comments
const novoComentario = ref('');
const comentarioRespondendo = ref(null);
const respostaTexto = ref('');

// Tags
const mostrarInputTag = ref(false);
const novaTag = ref('');
const tagInput = ref(null);

// Composables
const { buscarLivroPorISBN, buscarDadosLivroAPI } = useLivros();
const { buscarNotasLivro, criarNota, atualizarNota, buscarNotaUsuario, atualizarMediaAvaliacoes } = useNotas();
const { buscarComentariosComRespostas, criarComentario, responderComentario } = useComentarios();
const { OPCOES_STATUS, buscarStatus, definirStatus } = useStatus();
const { buscarTagsLivro, adicionarOuCriarTag, removerTagDoLivro } = useTags();

const isAuthenticated = computed(() => $pb.authStore.isValid);
const isbn = computed(() => route.params.isbn);

// Load book data
onMounted(async () => {
  await carregarDadosLivro();
});

async function carregarDadosLivro() {
  loading.value = true;
  error.value = '';

  try {
    // Busca livro no banco
    const resultadoLivro = await buscarLivroPorISBN(isbn.value);
    
    if (!resultadoLivro.sucesso) {
      error.value = 'Livro não encontrado.';
      return;
    }

    livro.value = resultadoLivro.dados;

    // Busca dados da API
    const resultadoAPI = await buscarDadosLivroAPI(isbn.value);
    if (resultadoAPI.sucesso) {
      dadosAPI.value = {
        ...resultadoAPI.dados,
        editora: resultadoAPI.dados.editora || '',
        dataPublicacao: resultadoAPI.dados.dataPublicacao || '',
        paginas: resultadoAPI.dados.paginas || ''
      };
    }

    // Busca notas, comentários, tags
    await Promise.all([
      carregarNotas(),
      carregarComentarios(),
      carregarTags()
    ]);

    // Se autenticado, busca status e nota do usuário
    if (isAuthenticated.value) {
      await carregarStatusUsuario();
      await carregarMinhaAvaliacao();
    }

  } catch (err) {
    console.error('Erro ao carregar livro:', err);
    error.value = 'Erro ao carregar informações do livro.';
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
    resenhaTexto.value = resultado.dados.resenha || '';
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
    console.log('Status atualizado com sucesso!');
  } else {
    alert('Erro ao atualizar status: ' + resultado.erro);
  }
}

// Reviews
async function enviarAvaliacao() {
  if (avaliacaoNova.value === 0) return;

  const dados = {
    livro: livro.value.id,
    autor: $pb.authStore.model.id,
    avaliacao: avaliacaoNova.value,
    resenha: resenhaTexto.value.trim()
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
    
    alert(minhaNotaExistente.value ? 'Avaliação atualizada!' : 'Avaliação publicada!');
  } else {
    alert('Erro ao enviar avaliação: ' + resultado.erro);
  }
}

// Comments
async function enviarComentario() {
  if (!novoComentario.value.trim()) return;

  const dados = {
    conteudo: novoComentario.value.trim(),
    autor: $pb.authStore.model.id,
    livro: livro.value.id
  };

  const resultado = await criarComentario(dados);
  
  if (resultado.sucesso) {
    novoComentario.value = '';
    await carregarComentarios();
  } else {
    alert('Erro ao enviar comentário: ' + resultado.erro);
  }
}

function iniciarResposta(comentarioId) {
  comentarioRespondendo.value = comentarioId;
  respostaTexto.value = '';
}

function cancelarResposta() {
  comentarioRespondendo.value = null;
  respostaTexto.value = '';
}

async function enviarResposta(comentarioPaiId) {
  if (!respostaTexto.value.trim()) return;

  const resultado = await responderComentario(
    comentarioPaiId,
    livro.value.id,
    respostaTexto.value.trim(),
    $pb.authStore.model.id
  );

  if (resultado.sucesso) {
    cancelarResposta();
    await carregarComentarios();
  } else {
    alert('Erro ao enviar resposta: ' + resultado.erro);
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
    novaTag.value = '';
  }, 200);
}

async function adicionarTag() {
  if (!novaTag.value.trim()) return;

  const resultado = await adicionarOuCriarTag(livro.value.id, novaTag.value.trim());
  
  if (resultado.sucesso) {
    novaTag.value = '';
    mostrarInputTag.value = false;
    await carregarTags();
  } else {
    alert('Erro ao adicionar tag: ' + resultado.erro);
  }
}

async function removerTag(tagId) {
  if (!confirm('Remover esta tag do livro?')) return;

  const resultado = await removerTagDoLivro(livro.value.id, tagId);
  
  if (resultado.sucesso) {
    await carregarTags();
  } else {
    alert('Erro ao remover tag: ' + resultado.erro);
  }
}

// Utilities
function formatarData(data) {
  const date = new Date(data);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
</script>

<style src="~/styles/pages/livro.css"></style>
