<script setup>
import { ref, onMounted } from 'vue';
import { useComunidades } from '~/composables/useComunidades';

const { $pb } = useNuxtApp();
const router = useRouter();

const comunidades = ref([]);
const loading = ref(true);
const buscaTexto = ref('');

const { buscarComunidades } = useComunidades();

async function carregarComunidades() {
  loading.value = true;
  const resultado = await buscarComunidades(buscaTexto.value);
  
  if (resultado.sucesso) {
    comunidades.value = resultado.dados;
  }
  
  loading.value = false;
}

async function buscar() {
  await carregarComunidades();
}

onMounted(() => {
  carregarComunidades();
});
</script>

<template>
  <div>
    <h1>Comunidades</h1>

    <div>
      <input 
        v-model="buscaTexto" 
        type="text" 
        placeholder="Buscar comunidades..."
        @keyup.enter="buscar"
      />
      <button @click="buscar">Buscar</button>
      
      <button v-if="$pb.authStore.model" @click="router.push('/criar-comunidade')">
        Criar Comunidade
      </button>
    </div>

    <div v-if="loading">Carregando comunidades...</div>
    
    <div v-else-if="comunidades.length === 0">
      <p>Nenhuma comunidade encontrada.</p>
    </div>
    
    <div v-else>
      <div 
        v-for="comunidade in comunidades" 
        :key="comunidade.id"
        @click="router.push(`/comunidade/${comunidade.id}`)"
        style="border: 1px solid black; padding: 10px; margin: 10px 0; cursor: pointer;"
      >
        <h3>{{ comunidade.nome }}</h3>
        <p>{{ comunidade.descricao || 'Sem descrição' }}</p>
        <p>Membros: {{ comunidade.membros?.length || 0 }}</p>
        <p>Líder: {{ comunidade.expand?.lider?.name || 'Desconhecido' }}</p>
      </div>
    </div>
  </div>
</template>
