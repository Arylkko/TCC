<script setup>
const { $pb } = useNuxtApp();
const router = useRouter();
const newUser = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
});
const isNewReader = ref(true); // Sim por padrão
const errorMsg = ref('');
const successMsg = ref('');

function generateTokenKey(length = 50) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

async function createUser() {
  errorMsg.value = '';
  successMsg.value = '';
  
  if (newUser.value.password !== newUser.value.confirmPassword) {
    errorMsg.value = 'As senhas não coincidem.';
    return;
  }

  if (newUser.value.password.length < 8) {
    errorMsg.value = 'A senha deve ter pelo menos 8 caracteres.';
    return;
  }

  try {
    const { name, email, password } = newUser.value;
    const tokenKey = generateTokenKey(50); 
    await $pb.collection('users').create({ 
      name, 
      email, 
      password, 
      passwordConfirm: password,
      tokenKey 
    });
    
    successMsg.value = 'Usuário criado com sucesso! Redirecionando...';
    
    // Limpar form
    newUser.value.name = '';
    newUser.value.email = '';
    newUser.value.password = '';
    newUser.value.confirmPassword = '';
    
    // Redirecionar após 2 segundos
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch (error) {
    errorMsg.value = 'Erro ao criar usuário. Verifique os dados e tente novamente.';
    console.error('Erro ao criar usuário:', error);
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

    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-10 pointer-events-none"></div>

    <!-- Main Content -->
    <div class="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
      <div class="auth-card">
        <h2 class="title-lg">Torne-se um leitor!</h2>
        
        <form @submit.prevent="createUser" class="space-y-4">
          <!-- Nome de Usuário -->
          <div>
            <label for="name" class="label-text">User</label>
            <input 
              type="text" 
              id="name" 
              v-model="newUser.name" 
              placeholder="User"
              class="input-field"
              required 
            />
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="label-text">Email</label>
            <input 
              type="email" 
              id="email" 
              v-model="newUser.email" 
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
              v-model="newUser.password" 
              placeholder="Senha"
              class="input-field"
              required
              minlength="8"
            />
          </div>

          <!-- Confirmar Senha -->
          <div>
            <label for="confirmPassword" class="label-text">Confirme sua senha</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="newUser.confirmPassword" 
              placeholder="Confirme sua senha"
              class="input-field"
              required
              minlength="8"
            />
          </div>

          <!-- Você é um leitor novato? -->
          <div class="flex items-center justify-center space-x-4 py-2">
            <span class="text-texto text-sm">Você é um leitor novato?</span>
            <div class="flex items-center space-x-3">
              <label class="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="newReader" 
                  :value="true"
                  v-model="isNewReader"
                  class="mr-1 cursor-pointer accent-roxo"
                />
                <span class="text-texto text-sm">Sim</span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="newReader" 
                  :value="false"
                  v-model="isNewReader"
                  class="mr-1 cursor-pointer accent-roxo"
                />
                <span class="text-texto text-sm">Não</span>
              </label>
            </div>
          </div>

          <!-- Botão Cadastrar -->
          <button type="submit" class="btn-primary mt-6">
            Cadastrar-se
          </button>

          <!-- Mensagem de sucesso -->
          <div v-if="successMsg" class="text-green-600 text-center text-sm mt-2 font-medium">
            {{ successMsg }}
          </div>

          <!-- Mensagem de erro -->
          <div v-if="errorMsg" class="text-red-500 text-center text-sm mt-2">
            {{ errorMsg }}
          </div>

          <!-- Link para login -->
          <div class="text-center text-sm mt-4 text-texto">
            Já é cadastrado? 
            <NuxtLink to="/login" class="text-roxo font-medium hover:underline ml-1">
              Clique aqui para logar.
            </NuxtLink>
          </div>
        </form>
      </div>
    </div>  </div>
</template>

<style src="~/styles/pages/cadastro.css"></style>

