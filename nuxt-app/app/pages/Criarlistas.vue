<script setup>
import { ref, onMounted } from 'vue';
import { useListas } from '~/composables/useListas';

const { $pb } = useNuxtApp();
const router = useRouter();

const isLoggedIn = ref(false);
const loading = ref(false);
const mensagem = ref('');
const tipoMensagem = ref('');


const nomeLista = ref('');
const descricaoLista = ref('');
const listaPublica = ref(false);


const minhasListas = ref([]);

const { 
  criarLista, 
  buscarListasUsuario, 
  deletarLista 
} = useListas();


onMounted(async () => {
  isLoggedIn.value = $pb.authStore.isValid;
  
  if (!isLoggedIn.value) {
    router.push('/login');
    return;
  }
  
  await carregarMinhasListas();
});

const carregarMinhasListas = async () => {
  if (!$pb.authStore.model?.id) return;
  
  loading.value = true;
  const resultado = await buscarListasUsuario($pb.authStore.model.id);
  
  if (resultado.sucesso) {
    minhasListas.value = resultado.dados;
  } else {
    mostrarMensagem('Erro ao carregar suas listas: ' + resultado.erro, 'erro');
  }
  loading.value = false;
};


const handleCriarLista = async () => {
  if (!nomeLista.value.trim()) {
    mostrarMensagem('Por favor, digite um nome para a lista.', 'erro');
    return;
  }

  loading.value = true;
  
  const dadosLista = {
    nome: nomeLista.value,
    descricao: descricaoLista.value || '',
    publica: listaPublica.value,
    autor: $pb.authStore.model.id,
    livros: [] 
  };

  const resultado = await criarLista(dadosLista);
  
  if (resultado.sucesso) {
    mostrarMensagem('Lista criada com sucesso!', 'sucesso');
    limparFormulario();
    await carregarMinhasListas(); 
  } else {
    mostrarMensagem('Erro ao criar lista: ' + resultado.erro, 'erro');
  }
  
  loading.value = false;
};


const handleDeletarLista = async (listaId, nomeLista) => {
  if (!confirm(`Tem certeza que deseja deletar a lista "${nomeLista}"?`)) {
    return;
  }

  loading.value = true;
  const resultado = await deletarLista(listaId);
  
  if (resultado.sucesso) {
    mostrarMensagem('Lista deletada com sucesso!', 'sucesso');
    await carregarMinhasListas();
  } else {
    mostrarMensagem('Erro ao deletar lista: ' + resultado.erro, 'erro');
  }
  loading.value = false;
};


const limparFormulario = () => {
  nomeLista.value = '';
  descricaoLista.value = '';
  listaPublica.value = false;
};


const mostrarMensagem = (texto, tipo) => {
  mensagem.value = texto;
  tipoMensagem.value = tipo;
  

  setTimeout(() => {
    mensagem.value = '';
    tipoMensagem.value = '';
  }, 5000);
};


const formatarData = (dataString) => {
  return new Date(dataString).toLocaleDateString('pt-BR');
};
</script>

<template>
  <div class="criar-listas-container">
    <h1>Gerenciar Minhas Listas</h1>

    
    <div v-if="mensagem" :class="['mensagem', tipoMensagem]">
      {{ mensagem }}
    </div>

    <!-- Formulário para criar nova lista -->
    <div class="formulario-container">
      <h2>Criar Nova Lista</h2>
      <form @submit.prevent="handleCriarLista" class="formulario-lista">
        <div class="campo">
          <label for="nome-lista">Nome da Lista *</label>
          <input
            id="nome-lista"
            v-model="nomeLista"
            type="text"
            placeholder="Ex: Livros para ler em 2025"
            required
            :disabled="loading"
          />
        </div>

        <div class="campo">
          <label for="descricao-lista">Descrição (opcional)</label>
          <textarea
            id="descricao-lista"
            v-model="descricaoLista"
            placeholder="Descreva o objetivo desta lista..."
            rows="3"
            :disabled="loading"
          ></textarea>
        </div>

        <div class="campo-checkbox">
          <input
            id="lista-publica"
            v-model="listaPublica"
            type="checkbox"
            :disabled="loading"
          />
          <label for="lista-publica">Tornar esta lista pública</label>
        </div>

        <div class="botoes">
          <button type="submit" :disabled="loading" class="botao-principal">
            <span v-if="loading">Criando...</span>
            <span v-else>Criar Lista</span>
          </button>
          <button type="button" @click="limparFormulario" :disabled="loading" class="botao-secundario">
            Limpar
          </button>
        </div>
      </form>
    </div>

   
    <div class="minhas-listas-container">
      <h2>Minhas Listas</h2>
      
      <div v-if="loading && minhasListas.length === 0" class="loading">
        Carregando suas listas...
      </div>

      <div v-else-if="minhasListas.length === 0" class="sem-listas">
        <p>Você ainda não criou nenhuma lista.</p>
        <p>Crie sua primeira lista usando o formulário acima!</p>
      </div>

      <div v-else class="listas-grid">
        <div v-for="lista in minhasListas" :key="lista.id" class="card-lista">
          <div class="card-header">
            <h3>{{ lista.nome }}</h3>
            <span class="data-criacao">{{ formatarData(lista.created) }}</span>
          </div>
          
          <div class="card-body">
            <p v-if="lista.descricao" class="descricao">{{ lista.descricao }}</p>
            <p v-else class="sem-descricao">Sem descrição</p>
            
            <div class="info-lista">
              <span class="livros-count">{{ lista.livros?.length || 0 }} livros</span>
              <span :class="['visibilidade', lista.publica ? 'publica' : 'privada']">
                {{ lista.publica ? 'Pública' : 'Privada' }}
              </span>
            </div>
          </div>

          <div class="card-actions">
            <button class="botao-editar" @click="$router.push(`/lista/${lista.id}`)">
              Ver/Editar
            </button>
            <button 
              class="botao-deletar" 
              @click="handleDeletarLista(lista.id, lista.nome)"
              :disabled="loading"
            >
              Deletar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.criar-listas-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.mensagem {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
}

.mensagem.sucesso {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.mensagem.erro {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.formulario-container {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.formulario-lista {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.campo label {
  font-weight: 600;
  color: #333;
}

.campo input,
.campo textarea {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.campo input:focus,
.campo textarea:focus {
  outline: none;
  border-color: #007bff;
}

.campo-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
}

.campo-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.botoes {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.botao-principal {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.botao-principal:hover:not(:disabled) {
  background: #0056b3;
}

.botao-principal:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.botao-secundario {
  background: #6c757d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.botao-secundario:hover:not(:disabled) {
  background: #545b62;
}

.minhas-listas-container h2 {
  margin-bottom: 20px;
  color: #333;
}

.loading,
.sem-listas {
  text-align: center;
  padding: 40px;
  color: #666;
}

.listas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.card-lista {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card-lista:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.data-criacao {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.card-body {
  margin-bottom: 20px;
}

.descricao {
  color: #555;
  margin-bottom: 15px;
  line-height: 1.4;
}

.sem-descricao {
  color: #999;
  font-style: italic;
  margin-bottom: 15px;
}

.info-lista {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.livros-count {
  color: #666;
  font-weight: 500;
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

.card-actions {
  display: flex;
  gap: 10px;
}

.botao-editar {
  flex: 1;
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.botao-editar:hover {
  background: #218838;
}

.botao-deletar {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.botao-deletar:hover:not(:disabled) {
  background: #c82333;
}

.botao-deletar:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .criar-listas-container {
    padding: 15px;
  }
  
  .listas-grid {
    grid-template-columns: 1fr;
  }
  
  .botoes {
    flex-direction: column;
  }
  
  .card-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .card-actions {
    flex-direction: column;
  }
}
</style>