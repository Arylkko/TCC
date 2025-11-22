<script setup>
import { ref } from 'vue';
import { useComunidades } from '~/composables/useComunidades';

const { $pb } = useNuxtApp();
const router = useRouter();

const nome = ref('');
const descricao = ref('');
const imagem = ref(null);
const enviando = ref(false);
const erro = ref('');

const { criarComunidade } = useComunidades();

function handleFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    imagem.value = file;
  }
}

async function criar() {
  if (!$pb.authStore.model) {
    alert('Você precisa estar logado para criar uma comunidade');
    router.push('/login');
    return;
  }

  if (!nome.value.trim()) {
    erro.value = 'Nome da comunidade é obrigatório';
    return;
  }

  enviando.value = true;
  erro.value = '';

  const resultado = await criarComunidade({
    nome: nome.value,
    descricao: descricao.value,
    imagem_comunidade: imagem.value
  });
  
  if (resultado.sucesso) {
    alert('Comunidade criada com sucesso!');
    router.push(`/comunidade/${resultado.dados.id}`);
  } else {
    erro.value = 'Erro ao criar comunidade: ' + resultado.erro;
  }
  
  enviando.value = false;
}

function cancelar() {
  router.push('/comunidades');
}
</script>

<template>
  <div>
    <h1>Criar Nova Comunidade</h1>

    <div v-if="erro" style="color: red; margin: 10px 0;">
      {{ erro }}
    </div>

    <form @submit.prevent="criar">
      <div>
        <label for="nome">Nome da Comunidade:</label>
        <br>
        <input 
          id="nome"
          v-model="nome" 
          type="text" 
          placeholder="Digite o nome da comunidade"
          required
          style="width: 300px; padding: 5px;"
        />
      </div>

      <div style="margin-top: 15px;">
        <label for="descricao">Descrição:</label>
        <br>
        <textarea 
          id="descricao"
          v-model="descricao" 
          placeholder="Descreva sua comunidade..."
          rows="4"
          style="width: 300px; padding: 5px;"
        ></textarea>
      </div>

      <div style="margin-top: 15px;">
        <label for="imagem">Imagem da Comunidade (opcional):</label>
        <br>
        <input 
          id="imagem"
          type="file" 
          @change="handleFileChange"
          accept="image/*"
        />
      </div>

      <div style="margin-top: 20px;">
        <button type="submit" :disabled="enviando">
          {{ enviando ? 'Criando...' : 'Criar Comunidade' }}
        </button>
        <button type="button" @click="cancelar" style="margin-left: 10px;">
          Cancelar
        </button>
      </div>
    </form>
  </div>
</template>
