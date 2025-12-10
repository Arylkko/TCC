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
                    :src="comentario.expand.autor.avatarUrl" 
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
                    <span class="font-bold text-roxo">{{
                        comentario.expand?.livro?.Nome || "Livro"
                    }}</span>
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
                class="text-lg leading-relaxed text-texto/90 whitespace-pre-wrap break-all font-serif"
            >
                {{ comentario.conteudo }}
            </div>            <div class="mt-10 pt-6 border-t border-texto/10 flex gap-4">
                <div 
                  @click="darLikeComentario"
                  class="flex items-center gap-2 cursor-pointer hover:scale-110 transition"
                  :class="{ 'text-red-500': usuarioDeulLikeComentario(comentario, $pb.authStore.model?.id) }"
                >
                  <div 
                    :class="[
                      'text-xl',
                      usuarioDeulLikeComentario(comentario, $pb.authStore.model?.id) 
                        ? 'i-mdi:heart' 
                        : 'i-mdi:heart-outline'
                    ]"
                  ></div>
                  <span class="font-bold">{{ comentario.likes?.length || 0 }}</span> Likes
                </div>

                <div class="flex items-center gap-1 text-roxo cursor-pointer" @click="iniciarResposta(comentario.id)">
                <button class="bg-transparent border-0 p-0 text-roxo flex items-center gap-1">
                    <div class="i-mdi:comment text-xl"></div>
                    <span>Responder</span>
                </button>
                </div>
            </div>
            </article>

            <div v-if="comentarioRespondendo === comentario.id" class="mb-8 animate-fade-in bg-white/50 p-4 rounded-[20px]">
            <label class="block mb-2 text-sm font-bold text-roxo">Sua resposta:</label>
            <textarea
                v-model="respostaTexto"
                placeholder="Escreva sua resposta..."
                class="w-full p-4 rounded-[15px] border border-roxo/30 bg-white focus:outline-none focus:border-roxo mb-3 resize-none font-serif"
                rows="3"
            ></textarea>
            <div class="flex gap-2 justify-end">
                <button @click="cancelarResposta" class="px-4 py-2 text-sm text-texto/70 hover:text-texto">
                Cancelar
                </button>
                <button
                @click="enviarResposta(comentario.id)"
                :disabled="!respostaTexto.trim()"
                class="px-6 py-2 bg-roxo text-white rounded-full hover:opacity-90 transition disabled:opacity-50"
                >
                Enviar Resposta
                </button>
            </div>
            </div>

            <div v-if="comentario.respostas && comentario.respostas.length > 0" class="flex flex-col gap-4 md: border-l-2 border-roxo/20">
            <div class="w-full max-w-screen-lg mb-6 sm:mb-8">
              <h2
                class="bg-incipit-card text-texto font-display text-center rounded-[30px] justify-self-start px-15 shadow-lg"
              >
                Respostas
                <span class="text-xl text-texto opacity-60 font-medium">({{ comentario.respostas.length }})</span>
              </h2>
              </div>
            
            <div
                v-for="resposta in comentario.respostas"
                :key="resposta.id"
                class="p-5 bg-incipit-card rounded-[20px] shadow-sm"
            >
                <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-roxo/10 flex items-center justify-center text-roxo">
                    <div class="i-mdi:account text-lg"></div>
                    </div>
                    <span class="font-bold text-sm text-texto">
                    {{
                        resposta.expand?.autor?.name ||
                        resposta.expand?.autor?.email ||
                        "Usuário"
                    }}
                    </span>
                </div>
                <span class="text-xs text-texto/50">{{ formatarData(resposta.created) }}</span>
                </div>
                <p class="text-texto/90 leading-relaxed break-all">{{ resposta.conteudo }}</p>
            </div>
            </div>

        </div>
        </main>
    </div>
    </template>

    <script setup>
    import { ref, onMounted, computed } from "vue";
    import { useRoute } from "vue-router";
    import Header from "~/components/Header.vue";
    import { useComentarios } from "~/composables/useComentarios";
    import { useLikes } from "~/composables/useLikes";

    const route = useRoute();
    const { buscarComentarioPorId, responderComentario } = useComentarios();
    const { toggleLikeComentario, usuarioDeulLikeComentario } = useLikes();
    const { $pb } = useNuxtApp();

    // Estados
    const loading = ref(true);
    const error = ref("");
    const comentario = ref(null);
    const comentarioRespondendo = ref(null);
    const respostaTexto = ref("");

    // ID vindo da URL
    const comentarioId = computed(() => route.params.id);

    // Função unificada para carregar os dados
    async function carregarDadosComentario() {
    if (!comentarioId.value) {
        error.value = "ID do comentário não encontrado.";
        return;
    }

    const resultado = await buscarComentarioPorId(comentarioId.value);

    if (resultado.sucesso) {
        comentario.value = resultado.dados;
    } else {
        error.value = "Não foi possível encontrar este comentário.";
    }
    }

    // Inicialização
    onMounted(async () => {
    loading.value = true;
    await carregarDadosComentario();
    loading.value = false;
    });

    function formatarData(dataString) {
    if (!dataString) return "";
    return new Date(dataString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
    }

    // --- Lógica de Resposta ---

    function iniciarResposta(id) {
    comentarioRespondendo.value = id;
    respostaTexto.value = "";
    }

    function cancelarResposta() {
    comentarioRespondendo.value = null;
    respostaTexto.value = "";
    }

    async function enviarResposta(comentarioPaiId) {
    if (!respostaTexto.value.trim()) return;

    // CORREÇÃO CRÍTICA: Pegar o ID do livro do próprio objeto comentário
    // Tenta pegar direto ou via expand, dependendo da estrutura do PocketBase
    const livroId = comentario.value.livro || comentario.value.expand?.livro?.id;

    if (!livroId) {
        alert("Erro interno: Não foi possível identificar o ID do livro.");
        return;
    }

    const resultado = await responderComentario(
        comentarioPaiId,
        livroId,
        respostaTexto.value.trim(),
        $pb.authStore.model.id
    );

    if (resultado.sucesso) {
        cancelarResposta();
        // Recarrega o comentário para exibir a nova resposta na lista
        await carregarDadosComentario();
    } else {
        alert("Erro ao enviar resposta: " + resultado.erro);
    }
    }

    // Likes
    async function darLikeComentario() {
      if (!$pb.authStore.isValid) {
        alert('Faça login para curtir');
        return;
      }

      const resultado = await toggleLikeComentario(comentarioId.value);
      if (resultado.sucesso) {
        await carregarDadosComentario();
      } else {
        alert('Erro ao curtir: ' + resultado.erro);
      }
    }
    </script>