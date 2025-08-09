<script setup>
const { $pb } = useNuxtApp();
const form = ref({
  email: '',
  password: '',
});


async function login() {
  try {
    const authData = await $pb.collection('emails').authWithPassword(form.value.email, form.value.password);

} catch (error) {
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
      <button type="submit"">Entrar
      </button>
      <div>
        Não tem uma conta? <NuxtLink to="/cadastro">Cadastre-se</NuxtLink>
      </div>
    </form>
  </div>
</template>

