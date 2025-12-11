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
    
    // Criar usuário
    const novoUsuario = await $pb.collection('users').create({ 
      name, 
      email, 
      password, 
      passwordConfirm: password,
      tokenKey 
    });
    
    // Fazer login automático
    await $pb.collection('users').authWithPassword(email, password);
    
    successMsg.value = 'Usuário criado com sucesso! Redirecionando...';
    
    // Limpar form
    newUser.value.name = '';
    newUser.value.email = '';
    newUser.value.password = '';
    newUser.value.confirmPassword = '';
    
    // Redirecionar após 1.5 segundos baseado na escolha
    setTimeout(() => {
      if (isNewReader.value) {
        router.push('/uno'); // Leitor novato
      } else {
        router.push('/'); // Home
      }
    }, 1500);
  } catch (error) {
    errorMsg.value = 'Erro ao criar usuário. Verifique os dados e tente novamente.';
    console.error('Erro ao criar usuário:', error);
  }
}
</script>

<template>
  <div class="min-h-screen bg-incipit-fundo overflow-hidden relative font-sono">
    <!-- Header Component -->
    <Header variant="auth" />

    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-10 pointer-events-none"></div>

    <!-- Main Content -->
    <div class="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
      <div class="auth-card">
        <h2 class="title-lg font-display">Torne-se um leitor!</h2>
        
        <form @submit.prevent="createUser" class="space-y-4">
          <div class="space-y-6">
          <!-- Nome de Usuário -->
          <div>
            <input 
              type="text" 
              id="name" 
              v-model="newUser.name" 
              placeholder="User"
              class="input-field box-border font-sono"
              required 
            />
          </div>

          <!-- Email -->
          <div>
            <input 
              type="email" 
              id="email" 
              v-model="newUser.email" 
              placeholder="Email"
              class="input-field box-border font-sono"
              required 
            />
          </div>

          <!-- Senha -->
          <div>
            <input 
              type="password" 
              id="password" 
              v-model="newUser.password" 
              placeholder="Senha"
              class="input-field box-border font-sono"
              required
              minlength="8"
            />
          </div>

          <!-- Confirmar Senha -->
          <div>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="newUser.confirmPassword" 
              placeholder="Confirme sua senha"
              class="input-field box-border font-sono"
              required
              minlength="8"
            />
          </div>
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

