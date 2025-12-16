<template>
  <div class="min-h-screen bg-incipit-fundo font-sono text-texto pb-10">
    <Header :show-search="true" />

    <main class="relative z-1 container mx-auto px-4 mt-8 max-w-4xl box-border">
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center min-h-[60vh] gap-4"
      >
        <div
          class="w-10 h-10 border-4 border-roxo border-t-transparent rounded-full animate-spin"
        ></div>
        <p class="text-lg animate-pulse">Carregando comentário...</p>
      </div>

      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-red-500"
      >
        <div class="i-mdi:alert-circle text-6xl"></div>
        <p class="text-xl">{{ error }}</p>
        <button
          @click="$router.go(-1)"
          class="px-6 py-2 bg-roxo text-white rounded-full hover:opacity-90 transition"
        >
          Voltar
        </button>
      </div>

      <div v-else-if="comentario" class="animate-fade-in">
        <button
          @click="$router.go(-1)"
          class="mb-6 rounded-[50%] w-10 h-10 border-0 flex items-center justify-center bg-[rgba(166,141,173,0.2)] text-roxo hover:bg-roxo/20 transition"
        >
          <div class="i-mdi:arrow-left text-xl"></div>
        </button>

        <article
          class="bg-incipit-card rounded-[30px] shadow-xl p-6 md:px-8 relative overflow-hidden mb-8"
        >
          <div
            class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-texto/10 pb-6"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-14 h-14 rounded-full bg-roxo/20 flex-shrink-0 overflow-hidden flex items-center justify-center"
              >
                <img
                  v-if="comentario.expand?.autor?.avatar"
                  :src="getAvatarUsuario(comentario.expand.autor)"
                  class="w-full h-full object-cover"
                  alt="Avatar"
                />
                <div v-else class="i-mdi:account text-3xl text-roxo"></div>
              </div>

              <div>
                <h3 class="text-xl font-display text-texto">
                  {{ comentario.expand?.autor?.name || "Usuário" }}
                </h3>
                <p class="text-sm text-texto/60">
                  Comentário feito em
                  <span class="font-bold text-roxo cursor-pointer hover:underline" @click="navegarParaOrigem">
                    {{ nomeOrigem }}
                  </span>
                </p>
              </div>
            </div>

            <div class="flex flex-col items-start md:items-end">
              <span class="text-xs text-texto/50 uppercase tracking-wide">
                {{ formatarData(comentario.created) }}
              </span>
            </div>
          </div>

          <h1
            v-if="comentario.titulo"
            class="text-2xl md:text-3xl font-display font-bold text-texto mb-6"
          >
            {{ comentario.titulo }}
          </h1>

          <div
            class="text-lg leading-relaxed text-texto/90 whitespace-pre-wrap break-all font-sono"
          >
            {{ comentario.conteudo }}
          </div>

          <div class="mt-10 pt-6 border-t border-texto/10 flex gap-4">
            <div
              @click="darLikeComentario"
              class="flex items-center gap-2 cursor-pointer hover:scale-110 transition"
              :class="{
                'text-red-500': usuarioDeulLikeComentario(
                  comentario,
                  $pb.authStore.model?.id
                ),
              }"
            >
              <div
                :class="[
                  'text-xl',
                  usuarioDeulLikeComentario(
                    comentario,
                    $pb.authStore.model?.id
                  )
                    ? 'i-mdi:heart'
                    : 'i-mdi:heart-outline',
                ]"
              ></div>
              <span class="font-bold">{{
                comentario.likes?.length || 0
              }}</span>
              Likes
            </div>
          </div>
        </article>

        <div
          v-if="isAuthenticated"
          class="mb-4 animate-fade-in bg-incipit-card rounded-[20px] p-4 shadow-lg flex gap-3 items-start"
        >
          <div
            class="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden"
          >
            <img
              v-if="getAvatarUsuario(usuarioAtual)"
              :src="getAvatarUsuario(usuarioAtual)"
              class="w-full h-full object-cover"
              alt="Seu Avatar"
            />
            <div v-else class="w-full h-full bg-roxo"></div>
          </div>
          
          <div class="flex-1">
            <textarea
              v-model="novoComentario"
              placeholder="Responda ao comentário principal..."
              rows="2"
              class="w-full bg-incipit-fundo box-border rounded-xl p-3 border border-roxo/10 focus:ring-2 focus:ring-roxo outline-none resize-none text-sm mb-2"
            ></textarea>

            <div class="flex items-center justify-end">
              <button
                @click="enviarComentario"
                :disabled="!novoComentario.trim() || enviandoComentario"
                class="botao text-branco px-2 py-0.5 disabled:opacity-50 flex items-center gap-1 transition"
              >
                <span class="text-sm">
                  {{ enviandoComentario ? "Enviando..." : "Enviar" }}
                </span>
                <div
                  :class="[
                    'text-xl',
                    enviandoComentario ? 'i-mdi:loading animate-spin' : 'i-mdi:send',
                  ]"
                ></div>
              </button>
            </div>
          </div>
        </div>
        
        <div
          v-if="comentario.respostas && comentario.respostas.length > 0"
          class="flex flex-col gap-4 pl-4 md:pl-6 border-l-2 border-roxo/20"
        >
          <div class="w-full max-w-screen-lg mb-6 sm:mb-8">
            <h2
              class="bg-incipit-card text-texto font-display text-center rounded-[30px] justify-self-start px-15 shadow-lg"
            >
              Respostas
              <span class="text-xl text-texto opacity-60 font-medium"
                >({{ comentario.respostas.length }})</span
              >
            </h2>
          </div>

          <div
            v-for="resposta in comentario.respostas"
            :key="resposta.id"
            class="p-5 bg-incipit-card rounded-[20px] shadow-sm"
          >
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-full bg-roxo/20 flex-shrink-0 overflow-hidden flex items-center justify-center"
                >
                  <img
                    v-if="resposta.expand?.autor?.avatar"
                    :src="getAvatarUsuario(resposta.expand.autor)"
                    class="w-full h-full object-cover"
                    alt="Avatar da resposta"
                  />
                  <div v-else class="i-mdi:account text-lg text-roxo"></div>
                </div>

                <span class="font-bold text-sm text-texto">
                  {{
                    resposta.expand?.autor?.name ||
                    resposta.expand?.autor?.email ||
                    "Usuário"
                  }}
                </span>
              </div>
              <span class="text-xs text-texto/50">{{
                formatarData(resposta.created)
              }}</span>
            </div>
            <p class="text-texto/90 leading-relaxed break-all">
              {{ resposta.conteudo }}
            </p>
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
import { useComentarios } from "~/composables/useComentarios";
import { useLikes } from "~/composables/useLikes";

const route = useRoute();
const router = useRouter();
const { buscarComentarioPorId, responderComentario } = useComentarios(); 
const { toggleLikeComentario, usuarioDeulLikeComentario } = useLikes();
const { $pb } = useNuxtApp();

// --- ESTADOS ---
const novoComentario = ref("");
const enviandoComentario = ref(false);
const loading = ref(true);
const error = ref("");
const comentario = ref(null);

// Computeds
const comentarioId = computed(() => route.params.id);
const isAuthenticated = computed(() => $pb.authStore.isValid);
const usuarioAtual = computed(() => $pb.authStore.model);

// Computed para o nome da origem (Livro ou Comunidade)
const nomeOrigem = computed(() => {
  if (!comentario.value) return "Local Desconhecido";
  
  // Verifica se tem livro expandido
  if (comentario.value.expand?.livro?.Nome) {
    return comentario.value.expand.livro.Nome;
  }
  
  // Verifica se tem comunidade expandida
  if (comentario.value.expand?.comunidade?.nome) {
    return comentario.value.expand.comunidade.nome;
  }
  
  return "Local Desconhecido";
});

// Computed para o tipo e ID da origem
const origemInfo = computed(() => {
  if (!comentario.value) return { tipo: null, id: null };
  
  // Verifica livro (campo direto ou expandido)
  if (comentario.value.livro) {
    return { tipo: 'livro', id: comentario.value.livro };
  }
  if (comentario.value.expand?.livro?.id) {
    return { tipo: 'livro', id: comentario.value.expand.livro.id };
  }
  
  // Verifica comunidade (campo direto ou expandido)
  if (comentario.value.comunidade) {
    return { tipo: 'comunidade', id: comentario.value.comunidade };
  }
  if (comentario.value.expand?.comunidade?.id) {
    return { tipo: 'comunidade', id: comentario.value.expand.comunidade.id };
  }
  
  return { tipo: null, id: null };
});

// Funções de Utilidade
function formatarData(dataString) {
  if (!dataString) return "";
  return new Date(dataString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getAvatarUsuario(usuario) {
  if (!usuario || !usuario.avatar) return null;
  const BASE_URL = $pb.baseUrl;
  return `${BASE_URL}/api/files/users/${usuario.id}/${usuario.avatar}`;
}

// Navegar para a origem (Livro ou Comunidade)
function navegarParaOrigem() {
  const { tipo, id } = origemInfo.value;
  
  if (!tipo || !id) {
    alert("Não foi possível identificar a origem do comentário.");
    return;
  }
  
  if (tipo === 'livro') {
    // Precisamos buscar o ISBN do livro para navegar
    buscarISBNLivro(id);
  } else if (tipo === 'comunidade') {
    router.push(`/comunidade/${id}`);
  }
}

// Buscar ISBN do livro para navegação
async function buscarISBNLivro(livroId) {
  try {
    const livro = await $pb.collection('livro').getOne(livroId, {
      fields: 'ISBN'
    });
    
    if (livro.ISBN) {
      router.push(`/livro/${livro.ISBN}`);
    } else {
      alert("ISBN do livro não encontrado.");
    }
  } catch (error) {
    console.error("Erro ao buscar ISBN:", error);
    alert("Erro ao navegar para o livro.");
  }
}

// Lógica de Carregamento
async function carregarDadosComentario() {
  if (!comentarioId.value) {
    error.value = "ID do comentário não encontrado.";
    return;
  }

  const resultado = await buscarComentarioPorId(comentarioId.value); 

  if (resultado.sucesso) {
    comentario.value = resultado.dados;
    
    // DEBUG: Ver o que está vindo
    console.log('Comentário carregado:', comentario.value);
    console.log('Origem Info:', origemInfo.value);
    console.log('Nome Origem:', nomeOrigem.value);
  } else {
    error.value = "Não foi possível encontrar este comentário.";
  }
}

onMounted(async () => {
  loading.value = true;
  await carregarDadosComentario();
  loading.value = false;
});

// Lógica de Resposta
async function enviarComentario() {
  if (!novoComentario.value.trim() || !isAuthenticated.value) return;

  enviandoComentario.value = true;
  
  const comentarioPaiId = comentario.value.id;
  const { tipo, id } = origemInfo.value;

  if (!id || !tipo) {
    alert("Erro interno: Não foi possível identificar a origem (Livro/Comunidade) para a resposta.");
    enviandoComentario.value = false;
    return;
  }

  // Chamada corrigida: Passa o ID da origem e o TIPO
  const resultado = await responderComentario(
    comentarioPaiId,
    id,
    novoComentario.value.trim(),
    $pb.authStore.model.id,
    tipo
  );

  if (resultado.sucesso) {
    novoComentario.value = ""; 
    await carregarDadosComentario();
    alert("Resposta enviada com sucesso!");
  } else {
    alert("Erro ao enviar resposta: " + resultado.erro);
  }
  
  enviandoComentario.value = false;
}

// Likes
async function darLikeComentario() {
  if (!$pb.authStore.isValid) {
    alert("Faça login para curtir");
    return;
  }

  const resultado = await toggleLikeComentario(comentarioId.value);
  if (resultado.sucesso) {
    await carregarDadosComentario();
  } else {
    alert("Erro ao curtir: " + resultado.erro);
  }
}
</script>