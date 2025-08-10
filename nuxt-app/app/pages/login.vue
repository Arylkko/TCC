<script setup>
const { $pb } = useNuxtApp();
const router = useRouter();
const form = ref({
  email: '',
  password: '',
});   
const errorMsg = ref('');

async function login() {
  errorMsg.value = '';
  try {
    const authData = await $pb.collection('users').authWithPassword(
      form.value.email,
      form.value.password
    );
    localStorage.setItem('pb_jwt', authData.token); 
    localStorage.setItem('userName', authData.record.name);
    router.push('/');
  } catch (error) {
    errorMsg.value = 'Email ou senha inválidos.';
    console.error("Erro no login:", error);
  }
}
</script>

<template>
  <div>
    <form @submit.prevent="login">
      <h1>Login</h1>
      <div>
        <label for="email">email:</label>
        <input type="email" id="email" v-model="form.email" required />
      </div>
      <div>
        <label for="password">Senha:</label>
        <input type="password" id="password" v-model="form.password" required />
      </div>
      <button type="submit">Entrar</button>
      <div v-if="errorMsg" style="color:red;">{{ errorMsg }}</div>
      <div>
        Não tem uma conta? <NuxtLink to="/cadastro">Cadastre-se</NuxtLink>
      </div>
    </form>
  </div>
</template>
