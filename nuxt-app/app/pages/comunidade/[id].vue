<script setup>
import { ref, onMounted, computed } from 'vue';
import { useComunidades } from '~/composables/useComunidades';

const { $pb } = useNuxtApp();
const route = useRoute();
const router = useRouter();

const comunidadeId = route.params.id;
const comunidade = ref(null);
const loading = ref(true);
const error = ref('');

// Livro da semana
const mostrarModalLivro = ref(false);
const livroIdInput = ref('');
const diasDuracao = ref(7);

// Comentários
const comentarios = ref([]);
const novoComentario = ref('');
const enviandoComentario = ref(false);

const {
  buscarComunidadePorId,
  entrarNaComunidade,
  sairDaComunidade,
  ehLider,
  ehMembro,
  definirLivroSemana,
  buscarComentarios,
  criarComentario
} = useComunidades();

const usuarioAtual = computed(() => $pb.authStore.model);
const souLider = computed(() => ehLider(comunidade.value));
const souMembro = computed(() => ehMembro(comunidade.value));

// Calcular dias restantes
const diasRestantes = computed(() => {
  if (!comunidade.value?.data_fim_leitura) {
    console.log('Sem data_fim_leitura definida');
    return null;
  }
  
  console.log('data_fim_leitura do banco:', comunidade.value.data_fim_leitura);
  const fim = new Date(comunidade.value.data_fim_leitura);
  const hoje = new Date();
  
  console.log('Data fim:', fim);
  console.log('Data hoje:', hoje);
  console.log('Timestamp fim:', fim.getTime());
  console.log('Timestamp hoje:', hoje.getTime());
  
  const diff = Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
  console.log('Diferença em dias:', diff);
  
  return diff > 0 ? diff : 0;
});

async function carregarComunidade() {
  loading.value = true;
  error.value = '';
  
  const resultado = await buscarComunidadePorId(comunidadeId);
  
  if (resultado.sucesso) {
    comunidade.value = resultado.dados;
  } else {
    error.value = 'Erro ao carregar comunidade: ' + resultado.erro;
  }
  
  loading.value = false;
}

async function carregarComentarios() {
  const resultado = await buscarComentarios(comunidadeId);
  if (resultado.sucesso) {
    comentarios.value = resultado.dados;
  }
}

async function toggleMembership() {
  console.log('toggleMembership chamado');
  console.log('souMembro:', souMembro.value);
  console.log('comunidadeId:', comunidadeId);
  console.log('usuarioAtual:', usuarioAtual.value?.id);
  
  if (souMembro.value) {
    console.log('Tentando sair da comunidade...');
    const resultado = await sairDaComunidade(comunidadeId);
    console.log('Resultado sair:', resultado);
    
    if (resultado.sucesso) {
      alert('Você saiu da comunidade');
      await carregarComunidade();
    } else {
      alert(resultado.erro);
    }
  } else {
    console.log('Tentando entrar na comunidade...');
    const resultado = await entrarNaComunidade(comunidadeId);
    console.log('Resultado entrar:', resultado);
    
    if (resultado.sucesso) {
      alert('Você entrou na comunidade!');
      await carregarComunidade();
    } else {
      alert(resultado.erro);
    }
  }
}

async function salvarLivroSemana() {
  if (!livroIdInput.value.trim()) {
    alert('Digite o ID do livro');
    return;
  }

  const resultado = await definirLivroSemana(comunidadeId, livroIdInput.value, diasDuracao.value);
  
  if (resultado.sucesso) {
    alert('Livro da semana definido com sucesso!');
    mostrarModalLivro.value = false;
    livroIdInput.value = '';
    await carregarComunidade();
  } else {
    alert('Erro: ' + resultado.erro);
  }
}

async function enviarComentario() {
  if (!novoComentario.value.trim()) {
    alert('Digite um comentário');
    return;
  }

  enviandoComentario.value = true;
  const resultado = await criarComentario(comunidadeId, novoComentario.value);
  
  if (resultado.sucesso) {
    novoComentario.value = '';
    await carregarComentarios();
  } else {
    alert('Erro ao enviar comentário: ' + resultado.erro);
  }
  
  enviandoComentario.value = false;
}

function formatarData(data) {
  if (!data) return '';
  return new Date(data).toLocaleDateString('pt-BR');
}

onMounted(async () => {
  await carregarComunidade();
  await carregarComentarios();
});
</script>

<template>
  <div>
    <h1>Comunidade</h1>

    <button @click="router.push('/comunidades')">Voltar para comunidades</button>

    <div v-if="loading">Carregando...</div>
    <div v-else-if="error">{{ error }}</div>
    
    <div v-else-if="comunidade">
      <h2>{{ comunidade.nome }}</h2>
      
      <p><strong>Descrição:</strong> {{ comunidade.descricao || 'Sem descrição' }}</p>
      
      <p><strong>Líder:</strong> {{ comunidade.expand?.lider?.name || 'Desconhecido' }}</p>
      
      <p><strong>Membros:</strong> {{ comunidade.membros?.length || 0 }}</p>

      <div v-if="comunidade.expand?.membros && comunidade.expand.membros.length > 0">
        <h3>Lista de Membros:</h3>
        <ul>
          <li v-for="membro in comunidade.expand.membros" :key="membro.id">
            {{ membro.name || membro.username }}
            <span v-if="membro.id === comunidade.lider"> (Líder)</span>
          </li>
        </ul>
      </div>

      <hr>

      <!-- LIVRO DA SEMANA -->
      <div>
        <h3>Livro da Semana</h3>
        
        <div v-if="comunidade.livro_semana">
          <p><strong>Livro:</strong> {{ comunidade.expand?.livro_semana?.Nome || 'Carregando...' }}</p>
          <p v-if="diasRestantes !== null">
            <strong>Tempo restante:</strong> {{ diasRestantes }} dias
          </p>
          <p><strong>Data fim:</strong> {{ formatarData(comunidade.data_fim_leitura) }}</p>
          
          <button v-if="souLider" @click="mostrarModalLivro = true">
            Trocar livro da semana
          </button>
        </div>
        
        <div v-else>
          <p>Nenhum livro da semana definido.</p>
          <button v-if="souLider" @click="mostrarModalLivro = true">
            Definir livro da semana
          </button>
        </div>
      </div>

      <hr>

      <!-- COMENTÁRIOS -->
      <div>
        <h3>Comentários</h3>
        
        <div v-if="souMembro">
          <h4>Novo Comentário:</h4>
          <textarea 
            v-model="novoComentario" 
            placeholder="Escreva seu comentário..."
            rows="3"
            style="width: 100%; max-width: 500px;"
          ></textarea>
          <br>
          <button 
            @click="enviarComentario" 
            :disabled="enviandoComentario || !novoComentario.trim()"
          >
            {{ enviandoComentario ? 'Enviando...' : 'Enviar Comentário' }}
          </button>
        </div>
        <p v-else>Entre na comunidade para comentar</p>

        <div v-if="comentarios.length > 0">
          <h4>Comentários ({{ comentarios.length }}):</h4>
          <div 
            v-for="comentario in comentarios" 
            :key="comentario.id"
            style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;"
          >
            <p>
              <strong>{{ comentario.expand?.autor?.name || comentario.expand?.autor?.username || 'Anônimo' }}</strong>
              - {{ formatarData(comentario.created) }}
            </p>
            <p>{{ comentario.conteudo }}</p>
          </div>
        </div>
        <p v-else style="margin-top: 15px;">Nenhum comentário ainda. Seja o primeiro!</p>
      </div>

      <hr>

      <div style="margin-top: 20px;">
        <button v-if="!usuarioAtual" @click="router.push('/login')">
          Fazer login para participar
        </button>
        <button v-else-if="!souMembro" @click="toggleMembership">
          Entrar na comunidade
        </button>
        <button v-else-if="!souLider" @click="toggleMembership">
          Sair da comunidade
        </button>
        <span v-if="souLider" style="color: green; margin-left: 10px;">
          Você é o líder desta comunidade
        </span>
      </div>
    </div>

    <!-- MODAL DEFINIR LIVRO -->
    <div v-if="mostrarModalLivro" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
      <div style="background: white; padding: 20px; border-radius: 5px; max-width: 400px; width: 90%;">
        <h3>Definir Livro da Semana</h3>
        
        <p>Digite o ID do livro (você pode copiar da URL do livro):</p>
        
        <label>ID do Livro:</label>
        <br>
        <input 
          v-model="livroIdInput" 
          type="text" 
          placeholder="Ex: abc123..."
          style="width: 100%; padding: 5px; margin: 5px 0;"
        />
        
        <br><br>
        
        <label>Duração (dias):</label>
        <br>
        <input 
          v-model.number="diasDuracao" 
          type="number" 
          min="1" 
          max="365"
          style="width: 100px; padding: 5px;"
        />
        
        <br><br>
        
        <button @click="salvarLivroSemana">Salvar</button>
        <button @click="mostrarModalLivro = false" style="margin-left: 10px;">Cancelar</button>
      </div>
    </div>
  </div>
</template>
