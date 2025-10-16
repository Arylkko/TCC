<script setup>
const { $pb } = useNuxtApp();
const router = useRouter();
const form = ref({
  email: '',
  password: '',
});   
const errorMsg = ref('');
const rememberMe = ref(false);

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
  <div class="min-h-screen bg-incipit-fundo overflow-hidden relative">
    <!-- Header -->
    <header class="h-full flex justify-between p-x-6 py-4 rounded-b-[40px] bg-incipit-base shadow-md"> 
      <h1 class="text-2xl text-branco font-bold">Incipit</h1>
      <div class="flex items-center space-x-4">
        <div class="i-mdi:magnify text-branco text-2xl cursor-pointer"></div>
        <div class="i-mdi:menu text-branco text-2xl cursor-pointer"></div>
      </div>
    </header>

    <!-- Background Pattern (opcional - você pode adicionar SVG de livros aqui) -->
    <div class="absolute inset-0 opacity-10 pointer-events-none">
      <!-- Padrão de livros pode ser adicionado aqui com CSS ou SVG -->
    </div>

    <!-- Main Content -->
    <div class="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
      <div class="auth-card">
        <h2 class="title-lg">Login</h2>
        
        <form @submit.prevent="login" class="space-y-4">
          <!-- Email -->
          <div>
            <label for="email" class="label-text">Email</label>
            <input 
              type="email" 
              id="email" 
              v-model="form.email" 
              placeholder="Email"
              class="input-field"
              required 
            />
          </div>

          <!-- Senha -->
          <div>
            <label for="password" class="label-text">Senha</label>
            <input 
              type="password" 
              id="password" 
              v-model="form.password" 
              placeholder="Senha"
              class="input-field"
              required 
            />
          </div>

          <!-- Esqueceu senha e Manter conectado -->
          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                v-model="rememberMe"
                class="mr-2 cursor-pointer"
              />
              <span class="text-texto">Mantenha-me conectado</span>
            </label>
            <NuxtLink to="/esqueceu-senha" class="text-texto hover:text-roxo transition">
              Esqueceu a senha?
            </NuxtLink>
          </div>

          <!-- Botão Entrar -->
          <button type="submit" class="btn-primary mt-6">
            Entrar
          </button>

          <!-- Mensagem de erro -->
          <div v-if="errorMsg" class="text-red-500 text-center text-sm mt-2">
            {{ errorMsg }}
          </div>

          <!-- Link para cadastro -->
          <div class="text-center text-sm mt-4 text-texto">
            Não tem uma conta? 
            <NuxtLink to="/cadastro" class="text-roxo font-medium hover:underline ml-1">
              Cadastre-se
            </NuxtLink>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Adicionar padrão de livros no fundo (opcional) */
.bg-incipit-fundo::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234E3939' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}
</style>
