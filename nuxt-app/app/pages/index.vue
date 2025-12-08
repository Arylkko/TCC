<template>
  <div>
    <Header :show-search="true" />

    <main>
      <!-- Loading State -->
      <div v-if="loading">
        <p>Carregando página inicial...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error">
        <p>Erro: {{ error }}</p>
      </div>

      <!-- Main Content -->
      <div v-else>
        <!-- Bem-vindo -->
        <section>
          <h1>Bem-vindo de volta, {{ userName }}!</h1>
        </section>

        <!-- Atualmente lendo -->
        <section v-if="livrosLendo.length > 0">
          <h2>Atualmente lendo</h2>
          <div>
            <div v-for="livro in livrosLendo" :key="livro.isbn">
              <NuxtLink :to="`/livro/${livro.isbn}`">
                <img 
                  v-if="livro.capa" 
                  :src="livro.capa" 
                  :alt="livro.nome"
                  width="150"
                  height="200"
                />
                <div v-else>Sem capa</div>
                <h3>{{ livro.nome }}</h3>
                <p>{{ livro.autor }}</p>
              </NuxtLink>
            </div>
          </div>
        </section>

        <!-- Recomendações por gênero -->
        <section v-if="recomendacoes.length > 0">
          <h2>Porque você gostou de {{ generoDestaque }}</h2>
          <div>
            <div v-for="livro in recomendacoes" :key="livro.isbn">
              <NuxtLink :to="`/livro/${livro.isbn}`">
                <img 
                  v-if="livro.capa" 
                  :src="livro.capa" 
                  :alt="livro.nome"
                  width="150"
                  height="200"
                />
                <div v-else>Sem capa</div>
                <p>Gênero</p>
              </NuxtLink>
            </div>
          </div>
        </section>

        <!-- Livros Populares -->
        <section v-if="livrosPopulares.length > 0">
          <h2>Livros populares</h2>
          <p>Quer ler algo e não sabe exatamente o que está procurando? Explore os livros mais populares no momento!</p>
          <div>
            <div v-for="livro in livrosPopulares" :key="livro.isbn">
              <NuxtLink :to="`/livro/${livro.isbn}`">
                <img 
                  v-if="livro.capa" 
                  :src="livro.capa" 
                  :alt="livro.nome"
                  width="150"
                  height="200"
                />
                <div v-else>Sem capa</div>
                <h3>Título</h3>
                <p>Autor</p>
              </NuxtLink>
            </div>
          </div>
        </section>

        <!-- Listas Populares -->
        <section v-if="listasPopulares.length > 0">
          <h2>Listas Populares</h2>
          <p>Acesse as listas de livros criadas pelos usuários do Incipit.</p>
          <div>
            <div v-for="lista in listasPopulares" :key="lista.id">
              <NuxtLink :to="`/lista/${lista.id}`">
                <h3>{{ lista.nome }}</h3>
                <p>{{ lista.descricao || 'Sem descrição' }}</p>
              </NuxtLink>
            </div>
          </div>
        </section>

        <!-- Comunidades Populares (Sidebar) -->
        <aside v-if="comunidadesPopulares.length > 0">
          <h2>Comunidades populares</h2>
          <div>
            <div v-for="comunidade in comunidadesPopulares" :key="comunidade.id">
              <NuxtLink :to="`/comunidade/${comunidade.id}`">
                <img 
                  v-if="comunidade.imagem" 
                  :src="comunidade.imagem" 
                  :alt="comunidade.nome"
                  width="100"
                  height="100"
                />
                <div v-else>Sem imagem</div>
                <h3>{{ comunidade.nome }}</h3>
                <p>Criado por {{ comunidade.lider }}</p>
                <button>Acessar</button>
              </NuxtLink>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Header from '~/components/Header.vue';

const { $pb } = useNuxtApp();
const router = useRouter();

// Composables
const {
  buscarLivrosLendo,
  buscarRecomendacoesPorGenero,
  buscarLivrosPopulares,
  buscarListasPopulares,
  buscarComunidadesPopulares
} = useHome();

// Estado
const loading = ref(true);
const error = ref(null);
const userName = ref('');
const userId = ref('');

// Dados da página
const livrosLendo = ref([]);
const recomendacoes = ref([]);
const generoDestaque = ref('');
const livrosPopulares = ref([]);
const listasPopulares = ref([]);
const comunidadesPopulares = ref([]);

// Verificar autenticação e carregar dados
onMounted(async () => {
  try {
    // Verificar se usuário está autenticado
    if (!$pb.authStore.isValid) {
      return router.push('/login');
    }

    const user = $pb.authStore.model;
    if (!user) {
      return router.push('/login');
    }

    userName.value = user.name || user.username || 'Usuário';
    userId.value = user.id;    // Carregar todos os dados em paralelo
    const [
      resultLendo,
      resultRecomendacoes,
      resultPopulares,
      resultListas,
      resultComunidades
    ] = await Promise.all([
      buscarLivrosLendo(userId.value),
      buscarRecomendacoesPorGenero(userId.value),
      buscarLivrosPopulares(),
      buscarListasPopulares(),
      buscarComunidadesPopulares()
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
    console.error('Erro ao carregar página inicial:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>
