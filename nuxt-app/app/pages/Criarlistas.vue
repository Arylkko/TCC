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
  <div>
    <h1>Gerenciar Minhas Listas</h1>

    <div v-if="mensagem">
      {{ mensagem }}
    </div>

    <!-- Formulário para criar nova lista -->
    <div>
      <h2>Criar Nova Lista</h2>
      <form @submit.prevent="handleCriarLista">
        <div>
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

        <div>
          <label for="descricao-lista">Descrição (opcional)</label>
          <textarea
            id="descricao-lista"
            v-model="descricaoLista"
            placeholder="Descreva o objetivo desta lista..."
            rows="3"
            :disabled="loading"
          ></textarea>
        </div>

        <div>
          <input
            id="lista-publica"
            v-model="listaPublica"
            type="checkbox"
            :disabled="loading"
          />
          <label for="lista-publica">Tornar esta lista pública</label>
        </div>

        <div>
          <button type="submit" :disabled="loading">
            <span v-if="loading">Criando...</span>
            <span v-else>Criar Lista</span>
          </button>
          <button type="button" @click="limparFormulario" :disabled="loading">
            Limpar
          </button>
        </div>
      </form>
    </div>

    <div>
      <h2>Minhas Listas</h2>
      
      <div v-if="loading && minhasListas.length === 0">
        Carregando suas listas...
      </div>

      <div v-else-if="minhasListas.length === 0">
        <p>Você ainda não criou nenhuma lista.</p>
        <p>Crie sua primeira lista usando o formulário acima!</p>
      </div>

      <div v-else>
        <div v-for="lista in minhasListas" :key="lista.id">
          <div>
            <h3>{{ lista.nome }}</h3>
            <span>{{ formatarData(lista.created) }}</span>
          </div>
          
          <div>
            <p v-if="lista.descricao">{{ lista.descricao }}</p>
            <p v-else>Sem descrição</p>
            
            <div>
              <span>{{ lista.livros?.length || 0 }} livros</span>
              <span>{{ lista.publica ? 'Pública' : 'Privada' }}</span>
            </div>
          </div>

          <div>
            <button @click="$router.push(`/lista/${lista.id}`)">
              Ver/Editar
            </button>
            <button 
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