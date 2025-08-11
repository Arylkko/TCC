<script setup>
import { ref } from 'vue';

const { $pb } = useNuxtApp();

const searchTerm = ref('');
const results = ref([]);
const loading = ref(false);
const error = ref('');
const saveStatus = ref({}); // status de salvamento por livro


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

async function salvarLivro(item) {
  const id = item.id;
  saveStatus.value[id] = 'salvando';
  const volume = item.volumeInfo;
  const nome = volume.title;

  let isbn = '';
  if (Array.isArray(volume.industryIdentifiers)) {
    const isbnObj = volume.industryIdentifiers.find(i => i.type && i.identifier);
    if (isbnObj) isbn = isbnObj.identifier;
  }
  // Log para depuração
  console.log('Tentando salvar:', { Nome: nome, ISBN: isbn });

  if (!nome || !isbn) {
    saveStatus.value[id] = 'erro';
    return;
  }
  try {
    await $pb.collection('livro').create({
      Nome: nome,
      ISBN: isbn
    });
    saveStatus.value[id] = 'salvo';
  } catch (e) {
    // Mostra o erro detalhado no console
    console.error('Erro ao salvar livro:', e?.response?.data || e);
    saveStatus.value[id] = 'erro';
  }
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
          <button @click="salvarLivro(item)" :disabled="saveStatus[item.id]==='salvando' || saveStatus[item.id]==='salvo'">
            <span v-if="saveStatus[item.id]==='salvando'">Salvando...</span>
            <span v-else-if="saveStatus[item.id]==='salvo'">Salvo!</span>
            <span v-else-if="saveStatus[item.id]==='erro'">Erro ao salvar</span>
            <span v-else>Salvar</span>
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
