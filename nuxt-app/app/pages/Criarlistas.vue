<script setup>
import { ref } from "vue";
import { useListas } from "~/composables/useListas";

const { $pb } = useNuxtApp();
const router = useRouter();

const nomeLista = ref("");
const descricaoLista = ref("");
const listaPublica = ref(false);
const enviando = ref(false);
const erro = ref("");

const { criarLista } = useListas();

async function criar() {
  if (!$pb.authStore.model) {
    alert("Você precisa estar logado para criar uma lista");
    router.push("/login");
    return;
  }

  if (!nomeLista.value.trim()) {
    erro.value = "Nome da lista é obrigatório";
    return;
  }

  enviando.value = true;
  erro.value = "";

  const dadosLista = {
    nome: nomeLista.value,
    descricao: descricaoLista.value || "",
    publica: listaPublica.value,
    autor: $pb.authStore.model.id,
    livros: []
  };

  const resultado = await criarLista(dadosLista);

  if (resultado.sucesso) {
    alert("Lista criada com sucesso!");
    router.push(`/lista/${resultado.dados.id}`);
  } else {
    erro.value = "Erro ao criar lista: " + resultado.erro;
  }

  enviando.value = false;
}

function cancelar() {
  router.push("/minhas-listas");
}
</script>

<template>
  <div v-if="erro" style="color: red; margin: 10px 0">
    {{ erro }}
  </div>

  <div class="min-h-screen bg-incipit-fundo overflow-hidden relative font-sono">
    <!-- Header Component -->
    <Header variant="auth" />

    <!-- Background Pattern (opcional - você pode adicionar SVG de livros aqui) -->
    <div class="absolute inset-0 opacity-10 pointer-events-none">
      <!-- Padrão de livros pode ser adicionado aqui com CSS ou SVG -->
    </div>

    <!-- Main Content -->
    <div
      class="relative z-10 flex items-center justify-center min-h-[calc(100vh-200px)]"
    >
      <div class="auth-card">
        <h2 class="title-lg font-display">Crie sua lista de livros!</h2>

        <form @submit.prevent="criar" class="space-y-4">
          <div class="space-y-6">
            <!-- Nome da Lista -->
            <div>
              <input
                type="text"
                id="nome-lista"
                v-model="nomeLista"
                placeholder="Nome da lista"
                class="input-field box-border"
                required
              />
            </div>

            <!-- Descrição -->
            <div>
              <textarea
                id="descricao-lista"
                v-model="descricaoLista"
                placeholder="Descreva sua lista (opcional)"
                rows="4"
                class="input-field box-border"
              ></textarea>
            </div>
          </div>

          <!-- Checkbox Lista Pública -->
          <div class="mt-2 flex items-center gap-2">
            <input
              id="lista-publica"
              v-model="listaPublica"
              type="checkbox"
              class="w-4 h-4 text-roxo bg-roxo-100 border-roxo rounded focus:ring-roxo"
            />
            <label for="lista-publica" class="text-texto text-sm">
              Tornar esta lista pública
            </label>
          </div>

          <!-- Botões -->
          <div class="flex gap-5">
            <button type="submit" class="btn-primary mt-6" :disabled="enviando">
              {{ enviando ? "Criando..." : "Criar Lista" }}
            </button>
            <button type="button" @click="cancelar" class="btn-primary mt-6">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>