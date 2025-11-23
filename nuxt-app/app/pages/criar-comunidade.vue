<script setup>
import { ref } from "vue";
import { useComunidades } from "~/composables/useComunidades";

const { $pb } = useNuxtApp();
const router = useRouter();

const nome = ref("");
const descricao = ref("");
const imagem = ref(null);
const enviando = ref(false);
const erro = ref("");

const { criarComunidade } = useComunidades();

function handleFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    imagem.value = file;
  }
}

async function criar() {
  if (!$pb.authStore.model) {
    alert("Você precisa estar logado para criar uma comunidade");
    router.push("/login");
    return;
  }

  if (!nome.value.trim()) {
    erro.value = "Nome da comunidade é obrigatório";
    return;
  }

  enviando.value = true;
  erro.value = "";

  const resultado = await criarComunidade({
    nome: nome.value,
    descricao: descricao.value,
    imagem_comunidade: imagem.value,
  });

  if (resultado.sucesso) {
    alert("Comunidade criada com sucesso!");
    router.push(`/comunidade/${resultado.dados.id}`);
  } else {
    erro.value = "Erro ao criar comunidade: " + resultado.erro;
  }

  enviando.value = false;
}

function cancelar() {
  router.push("/comunidades");
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
          <h2 class="title-lg font-display">Crie um clube do livro!</h2>

          <form @submit.prevent="criar" class="space-y-4">
            <div class="space-y-6">
              <!-- Email -->
              <div>
                <input
                  type="text"
                  id="nome"
                  v-model="nome"
                  placeholder="Nome da comunidade"
                  class="input-field box-border"
                  required
                />
              </div>

              <!-- Senha -->
              <div>
                <textarea
                  id="descricao"
                  v-model="descricao"
                  placeholder="Descreva sua comunidade..."
                  rows="4"
                  class="input-field box-border"
                ></textarea>
              </div>
            </div>

            <div class="mt-2">
              <label for="imagem">Imagem da Comunidade (opcional):</label>
              <input
                id="imagem"
                class="input-field box-border"
                type="file"
                @change="handleFileChange"
                accept="image/*"
              />
            </div>

            <!-- Botão Entrar -->
            <div class="flex gap-5">
              <button type="submit" class="btn-primary mt-6" :disabled="enviando">
                {{ enviando ? "Criando..." : "Criar Comunidade" }}
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
