<template>
  <div>
    <Header :show-search="true" />

    <main>
      <!-- Loading State -->
      <div v-if="loading">
        <div>Carregando perfil...</div>
      </div>

      <!-- Error State -->
      <div v-else-if="error">
        <p>{{ error }}</p>
        <button @click="$router.push('/')">Voltar</button>
      </div>

      <!-- Profile Content -->
      <div v-else-if="usuario">
        <!-- Seção do Perfil -->
        <section>
          <div>            <!-- Avatar -->
            <div>
              <img 
                v-if="avatarUrl" 
                :src="avatarUrl" 
                alt="Avatar do usuário"
                width="150"
                height="150"
              />
              <div v-else>Sem foto</div>
              
              <!-- Upload de foto (apenas se for o próprio usuário) -->
              <div v-if="isProprioUsuario">
                <input 
                  type="file" 
                  @change="handleFileUpload" 
                  accept="image/*"
                  ref="fileInput"
                  style="display: none"
                />
                <button @click="$refs.fileInput.click()">
                  Alterar Foto
                </button>
              </div>
            </div>            <!-- Info do Usuário -->
            <div>
              <h1>{{ usuario.name || usuario.username }}</h1>
              <p v-if="usuario.username">@{{ usuario.username }}</p>              <!-- Level e XP -->
              <div>
                <span>Nv. {{ calcularNivel(usuario.XP || 0) }}</span>
                <br>
                <span>{{ usuario.XP || 0 }} XP</span>
              </div><!-- Descrição -->
              <div>
                <div v-if="!editandoDescricao">
                  <p>{{ usuario.Description || 'Sem descrição' }}</p>
                  <button v-if="isProprioUsuario" @click="iniciarEdicaoDescricao">
                    Editar
                  </button>
                </div>
                
                <div v-else>
                  <textarea 
                    v-model="novaDescricao"
                    placeholder="Escreva sua descrição..."
                    rows="4"
                  ></textarea>
                  <button @click="salvarDescricao">Salvar</button>
                  <button @click="cancelarEdicaoDescricao">Cancelar</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Conquistas -->
          <div>
            <h2>Conquistas</h2>
            <div v-if="conquistas.length > 0">
              <div v-for="conquista in conquistas" :key="conquista.id">
                <span>{{ conquista.icone }}</span>
                <span>{{ conquista.nome }}</span>
              </div>
            </div>
            <p v-else>Nenhuma conquista ainda</p>
          </div>

          <!-- Total de Livros Lidos -->
          <div>
            <h2>{{ totalLivrosLidos }}</h2>
            <p>Total de livros lidos</p>
          </div>
        </section>        <!-- Livros Favoritos -->
        <section>
          <h2>Livros Favoritos</h2>
          <div v-if="livrosFavoritos.length > 0">
            <div 
              v-for="livro in livrosFavoritos" 
              :key="livro.id"
              @click="navegarParaLivro(livro.expand?.livro?.ISBN)"
            >
              <img 
                v-if="livro.capaUrl"
                :src="livro.capaUrl" 
                :alt="livro.expand?.livro?.Nome"
                width="100"
              />
              <div v-else>Sem capa</div>
              <h3>{{ livro.expand?.livro?.Nome || 'Livro sem título' }}</h3>
              <p>{{ livro.autorNome || 'Autor desconhecido' }}</p>
              <p>Nota: {{ livro.avaliacao }}/5</p>
            </div>
          </div>
          <p v-else>Nenhum livro favorito ainda</p>
        </section>

        <!-- Listas do Usuário -->
        <section>
          <h2>Listas</h2>
          <div v-if="listas.length > 0">
            <div 
              v-for="lista in listas" 
              :key="lista.id"
              @click="navegarParaLista(lista.id)"
            >
              <h3>{{ lista.nome }}</h3>
              <p>{{ lista.descricao || 'Sem descrição' }}</p>
              <span>{{ lista.totalLivros || 0 }} livros</span>
            </div>
          </div>
          <p v-else>Nenhuma lista criada ainda</p>
          
          <button v-if="isProprioUsuario" @click="criarNovaLista">
            Criar Nova Lista
          </button>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Header from '~/components/Header.vue';

const route = useRoute();
const router = useRouter();
const { $pb } = useNuxtApp();

// Composables
const {
  buscarUsuarioPorId,
  atualizarPerfil,
  calcularNivel,
  xpParaProximoNivel,
  buscarConquistasUsuario,
  buscarTotalLivrosLidos,
  buscarLivrosFavoritos,
  buscarListasUsuario,
  ehProprioUsuario
} = useUsuario();

const { buscarDadosLivroAPI } = useLivros();

// Estados locais
const usuario = ref(null);
const loading = ref(true);
const error = ref('');
const conquistas = ref([]);
const totalLivrosLidos = ref(0);
const livrosFavoritos = ref([]);
const listas = ref([]);
const editandoDescricao = ref(false);
const novaDescricao = ref('');
const fileInput = ref(null);

// ID do usuário da URL
const userId = computed(() => route.params.id);

// Verifica se é o próprio usuário
const isProprioUsuario = computed(() => {
  return ehProprioUsuario(userId.value);
});

// URL do avatar
const avatarUrl = computed(() => {
  if (!usuario.value?.avatar) return null;
  return $pb.files.getURL(usuario.value, usuario.value.avatar);
});

// Carrega dados do perfil
onMounted(async () => {
  if (!userId.value) {
    error.value = 'Usuário não encontrado';
    loading.value = false;
    return;
  }  try {
    loading.value = true;
    
    // Busca dados básicos do usuário
    const resultadoUsuario = await buscarUsuarioPorId(userId.value);
    
    if (!resultadoUsuario.sucesso) {
      throw new Error(resultadoUsuario.erro);
    }
    usuario.value = resultadoUsuario.dados;
    
    // Busca dados adicionais em paralelo
    const [conquistasData, totalLivros, favoritos, listasData] = await Promise.all([
      buscarConquistasUsuario(userId.value),
      buscarTotalLivrosLidos(userId.value),
      buscarLivrosFavoritos(userId.value),
      buscarListasUsuario(userId.value)
    ]);
      conquistas.value = conquistasData.dados || [];
    totalLivrosLidos.value = totalLivros.total || 0;
    livrosFavoritos.value = favoritos.dados || [];
    listas.value = listasData.dados || [];
    
    // Buscar capas e autores da API para livros favoritos
    await carregarCapasLivrosFavoritos();
  } catch (err) {
    error.value = 'Erro ao carregar dados do perfil';
  } finally {
    loading.value = false;
  }
});

// Carregar capas dos livros favoritos da API
async function carregarCapasLivrosFavoritos() {
  if (!livrosFavoritos.value || livrosFavoritos.value.length === 0) return;
  
  const promessas = livrosFavoritos.value.map(async (livro) => {
    const isbn = livro.expand?.livro?.ISBN;
    if (!isbn) return livro;
    
    const dadosAPI = await buscarDadosLivroAPI(isbn);
    
    if (dadosAPI.sucesso) {
      livro.capaUrl = dadosAPI.dados.capa;
      livro.autorNome = dadosAPI.dados.autor;
    }
    
    return livro;
  });
  
  await Promise.all(promessas);
}

// Funções de edição de descrição
function iniciarEdicaoDescricao() {
  editandoDescricao.value = true;
  novaDescricao.value = usuario.value.Description || '';
}

function cancelarEdicaoDescricao() {
  editandoDescricao.value = false;
  novaDescricao.value = '';
}

async function salvarDescricao() {
  try {
    const resultado = await atualizarPerfil(userId.value, {
      description: novaDescricao.value
    });
    
    if (resultado.sucesso) {
      usuario.value = resultado.dados;
      editandoDescricao.value = false;
      alert('Descrição atualizada com sucesso!');
    } else {
      alert('Erro ao atualizar descrição: ' + resultado.erro);
    }
  } catch (err) {
    alert('Erro ao atualizar descrição: ' + err.message);
  }
}

// Upload de foto
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validação básica
  if (!file.type.startsWith('image/')) {
    alert('Por favor, selecione uma imagem válida');
    return;
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB
    alert('A imagem deve ter no máximo 5MB');
    return;
  }

  try {
    const resultado = await atualizarPerfil(userId.value, {
      avatar: file
    });
    
    if (resultado.sucesso) {
      usuario.value = resultado.dados;
      alert('Foto atualizada com sucesso!');
    } else {
      alert('Erro ao atualizar foto: ' + resultado.erro);
    }
  } catch (err) {
    alert('Erro ao atualizar foto: ' + err.message);
  }
}

// Navegação
function navegarParaLivro(isbn) {
  if (isbn) {
    router.push(`/livro/${isbn}`);
  }
}

function navegarParaLista(listaId) {
  if (listaId) {
    router.push(`/lista/${listaId}`);
  }
}

function criarNovaLista() {
  router.push('/criarlistas');
}
</script>