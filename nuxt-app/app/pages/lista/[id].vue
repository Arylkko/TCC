<script setup>
import { ref, onMounted } from 'vue';
import { useListas } from '~/composables/useListas';
import { useLivros } from '~/composables/useLivros';

const { $pb } = useNuxtApp();
const route = useRoute();
const router = useRouter();

const lista = ref(null);
const livros = ref([]);
const livrosComDados = ref([]); // Array para livros com dados da API
const loading = ref(true);
const error = ref('');

const { buscarListaPorId, removerLivroDaLista } = useListas();
const { buscarDadosLivroAPI } = useLivros();

onMounted(async () => {
  await carregarLista();
});

const carregarLista = async () => {
  const listaId = route.params.id;
  
  if (!listaId) {
    error.value = 'ID da lista não encontrado';
    loading.value = false;
    return;
  }

  loading.value = true;
  
  try {
    const resultado = await $pb.collection('listas').getOne(listaId, {
      expand: 'livros,autor'
    });
    
    lista.value = resultado;
    livros.value = resultado.expand?.livros || [];
    
    console.log('Lista carregada:', resultado);
    console.log('Livros expandidos:', resultado.expand?.livros);
    
    // Enriquecer livros com dados da API
    await enriquecerLivrosComAPI();
    
  } catch (error) {
    console.error('Erro ao carregar lista:', error);
    error.value = 'Erro ao carregar a lista';
  } finally {
    loading.value = false;
  }
};

const enriquecerLivrosComAPI = async () => {
  const livrosEnriquecidos = [];
  
  for (const livro of livros.value) {
    console.log('Buscando dados para livro:', livro.Nome, 'ISBN:', livro.ISBN);
    
    const dadosAPI = await buscarDadosLivroAPI(livro.ISBN);
    
    if (dadosAPI.sucesso) {
      livrosEnriquecidos.push({
        ...livro,
        autor: dadosAPI.dados.autor,
        capa: dadosAPI.dados.capa,
        descricao: dadosAPI.dados.descricao
      });
    } else {
      // Se não conseguir buscar na API, mantém só os dados do banco
      livrosEnriquecidos.push({
        ...livro,
        autor: 'Autor não informado',
        capa: '',
        descricao: ''
      });
    }
  }
  
  livrosComDados.value = livrosEnriquecidos;
  console.log('Livros enriquecidos:', livrosComDados.value);
};

const removerLivro = async (livroId) => {
  if (!confirm('Tem certeza que deseja remover este livro da lista?')) {
    return;
  }

  const resultado = await removerLivroDaLista(lista.value.id, livroId);
  
  if (resultado.sucesso) {
    
    await carregarLista();
  } else {
    alert('Erro ao remover livro: ' + resultado.erro);
  }
};

const podeEditar = computed(() => {
  return $pb.authStore.isValid && 
         lista.value && 
         lista.value.autor === $pb.authStore.model?.id;
});

const formatarData = (dataString) => {
  return new Date(dataString).toLocaleDateString('pt-BR');
};
</script>

<template>
  <div>
    <div v-if="loading">
      Carregando lista...
    </div>

    <div v-else-if="error">
      {{ error }}
      <button @click="$router.push('/Criarlistas')">
        Voltar às Minhas Listas
      </button>
    </div>

    <div v-else-if="lista">
      <!-- Cabeçalho da lista -->
      <div>
        <div>
          <h1>{{ lista.nome }}</h1>
          <div>
            <span>Criada em {{ formatarData(lista.created) }}</span>
            <span>Por {{ lista.expand?.autor?.name || 'Usuário' }}</span>
            <span>{{ lista.publica ? 'Lista Pública ' : 'Lista Privada ' }}</span>
          </div>
          <p v-if="lista.descricao">{{ lista.descricao }}</p>
        </div>
        
        <div>
          <button @click="$router.push('/Criarlistas')">
            Voltar
          </button>
          <button 
            v-if="podeEditar" 
            @click="$router.push('/searchteste?lista=' + lista.id)"
          >
            Adicionar Livros
          </button>
        </div>
      </div>

      <!-- Lista de livros -->
      <div>
        <h2>Livros na Lista ({{ livrosComDados.length }})</h2>
        
        <div v-if="livrosComDados.length === 0 && !loading">
          <p>Esta lista ainda não tem livros.</p>
        </div>

        <div v-else-if="loading">
          <p>Carregando informações dos livros...</p>
        </div>

        <div v-else>
          <div v-for="livro in livrosComDados" :key="livro.id">
            <div>
              <img 
                v-if="livro.capa && livro.capa.trim() !== ''" 
                :src="livro.capa" 
                :alt="livro.Nome"
                style="max-height:100px; max-width:80px; object-fit: cover;"
                @error="console.log('Erro ao carregar capa:', livro.capa); $event.target.style.display = 'none'"
              />
              <div v-else style="width: 80px; height: 100px; display: flex; align-items: center; justify-content: center; border: 1px solid #ccc; background: #f5f5f5;">
                📚
              </div>
            </div>
            
            <div>
              <h3>{{ livro.Nome }}</h3>
              <p v-if="livro.autor">{{ livro.autor }}</p>
              <p>ISBN: {{ livro.ISBN }}</p>
            </div>

            <div v-if="podeEditar"> 
              <button 
                @click="removerLivro(livro.id)" 
                title="Remover da lista"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
