<script setup>
import { ref, onMounted } from 'vue';
import { useListas } from '~/composables/useListas';

const { $pb } = useNuxtApp();
const route = useRoute();
const router = useRouter();

const lista = ref(null);
const livros = ref([]);
const loading = ref(true);
const error = ref('');

const { buscarListaPorId, removerLivroDaLista } = useListas();

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
    
  } catch (error) {
    console.error('Erro ao carregar lista:', error);
    error.value = 'Erro ao carregar a lista';
  } finally {
    loading.value = false;
  }
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
  <div class="lista-container">
    <div v-if="loading" class="loading">
      Carregando lista...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
      <button @click="$router.push('/Criarlistas')" class="botao-voltar">
        Voltar às Minhas Listas
      </button>
    </div>

    <div v-else-if="lista" class="lista-detalhes">
      <!-- Cabeçalho da lista -->
      <div class="lista-header">
        <div class="header-info">
          <h1>{{ lista.nome }}</h1>
          <div class="lista-meta">
            <span class="data">Criada em {{ formatarData(lista.created) }}</span>
            <span class="autor">Por {{ lista.expand?.autor?.name || 'Usuário' }}</span>
            <span :class="['visibilidade', lista.publica ? 'publica' : 'privada']">
              {{ lista.publica ? 'Lista Pública' : 'Lista Privada' }}
            </span>
          </div>
          <p v-if="lista.descricao" class="descricao">{{ lista.descricao }}</p>
        </div>
        
        <div class="header-actions">
          <button @click="$router.push('/Criarlistas')" class="botao-secundario">
            Voltar
          </button>
          <button 
            v-if="podeEditar" 
            @click="$router.push('/searchteste')" 
            class="botao-principal"
          >
            Adicionar Livros
          </button>
        </div>
      </div>

      <!-- Lista de livros -->
      <div class="livros-section">
        <h2>Livros na Lista ({{ livros.length }})</h2>
        
        <div v-if="livros.length === 0" class="sem-livros">
          <p>Esta lista ainda não tem livros.</p>
          <button 
            v-if="podeEditar" 
            @click="$router.push('/searchteste')" 
            class="botao-principal"
          >
            Pesquisar e Adicionar Livros
          </button>
        </div>

        <div v-else class="livros-grid">
          <div v-for="livro in livros" :key="livro.id" class="card-livro">
            <div class="livro-capa">
              <img 
                v-if="livro.Capa" 
                :src="livro.Capa" 
                :alt="livro.Nome"
                @error="$event.target.style.display = 'none'"
              />
              <div v-else class="sem-capa">
                📚
              </div>
            </div>
            
            <div class="livro-info">
              <h3>{{ livro.Nome }}</h3>
              <p v-if="livro.Autor" class="autor">{{ livro.Autor }}</p>
              <p class="isbn">ISBN: {{ livro.ISBN }}</p>
              
              <div v-if="livro.AvaliacaoMedia > 0" class="avaliacao">
                <span class="estrelas">
                  {{ '★'.repeat(Math.round(livro.AvaliacaoMedia)) }}{{ '☆'.repeat(5 - Math.round(livro.AvaliacaoMedia)) }}
                </span>
                <span class="nota">{{ livro.AvaliacaoMedia }}/5</span>
                <span class="total">({{ livro.TotalAvaliacoes }} avaliações)</span>
              </div>
            </div>

            <div v-if="podeEditar" class="livro-actions">
              <button 
                @click="removerLivro(livro.id)" 
                class="botao-remover"
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

<style scoped>
.lista-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  color: #dc3545;
}

.botao-voltar {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 15px;
}

.lista-header {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.header-info {
  flex: 1;
}

.header-info h1 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 2.5em;
}

.lista-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.lista-meta span {
  font-size: 14px;
  color: #666;
}

.visibilidade {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.visibilidade.publica {
  background: #d1ecf1;
  color: #0c5460;
}

.visibilidade.privada {
  background: #f8d7da;
  color: #721c24;
}

.descricao {
  color: #555;
  line-height: 1.6;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-direction: column;
}

.botao-principal {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.botao-principal:hover {
  background: #0056b3;
}

.botao-secundario {
  background: #6c757d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.botao-secundario:hover {
  background: #545b62;
}

.livros-section h2 {
  margin-bottom: 20px;
  color: #333;
}

.sem-livros {
  text-align: center;
  padding: 40px;
  color: #666;
}

.livros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.card-livro {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.card-livro:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.livro-capa {
  text-align: center;
  margin-bottom: 15px;
}

.livro-capa img {
  max-width: 80px;
  max-height: 120px;
  object-fit: cover;
  border-radius: 4px;
}

.sem-capa {
  width: 80px;
  height: 120px;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2em;
  margin: 0 auto;
}

.livro-info h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
  line-height: 1.3;
}

.livro-info .autor {
  color: #666;
  font-size: 14px;
  margin: 0 0 5px 0;
}

.livro-info .isbn {
  color: #999;
  font-size: 12px;
  margin: 0 0 10px 0;
}

.avaliacao {
  font-size: 12px;
}

.estrelas {
  color: #ffc107;
  margin-right: 5px;
}

.nota {
  font-weight: 600;
  color: #333;
  margin-right: 5px;
}

.total {
  color: #666;
}

.livro-actions {
  position: absolute;
  top: 10px;
  right: 10px;
}

.botao-remover {
  background: #dc3545;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.botao-remover:hover {
  background: #c82333;
}

@media (max-width: 768px) {
  .lista-container {
    padding: 15px;
  }
  
  .lista-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .header-actions {
    flex-direction: row;
    width: 100%;
  }
  
  .livros-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  .lista-meta {
    flex-direction: column;
    gap: 5px;
  }
}
</style>
