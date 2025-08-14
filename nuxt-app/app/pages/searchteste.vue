<script setup>
import { ref, onMounted } from 'vue';
import { useLivros } from '~/composables/useLivros';
import { useListas } from '~/composables/useListas';

const { $pb } = useNuxtApp();

const searchTerm = ref('');
const results = ref([]);
const loading = ref(false);
const error = ref('');
const saveStatus = ref({}); 
const minhasListas = ref([]);
const mostrarModalListas = ref(false);
const livroSelecionado = ref(null);

<<<<<<< HEAD
const apiKey = '';


const { salvarLivro } = useLivros();
const { buscarListasUsuario, adicionarLivroNaLista } = useListas();


onMounted(async () => {
  if ($pb.authStore.isValid) {
    const resultado = await buscarListasUsuario($pb.authStore.model.id);
    if (resultado.sucesso) {
      minhasListas.value = resultado.dados;
    }
  }
});


function sortBooks(items) {
  return [...items].sort((a, b) => {
    const aRating = a.volumeInfo.averageRating ?? 0;
    const bRating = b.volumeInfo.averageRating ?? 0;
    if (bRating !== aRating) return bRating - aRating;
    const aCount = a.volumeInfo.ratingsCount ?? 0;
    const bCount = b.volumeInfo.ratingsCount ?? 0;
    return bCount - aCount;
  });
}

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
      results.value = sortBooks(data.items);
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
    return;
  }

  const dadosLivro = {
    Nome: nome,
    ISBN: isbn,
    AvaliacaoMedia: volume.averageRating || 0,
    TotalAvaliacoes: volume.ratingsCount || 0
  };

  const resultado = await salvarLivro(dadosLivro);
  
  if (resultado.sucesso) {
    saveStatus.value[id] = 'salvo';
  } else {
    console.error('Erro ao salvar livro:', resultado.erro);
    saveStatus.value[id] = 'erro';
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
  mostrarModalListas.value = true;
}


async function adicionarLivroALista(listaId) {
  if (!livroSelecionado.value) return;

  const item = livroSelecionado.value;
  const volume = item.volumeInfo;
  
  
  await salvarLivroNoBanco(item);
  
  
  const isbn = volume.industryIdentifiers?.find(i => i.type && i.identifier)?.identifier;
  if (!isbn) {
    alert('Erro: ISBN não encontrado');
    return;
  }

  try {
   
    const livroNoBanco = await $pb.collection('livro').getFirstListItem(`ISBN = "${isbn}"`);
    
    const resultado = await adicionarLivroNaLista(listaId, livroNoBanco.id);
    
    if (resultado.sucesso) {
      alert('Livro adicionado à lista com sucesso!');
    } else {
      alert('Erro ao adicionar livro à lista: ' + resultado.erro);
    }
  } catch (error) {
    console.error('Erro ao adicionar à lista:', error);
    alert('Erro ao adicionar livro à lista');
  }
  
  mostrarModalListas.value = false;
  livroSelecionado.value = null;
}
</script>

<template>
  <div>
    <h2>Pesquisar Livros (Google Books)</h2>
    <form @submit.prevent="searchBooks">
      <input v-model="searchTerm" type="text" placeholder="Digite o nome do livro..." />
      <button type="submit" :disabled="loading">Pesquisar</button>
    </form>
    <div v-if="loading">Carregando...</div>
    <div v-if="error" style="color:red;">{{ error }}</div>
    <ul v-if="Array.isArray(results) && results.length">
      <li v-for="item in results" :key="item.id" style="margin-bottom: 1em;">
        <div>
          <strong>{{ item.volumeInfo.title }}</strong>
          <div v-if="item.volumeInfo.authors">Autor(es): {{ item.volumeInfo.authors.join(', ') }}</div>
          <div v-if="item.volumeInfo.averageRating">
            Avaliação média: {{ item.volumeInfo.averageRating }} ⭐
          </div>
          <div v-if="item.volumeInfo.ratingsCount">
            ({{ item.volumeInfo.ratingsCount }} avaliações)
          </div>
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
            style="margin-left: 10px;"
          >
            Adicionar à Lista
          </button>
        </div>
      </li>
    </ul>
    
    <!-- Modal para selecionar lista -->
    <div v-if="mostrarModalListas" class="modal-overlay" @click="mostrarModalListas = false">
      <div class="modal-content" @click.stop>
        <h3>Adicionar à Lista</h3>
        <p>Selecione uma lista para adicionar "{{ livroSelecionado?.volumeInfo?.title }}":</p>
        <div class="listas-options">
          <button 
            v-for="lista in minhasListas" 
            :key="lista.id"
            @click="adicionarLivroALista(lista.id)"
            class="lista-option"
          >
            {{ lista.nome }}
            <small>({{ lista.livros?.length || 0 }} livros)</small>
          </button>
        </div>
        <button @click="mostrarModalListas = false" class="botao-cancelar">
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin: 0 0 16px 0;
  color: #333;
}

.modal-content p {
  margin: 0 0 20px 0;
  color: #666;
}

.listas-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.lista-option {
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s;
}

.lista-option:hover {
  background: #e9ecef;
  border-color: #007bff;
}

.lista-option small {
  display: block;
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}

.botao-cancelar {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
}

.botao-cancelar:hover {
  background: #545b62;
}
</style>
