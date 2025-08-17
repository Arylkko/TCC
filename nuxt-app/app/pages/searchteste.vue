<script setup>
import { ref, onMounted } from 'vue';
import { useLivros } from '~/composables/useLivros';
import { useListas } from '~/composables/useListas';

const { $pb } = useNuxtApp();
const route = useRoute();

const searchTerm = ref('');
const results = ref([]);
const loading = ref(false);
const error = ref('');
const saveStatus = ref({}); 
const minhasListas = ref([]);
const mostrarModalListas = ref(false);
const livroSelecionado = ref(null);
const listaEspecifica = ref(null); // Para quando vier de uma lista específica


const apiKey = '';


const { salvarLivro } = useLivros();
const { buscarListasUsuario, adicionarLivroNaLista } = useListas();


onMounted(async () => {
  // Verifica se veio de uma lista específica
  if (route.query.lista) {
    listaEspecifica.value = route.query.lista;
  }
  
  if ($pb.authStore.isValid) {
    const resultado = await buscarListasUsuario($pb.authStore.model.id);
    if (resultado.sucesso) {
      minhasListas.value = resultado.dados;
    }
  }
});


async function searchBooks() {
  error.value = '';
  results.value = [];
  if (!searchTerm.value.trim()) return;
  loading.value = true;
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm.value)}&key=${apiKey}`
    );
    const data = await res.json();
    if (Array.isArray(data.items)) {
      results.value = data.items; // Removida a ordenação por avaliação
    } else {
      results.value = [];
      error.value = 'Nenhum livro encontrado.';
    }
  } catch (e) {
    error.value = 'Erro ao buscar livros.';
    results.value = [];
  } finally {
    loading.value = false;
  }
}

async function salvarLivroNoBanco(item) {
  const id = item.id;
  saveStatus.value[id] = 'salvando';
  const volume = item.volumeInfo;
  const nome = volume.title;

  let isbn = '';
  if (Array.isArray(volume.industryIdentifiers)) {
    const isbnObj = volume.industryIdentifiers.find(i => i.type && i.identifier);
    if (isbnObj) isbn = isbnObj.identifier;
  }

  if (!nome || !isbn) {
    saveStatus.value[id] = 'erro';
    console.log('Erro: Nome ou ISBN não encontrados', { nome, isbn });
    return { sucesso: false, erro: 'Nome ou ISBN não encontrados' };
  }

  const dadosLivro = {
    Nome: nome,
    ISBN: isbn
    // Nota: Avaliações do Google Books removidas - sistema usará avaliações internas
  };

  console.log('Dados do livro para salvar:', dadosLivro);
  const resultado = await salvarLivro(dadosLivro);
  
  if (resultado.sucesso) {
    saveStatus.value[id] = 'salvo';
    console.log('Livro salvo/encontrado com sucesso:', resultado.dados);
    return resultado;
  } else {
    console.error('Erro ao salvar livro:', resultado.erro);
    saveStatus.value[id] = 'erro';
    return resultado;
  }
}

// Abrir modal para selecionar lista
function abrirModalListas(item) {
  if (!$pb.authStore.isValid) {
    alert('Você precisa estar logado para adicionar livros às listas!');
    return;
  }
  
  if (minhasListas.value.length === 0) {
    alert('Você não tem nenhuma lista criada. Crie uma lista primeiro!');
    return;
  }
  
  livroSelecionado.value = item;
  
  // Se veio de uma lista específica, adiciona diretamente
  if (listaEspecifica.value) {
    adicionarLivroALista(listaEspecifica.value);
  } else {
    mostrarModalListas.value = true;
  }
}


async function adicionarLivroALista(listaId) {
  console.log('Iniciando adicionarLivroALista com listaId:', listaId);
  
  if (!livroSelecionado.value) {
    console.log('Erro: Nenhum livro selecionado');
    return;
  }

  const item = livroSelecionado.value;
  const volume = item.volumeInfo;
  
  console.log('Livro selecionado:', volume.title);
  
  try {
    // Primeiro salva o livro no banco
    console.log('Salvando livro no banco...');
    const resultadoSalvar = await salvarLivroNoBanco(item);
    
    if (!resultadoSalvar.sucesso) {
      alert('Erro ao salvar livro: ' + resultadoSalvar.erro);
      return;
    }
    
    const livroNoBanco = resultadoSalvar.dados;
    console.log('Livro salvo/encontrado no banco:', livroNoBanco);
    
    console.log('Adicionando livro à lista...');
    const resultado = await adicionarLivroNaLista(listaId, livroNoBanco.id);
    console.log('Resultado da adição:', resultado);
    
    if (resultado.sucesso) {
      alert('Livro adicionado à lista com sucesso!');
      // Recarrega as listas do usuário
      const resultadoListas = await buscarListasUsuario($pb.authStore.model.id);
      if (resultadoListas.sucesso) {
        minhasListas.value = resultadoListas.dados;
      }
      
      // Se veio de uma lista específica, redireciona de volta
      if (listaEspecifica.value) {
        setTimeout(() => {
          navigateTo(`/lista/${listaEspecifica.value}`);
        }, 1500);
      }
    } else {
      alert('Erro ao adicionar livro à lista: ' + resultado.erro);
    }
  } catch (error) {
    console.error('Erro ao adicionar à lista:', error);
    alert('Erro ao adicionar livro à lista: ' + error.message);
  }
  
  mostrarModalListas.value = false;
  livroSelecionado.value = null;
}
</script>

<template>
  <div>
    <div v-if="listaEspecifica">
      <h1>Adicionar Livros à Lista</h1>
      <p>Pesquise livros para adicionar à sua lista selecionada.</p>
      <button @click="$router.push(`/lista/${listaEspecifica}`)">
        ← Voltar para a Lista
      </button>
      <hr>
    </div>
    
    <h2>Pesquisar Livros (Google Books)</h2>
    <form @submit.prevent="searchBooks">
      <input v-model="searchTerm" type="text" placeholder="Digite o nome do livro..." />
      <button type="submit" :disabled="loading">Pesquisar</button>
    </form>
    <div v-if="loading">Carregando...</div>
    <div v-if="error">{{ error }}</div>
    <ul v-if="Array.isArray(results) && results.length">
      <li v-for="item in results" :key="item.id">
        <div>
          <strong>{{ item.volumeInfo.title }}</strong>
          <div v-if="item.volumeInfo.authors">Autor(es): {{ item.volumeInfo.authors.join(', ') }}</div>

          <div v-if="item.volumeInfo.imageLinks?.thumbnail">
            <img :src="item.volumeInfo.imageLinks.thumbnail" alt="Capa" style="max-height:100px;" />
          </div>
          <button @click="salvarLivroNoBanco(item)" :disabled="saveStatus[item.id]==='salvando' || saveStatus[item.id]==='salvo'">
            <span v-if="saveStatus[item.id]==='salvando'">Salvando...</span>
            <span v-else-if="saveStatus[item.id]==='salvo'">Salvo!</span>
            <span v-else-if="saveStatus[item.id]==='erro'">Erro ao salvar</span>
            <span v-else>Salvar</span>
          </button>
          
          <button 
            v-if="$pb.authStore.isValid" 
            @click="abrirModalListas(item)"
          >
            {{ listaEspecifica ? 'Adicionar' : 'Adicionar à Lista' }}
          </button>
        </div>
      </li>
    </ul>
    
    <!-- Modal para selecionar lista -->
    <div v-if="mostrarModalListas" @click="mostrarModalListas = false">
      <div @click.stop>
        <h3>Adicionar à Lista</h3>
        <p>Selecione uma lista para adicionar "{{ livroSelecionado?.volumeInfo?.title }}":</p>
        <div>
          <button 
            v-for="lista in minhasListas" 
            :key="lista.id"
            @click="adicionarLivroALista(lista.id)"
          >
            {{ lista.nome }}
            <small>({{ lista.livros?.length || 0 }} livros)</small>
          </button>
        </div>
        <button @click="mostrarModalListas = false">
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>
