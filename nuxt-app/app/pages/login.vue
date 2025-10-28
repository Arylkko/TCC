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
    router.push('/search');
  } catch (error) {
    errorMsg.value = 'Email ou senha inválidos.';
    console.error("Erro no login:", error);
  }
}
</script>

<template>
  <div class="min-h-screen bg-incipit-fundo overflow-hidden relative">
    <!-- Header Component -->
    <Header variant="auth" />

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
    </div>  </div>
</template>

<style src="~/styles/pages/login.css"></style>

