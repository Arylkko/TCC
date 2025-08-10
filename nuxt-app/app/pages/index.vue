<script setup>
const { $pb } = useNuxtApp();
const userName = ref('');
const isValid = ref(false);



onMounted(async () => {
  const jwt = localStorage.getItem('pb_jwt');
  if (!jwt) {
    return navigateTo('/login');
  }
  
  $pb.authStore.save(jwt, null);

  try {

    const user = await $pb.collection('users').authRefresh();
    userName.value = user.record.name || 'Usuário';
    isValid.value = true;
  } catch (error) {
    navigateTo('/login');
  }
});
</script>

<template>
  <div>
    <div v-if="isValid">
      <h1>Bem-vindo, {{ userName }}!</h1>
    </div>
    
  </div>
</template>
