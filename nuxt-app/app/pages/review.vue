<script setup>
import { ref, onMounted } from 'vue';
const { $pb } = useNuxtApp();
const router = useRouter();

const isLoggedIn = ref(false);
const mostrarFormulario = ref(false);
const review = ref('');
const mensagemStatus = ref('');



onMounted(() => {
  isLoggedIn.value = $pb.authStore.isValid;
});


function handleBotaoPrincipalClick() {
  if (isLoggedIn.value) {
    mostrarFormulario.value = true;
    mensagemStatus.value = '';
  } else {
    router.push('/login');
  }
}

async function salvarReview() {
  if (!review.value.trim()) {
    mensagemStatus.value = 'Por favor, escreva algo na Review.';
    return;
  }

  try {
    const data = {
      "conteudo": review.value,
      "autor": $pb.authStore.model.id,
    };
    const record = await $pb.collection('notas').create(data);
    mensagemStatus.value = 'Nota salva com sucesso!';
    review.value = '';
    mostrarFormulario.value = false;
  } catch (error) {
    mensagemStatus.value = 'Ocorreu um erro ao salvar a nota.';
    console.error("Erro ao salvar nota:", error);
    console.log(review.value, " - ", $pb.authStore.model.id);
  }
}
</script>

<template>
  <div>
    
    <button v-if="!mostrarFormulario" @click="handleBotaoPrincipalClick">
      Adicionar Nova Review
    </button>

    <form v-if="mostrarFormulario" @submit.prevent="salvarReview">
      <label for="nova-Review">Digite sua Review:</label>
      <textarea
        id="nova-Review"
        v-model="review"
        placeholder="Digite aqui."
        required
      ></textarea>
      
      <div>
        <button type="submit">
Salvar Review
        </button>
        <button type="button" @click="mostrarFormulario = false">
          Cancelar
        </button>
      </div>
    </form>

    <p v-if="mensagemStatus">
      {{ mensagemStatus }}
    </p>
  </div>
</template>
