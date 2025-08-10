<script setup>
import { ref, onMounted } from 'vue';
const { $pb } = useNuxtApp();

const isLoggedIn = ref(false);
const userName = ref('');      

onMounted(async () => {
  const jwt = localStorage.getItem('pb_jwt');

  if (!jwt) {
    isLoggedIn.value = false;
    return; 
  }

  try {
    $pb.authStore.save(jwt, null);
    const authData = await $pb.collection('users').authRefresh();
    isLoggedIn.value = true;
    userName.value = authData.record.name || 'Usuário';

  } catch (error) {
    console.error("Falha ao validar a sessão:", error);
    isLoggedIn.value = false;

    $pb.authStore.clear();
    localStorage.removeItem('pb_jwt');
    localStorage.removeItem('userName');
}});

</script>

<template>
  <div>
      <div v-if="isLoggedIn">
        <h1>olá, {{ userName }}!</h1>
        <p>oiiiiiiiiii</p>
        </div>

      <div v-else>
        <h1>bem-vindo ao nosso site!</h1>
        <p>sem login.</p>
        <p>
          links de acesso:
          <NuxtLink to="/login">faça o login</NuxtLink> ou 
          <NuxtLink to="/cadastro">crie uma conta</NuxtLink>.
        </p>
      </div>

    </div>
</template>