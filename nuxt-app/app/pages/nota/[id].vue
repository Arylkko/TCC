<template>
  <div class="min-h-screen bg-incipit-fundo font-sono text-texto pb-10">
    <Header :show-search="true" />

    <main class="relative z-1 container mx-auto px-4 mt-8 max-w-4xl box-border">
      
      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div class="w-10 h-10 border-4 border-roxo border-t-transparent rounded-full animate-spin"></div>
        <p class="text-lg animate-pulse">Carregando resenha...</p>
      </div>

      <div v-else-if="error" class="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-red-500">
        <div class="i-mdi:alert-circle text-6xl"></div>
        <p class="text-xl">{{ error }}</p>
        <button @click="$router.go(-1)" class="px-6 py-2 bg-roxo text-white rounded-full hover:opacity-90 transition">
          Voltar
        </button>
      </div>

      <div v-else-if="resenha" class="animate-fade-in">
        
        <button @click="$router.go(-1)" class="mb-6 texto-roxo brounded='[50%]' border-0 flex items-center justify-center bg='[rgba(166,141,173,0.2)]' text-roxo">
          <div class="i-mdi:arrow-left text-xl"></div>
        </button>

        <article class="bg-incipit-card rounded-[30px] shadow-xl p-6 md:px-8 relative overflow-hidden">
          
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-texto/10 pb-6">
            
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-full bg-roxo/20 flex-shrink-0 overflow-hidden flex items-center justify-center">
                 <img 
                   v-if="avatarUrl" 
                   :src="avatarUrl" 
                   class="w-full h-full object-cover" 
                   alt="Avatar"
                 />
                 <div v-else class="i-mdi:account text-3xl text-roxo"></div>
              </div>
              
              <div>
                <h3 class="text-xl font-display text-texto">
                  {{ resenha.expand?.autor?.name || 'Usuário' }}
                </h3>
                <p class="text-sm text-texto/60">
                  Resenha sobre <span class="font-bold text-roxo">{{ resenha.expand?.livro?.Nome || 'Livro' }}</span>
                </p>
              </div>
            </div>

            <div class="flex flex-col items-start md:items-end">
              <div class="flex gap-1 text-2xl text-roxo mb-1">
                <div 
                  v-for="n in 5" 
                  :key="n"
                  :class="n <= resenha.avaliacao ? 'i-mdi:star' : 'i-mdi:star-outline'"
                ></div>
              </div>
              <span class="text-xs text-texto/50 uppercase tracking-wide">
                {{ formatarData(resenha.created) }}
              </span>
            </div>
          </div>

          <h1 v-if="resenha.titulo" class="text-2xl md:text-3xl font-display font-bold text-texto mb-6">
            {{ resenha.titulo }}
          </h1>

          <div class="text-lg leading-relaxed text-texto/90 whitespace-pre-wrap break-all font-serif">
            {{ resenha.resenha }}
          </div>

          <div class="mt-10 pt-6 border-t border-texto/10 flex gap-4">
            <div class="flex items-center gap-2 text-roxo">
              <div class="i-mdi:heart text-xl"></div>
              <span class="font-bold">{{ resenha.likes || 0 }}</span> Likes
            </div>
          </div>

        </article>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import Header from "~/components/Header.vue";
import { useNotas } from "~/composables/useNotas"; 

const route = useRoute();
const { buscarNotaPorId } = useNotas();
const { $pb } = useNuxtApp();

const loading = ref(true);
const error = ref("");
const resenha = ref(null);

const resenhaId = computed(() => route.params.id);

onMounted(async () => {
  loading.value = true;
  
  if (!resenhaId.value) {
    error.value = "ID da resenha não encontrado.";
    loading.value = false;
    return;
  }

  const resultado = await buscarNotaPorId(resenhaId.value);

  if (resultado.sucesso) {
    resenha.value = resultado.dados;
  } else {
    error.value = "Não foi possível encontrar esta resenha.";
  }
  
  loading.value = false;
});

function formatarData(dataString) {
  if (!dataString) return "";
  return new Date(dataString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}
</script>