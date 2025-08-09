<script setup>
const { $pb } = useNuxtApp();
const newPost = ref({
  title: '',
  content: ''
});

async function createPost() {
  try {
    const record = await $pb.collection('account').create(newPost.value);
    newPost.value.username = '';
    newPost.value.password = '';

  } catch (error) {
    alert('Erro ao criar post: ' + error.message);
  }
}
</script>

<template>
<form @submit.prevent="createPost">
  <h3>Criar Novo Post</h3>
  
  <div>
    <label for="title">User:</label>
    <input type="text" id="title" v-model="newPost.username" required />
  </div>

  <div>
    <label for="content">Senha:</label>
    <input type="text" id="content" v-model="newPost.password" required/>
  </div>

  <button type="submit">Salvar Post</button>
</form>
</template>