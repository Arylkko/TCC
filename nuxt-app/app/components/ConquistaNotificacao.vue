<template>
  <Transition name="slide-up">
    <div
      v-if="mostrar"
      class="fixed bottom-6 right-6 z-50 bg-incipit-card rounded-[20px] shadow-2xl p-6 max-w-sm animate-bounce-in"
    >
      <div class="flex items-center gap-4">
        <div class="text-6xl">{{ conquista.icone }}</div>
        <div class="flex-1">
          <h3 class="text-lg font-display text-texto mb-1 mt-0">
            🏆 Conquista Desbloqueada!
          </h3>
          <p class="text-xl font-bold text-roxo mb-1 mt-0">{{ conquista.nome }}</p>
          <p class="text-sm text-texto/70 mb-0">{{ conquista.descricao }}</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  conquista: {
    type: Object,
    default: null
  },
  duracao: {
    type: Number,
    default: 5000
  }
});

const mostrar = ref(false);

watch(() => props.conquista, (novaConquista) => {
  if (novaConquista) {
    mostrar.value = true;
    
    setTimeout(() => {
      mostrar.value = false;
    }, props.duracao);
  }
}, { immediate: true });
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s ease;
}

.slide-up-enter-from {
  transform: translateY(100px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100px);
  opacity: 0;
}

@keyframes bounce-in {
  0% {
    transform: scale(0.8) translateY(100px);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.animate-bounce-in {
  animation: bounce-in 0.6s ease-out;
}
</style>