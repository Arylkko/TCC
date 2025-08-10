<script setup>
const { $pb } = useNuxtApp();
const newUser = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
});
function generateTokenKey(length = 50) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
// ...existing code...
async function createUser() {
  if (newUser.value.password !== newUser.value.confirmPassword) {
    alert('As senhas não coincidem.');
    return;
  }
  try {
    const { name, email, password } = newUser.value;
    const tokenKey = generateTokenKey(50); 
    await $pb.collection('users').create({ 
      name, 
      email, 
      password, 
      passwordConfirm: password, // Adicione esta linha
      tokenKey 
    });
    newUser.value.name = '';
    newUser.value.email = '';
    newUser.value.password = '';
    newUser.value.confirmPassword = '';
  } catch (error) {
    alert('Erro ao criar usuário: ' + JSON.stringify(error?.response?.data || error));
  }
}
// ...existing code...

</script>

<template>
<form @submit.prevent="createUser">
  <h3>Criar Novo Usuário</h3>
  
  <div>
    <label for="name">Nome:</label>
    <input type="text" id="name" v-model="newUser.name" required />
  </div>

  <div>
    <label for="email">Email:</label>
    <input type="email" id="email" v-model="newUser.email" required />
  </div>

  <div>
    <label for="password">Senha:</label>
    <input type="password" id="password" v-model="newUser.password" required/>
  </div>

  <div>
    <label for="confirmPassword">Confirme a Senha:</label>
    <input type="password" id="confirmPassword" v-model="newUser.confirmPassword" required/>
  </div>

  <button type="submit">Salvar Usuário</button>
</form>
</template>
