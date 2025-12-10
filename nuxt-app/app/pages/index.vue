<template>
  <div class="min-h-screen bg-incipit-fundo font-sono">
    <Header :show-search="true" />

    <main class="container mx-auto px-4 py-8 max-w-[1400px] box-border">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center min-h-[60vh] gap-4"
      >
        <div
          class="w-10 h-10 border-4 border-roxo border-t-transparent rounded-full animate-spin"
        ></div>
        <p class="text-lg animate-pulse text-texto">Carregando página inicial...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-vermelho"
      >
        <div class="i-mdi:alert-circle text-6xl"></div>
        <p class="text-xl">Erro: {{ error }}</p>
      </div>

      <!-- main -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-20 items-start">
        <div class="flex flex-col gap-6">
          <section>
            <h1 class="text-2xl font-bold text-texto font-sono mb-0">
              Bem-vindo de volta, {{ userName }}!
            </h1>
          </section>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <section v-if="livrosLendo.length > 0">
              <div class="w-full max-w-screen-lg">
                <h2
                  class="bg-incipit-card text-texto font-display text-center mt-0 rounded-[30px] justify-self-start px-15 shadow-lg"
                >
                  Atualmente Lendo
                </h2>
              </div>
              <div class="bg-incipit-card rounded-[30px] p-6 shadow-xl">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div
                    v-for="livro in livrosLendo"
                    :key="livro.isbn"
                    class="text-center group"
                  >
                    <NuxtLink :to="`/livro/${livro.isbn}`" class="block no-underline">
                      <div
                        class="bg-incipit-base rounded-lg aspect-[2/3] overflow-hidden mb-2 shadow-md group-hover:scale-105 transition-transform"
                      >
                        <img
                          v-if="livro.capa"
                          :src="livro.capa"
                          :alt="livro.nome"
                          class="w-full h-full object-cover"
                        />
                        <div
                          v-else
                          class="w-full h-full flex items-center justify-center"
                        >
                          <div class="i-mdi:book text-6xl text-texto/30"></div>
                        </div>
                      </div>
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </section>

            <section v-if="recomendacoes.length > 0">
              <div class="w-full max-w-screen-lg">
                <h2
                  class="bg-incipit-card text-texto font-display text-center mt-0 rounded-[30px] justify-self-start px-15 shadow-lg"
                >
                  Porque você gostou de {{ generoDestaque }}
                </h2>
              </div>
              <div class="bg-incipit-card rounded-[30px] p-6 shadow-xl">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div
                    v-for="livro in recomendacoes"
                    :key="livro.isbn"
                    class="text-center group"
                  >
                    <NuxtLink :to="`/livro/${livro.isbn}`" class="block no-underline">
                      <div
                        class="bg-incipit-base rounded-lg aspect-[2/3] overflow-hidden mb-2 shadow-md group-hover:scale-105 transition-transform"
                      >
                        <img
                          v-if="livro.capa"
                          :src="livro.capa"
                          :alt="livro.nome"
                          class="w-full h-full object-cover"
                        />
                        <div
                          v-else
                          class="w-full h-full flex items-center justify-center"
                        >
                          <div class="i-mdi:book text-6xl text-texto/30"></div>
                        </div>
                      </div>
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section v-if="livrosPopulares.length > 0" class="mt-4">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div class="col-span-4">
                <h2 class="text-6xl font-bold text-texto mb-2 font-display mt-0">
                  Livros populares
                </h2>
                <p class="text-sm text-texto mb-6 max-w-[600px]">
                  Quer ler algo e não sabe exatamente o que está procurando? Explore os
                  livros mais populares no momento!
                </p>
              </div>

              <div
                class="col-span-8 bg-incipit-card rounded-[30px] shadow-xl p-6 relative flex items-center"
              >
                <button
                  @click="scrollCarousel('popular', -1)"
                  class="flex-shrink-0 w-10 h-10 bg-roxo/50 rounded-full flex items-center justify-center shadow-md hover:bg-roxo/60 hover:scale-110 transition border-0 cursor-pointer absolute left-4 z-10"
                >
                  <div class="i-mdi:chevron-left text-2xl text-texto"></div>
                </button>

                <div
                  ref="popularCarousel"
                  class="flex gap-6 overflow-x-auto scroll-smooth py-2 px-10"
                  style="
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                  "
                >
                  <div
                    v-for="livro in livrosPopulares"
                    :key="livro.isbn"
                    class="flex-shrink-0 w-[180px] text-center group"
                  >
                    <NuxtLink :to="`/livro/${livro.isbn}`" class="block no-underline">
                      <div
                        class="bg-incipit-base rounded-xl aspect-[2/3] overflow-hidden mb-1 shadow-lg group-hover:scale-105 transition-transform relative"
                      >
                        <img
                          v-if="livro.capa"
                          :src="livro.capa"
                          :alt="livro.nome"
                          class="w-full h-full object-cover"
                        />
                        <div
                          v-else
                          class="w-full h-full flex items-center justify-center"
                        >
                          <div class="i-mdi:book text-6xl text-texto/30"></div>
                        </div>

                        <div
                          class="absolute bottom-0 left-0 bg-roxo/80 backdrop-blur-sm px-2 py-1 rounded-tr-lg text-white text-xs font-bold flex items-center gap-1"
                        >
                          <div class="i-mdi:star text-sm text-amarelo"></div>
                          {{ livro.media }}
                        </div>
                      </div>

                      <h3 class="text-sm font-bold text-texto mb-1 line-clamp-2">
                        {{ livro.nome }}
                      </h3>
                      <p class="text-xs text-texto/70 mb-0">{{ livro.autor }}</p>
                    </NuxtLink>
                  </div>
                </div>

                <button
                  @click="scrollCarousel('popular', 1)"
                  class="flex-shrink-0 w-10 h-10 bg-roxo/50 rounded-full flex items-center justify-center shadow-md hover:bg-roxo/60 hover:scale-110 transition border-0 cursor-pointer absolute right-4 z-10"
                >
                  <div class="i-mdi:chevron-right text-2xl text-texto"></div>
                </button>
              </div>
            </div>
          </section>

          <section v-if="listasPopulares.length > 0" class="mt-4">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div class="col-span-4">
                <h2 class="text-6xl font-bold text-texto mb-2 font-display mt-0">
                  Listas Recentes
                </h2>
                <p class="text-sm text-texto mb-6 max-w-[600px]">
                  Acesse as listas de livros criadas pelos usuários do Incipit.
                </p>
              </div>

              <div
                class="col-span-8 bg-incipit-card rounded-[30px] shadow-xl p-6 relative flex items-center"
              >
                <button
                  @click="scrollCarousel('listas', -1)"
                  class="flex-shrink-0 w-10 h-10 bg-roxo/50 rounded-full flex items-center justify-center shadow-md hover:bg-roxo/60 hover:scale-110 transition border-0 cursor-pointer absolute left-4 z-10"
                >
                  <div class="i-mdi:chevron-left text-2xl text-texto"></div>
                </button>

                <div
                  ref="listasCarousel"
                  class="flex gap-6 overflow-x-auto scroll-smooth py-2 px-10"
                  style="
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                  "
                >
                  <div
                    v-for="lista in listasPopulares"
                    :key="lista.id"
                    class="flex-shrink-0 w-[180px] group"
                  >
                    <NuxtLink :to="`/lista/${lista.id}`" class="block no-underline">
                      <div
                        class="bg-incipit-base rounded-xl aspect-[2/3] overflow-hidden mb-2 p-4 shadow-lg flex flex-col justify-between hover:scale-[1.02] transition-transform"
                      >
                        <div>
                          <h3
                            class="text-texto font-display text-base font-bold mb-2 line-clamp-2"
                          >
                            {{ lista.nome }}
                          </h3>
                          <p class="text-texto/70 text-xs line-clamp-4">
                            {{ lista.descricao || "Sem descrição" }}
                          </p>
                        </div>
                      </div>
                    </NuxtLink>
                  </div>
                </div>

                <button
                  @click="scrollCarousel('listas', 1)"
                  class="flex-shrink-0 w-10 h-10 bg-roxo/50 rounded-full flex items-center justify-center shadow-md hover:bg-roxo/60 hover:scale-110 transition border-0 cursor-pointer absolute right-4 z-10"
                >
                  <div class="i-mdi:chevron-right text-2xl text-texto"></div>
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside v-if="comunidadesPopulares.length > 0">
          <div class="w-full mb-4">
            <h2
              class="bg-incipit-card text-texto font-display text-center rounded-[30px] px-8 py-2 shadow-lg"
            >
              Comunidades populares
            </h2>
          </div>
          <div class="flex flex-col gap-4">
            <div
              v-for="comunidade in comunidadesPopulares"
              :key="comunidade.id"
              class="bg-incipit-card rounded-[20px] p-4 shadow-xl text-center group hover:shadow-2xl transition"
            >
              <NuxtLink :to="`/comunidade/${comunidade.id}`" class="block no-underline">
                <div
                  class="w-[100px] h-[100px] rounded-full bg-incipit-base mx-auto mb-3 overflow-hidden flex items-center justify-center shadow-md group-hover:scale-105 transition-transform"
                >
                  <img
                    v-if="comunidade.imagem"
                    :src="comunidade.imagem"
                    :alt="comunidade.nome"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="i-mdi:account-group text-4xl text-texto/30"></div>
                </div>
                <h3 class="text-sm font-bold text-texto mb-1">
                  {{ comunidade.nome }}
                </h3>
                <p class="text-xs text-texto/70 mb-3">
                  Criado por {{ comunidade.lider }}
                </p>
                <button class="botao w-full">Acessar</button>
              </NuxtLink>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import Header from "~/components/Header.vue";

const { $pb } = useNuxtApp();
const router = useRouter();

// Composables
const {
  buscarLivrosLendo,
  buscarRecomendacoesPorGenero,
  buscarLivrosPopulares,
  buscarListasRecentes,
  buscarComunidadesPopulares,
} = useHome();

// Estado
const loading = ref(true);
const error = ref(null);
const userName = ref("");
const userId = ref("");

// Dados da página
const livrosLendo = ref([]);
const recomendacoes = ref([]);
const generoDestaque = ref("");
const livrosPopulares = ref([]);
const listasPopulares = ref([]);
const comunidadesPopulares = ref([]);

// Refs para carrosséis
const popularCarousel = ref(null);
const listasCarousel = ref(null);

// Função para scroll do carrossel
const scrollCarousel = (type, direction) => {
  const carousel = type === "popular" ? popularCarousel.value : listasCarousel.value;
  if (carousel) {
    const scrollAmount = 300;
    carousel.scrollBy({
      left: direction * scrollAmount,
      behavior: "smooth",
    });
  }
};

// Verificar autenticação e carregar dados
onMounted(async () => {
  try {
    // Verificar se usuário está autenticado
    if (!$pb.authStore.isValid) {
      return router.push("/login");
    }

    const user = $pb.authStore.model;
    if (!user) {
      return router.push("/login");
    }

    userName.value = user.name || user.username || "Usuário";
    userId.value = user.id;

    // Carregar todos os dados em paralelo
    const [
      resultLendo,
      resultRecomendacoes,
      resultPopulares,
      resultListas,
      resultComunidades,
    ] = await Promise.all([
      buscarLivrosLendo(userId.value),
      buscarRecomendacoesPorGenero(userId.value),
      buscarLivrosPopulares(),
      buscarListasRecentes(),
      buscarComunidadesPopulares(),
    ]);

    // Processar resultados
    if (resultLendo.sucesso) {
      livrosLendo.value = resultLendo.dados;
    }

    if (resultRecomendacoes.sucesso) {
      recomendacoes.value = resultRecomendacoes.dados;
      if (recomendacoes.value.length > 0 && recomendacoes.value[0].genero) {
        const genero = Array.isArray(recomendacoes.value[0].genero)
          ? recomendacoes.value[0].genero[0]
          : recomendacoes.value[0].genero;
        generoDestaque.value = genero;
      }
    }

    if (resultPopulares.sucesso) {
      livrosPopulares.value = resultPopulares.dados;
    }

    if (resultListas.sucesso) {
      listasPopulares.value = resultListas.dados;
    }

    if (resultComunidades.sucesso) {
      comunidadesPopulares.value = resultComunidades.dados;
    }
  } catch (err) {
    console.error("Erro ao carregar página inicial:", err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>
