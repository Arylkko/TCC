<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useComunidades } from '~/composables/useComunidades';
import { useRoute, useRouter } from 'vue-router'; // Garantindo imports
import Header from '~/components/Header.vue'; // Assumindo que você tem esse componente

const { $pb } = useNuxtApp();
const route = useRoute();
const router = useRouter();

const comunidadeId = route.params.id;
const comunidade = ref(null);
const loading = ref(true);
const error = ref('');

// Livro da semana
const mostrarModalLivro = ref(false);
const livroIdInput = ref('');
const diasDuracao = ref(7);

// Comentários
const comentarios = ref([]);
const novoComentario = ref('');
const enviandoComentario = ref(false);

const {
  buscarComunidadePorId,
  entrarNaComunidade,
  sairDaComunidade,
  ehLider,
  ehMembro,
  definirLivroSemana,
  buscarComentarios,
  criarComentario
} = useComunidades();

const usuarioAtual = computed(() => $pb.authStore.model);
const souLider = computed(() => ehLider(comunidade.value));
const souMembro = computed(() => ehMembro(comunidade.value));

// Avatar da Comunidade (Placeholder se não tiver)
const avatarComunidade = computed(() => {
    if (comunidade.value?.imagem_comunidade) {
        return $pb.files.getUrl(comunidade.value, comunidade.value.imagem_comunidade)
    }
    return 'https://via.placeholder.com/150/000000/FFFFFF/?text=' + (comunidade.value?.nome?.[0] || 'C');
});

// Avatar do Usuário (Helper)
function getAvatarUsuario(usuario) {
    if (usuario?.avatar) {
        return $pb.files.getUrl(usuario, usuario.avatar);
    }
    return null;
}

// Calcular dias restantes
const diasRestantes = computed(() => {
  if (!comunidade.value?.data_fim_leitura) return null;
  const fim = new Date(comunidade.value.data_fim_leitura);
  const hoje = new Date();
  const diff = Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
});

// Buscar capa do livro pela API do Google Books
const capaLivroComunitario = ref('');
async function buscarCapaLivro() {
  const isbn = comunidade.value?.expand?.livro_semana?.ISBN;
  if (!isbn) {
    capaLivroComunitario.value = '';
    return;
  }
  
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const livro = data.items[0].volumeInfo;
      capaLivroComunitario.value = livro.imageLinks?.thumbnail?.replace('http:', 'https:') || '';
    } else {
      capaLivroComunitario.value = '';
    }
  } catch (error) {
    console.error('Erro ao buscar capa do livro:', error);
    capaLivroComunitario.value = '';
  }
}

async function carregarComunidade() {
  loading.value = true;
  error.value = '';
  
  const resultado = await buscarComunidadePorId(comunidadeId);
  
  if (resultado.sucesso) {
    comunidade.value = resultado.dados;
    // Buscar capa do livro se houver livro da semana
    if (comunidade.value?.livro_semana) {
      await buscarCapaLivro();
    }
  } else {
    error.value = 'Erro ao carregar comunidade: ' + resultado.erro;
  }
  
  loading.value = false;
}

async function carregarComentarios() {
  const resultado = await buscarComentarios(comunidadeId);
  if (resultado.sucesso) {
    comentarios.value = resultado.dados;
  }
}

async function toggleMembership() {
  if (souMembro.value) {
    if(!confirm("Tem certeza que deseja sair desta comunidade?")) return;
    const resultado = await sairDaComunidade(comunidadeId);
    if (resultado.sucesso) {
      await carregarComunidade();
    } else {
      alert(resultado.erro);
    }
  } else {
    const resultado = await entrarNaComunidade(comunidadeId);
    if (resultado.sucesso) {
      await carregarComunidade();
    } else {
      alert(resultado.erro);
    }
  }
}

async function salvarLivroSemana() {
  if (!livroIdInput.value.trim()) {
    alert('Digite o ID do livro');
    return;
  }

  const resultado = await definirLivroSemana(comunidadeId, livroIdInput.value, diasDuracao.value);
  
  if (resultado.sucesso) {
    alert('Livro da semana definido com sucesso!');
    mostrarModalLivro.value = false;
    livroIdInput.value = '';
    await carregarComunidade();
  } else {
    alert('Erro: ' + resultado.erro);
  }
}

async function enviarComentario() {
  if (!novoComentario.value.trim()) return;

  enviandoComentario.value = true;
  const resultado = await criarComentario(comunidadeId, novoComentario.value);
  
  if (resultado.sucesso) {
    novoComentario.value = '';
    await carregarComentarios();
  } else {
    alert('Erro ao enviar comentário: ' + resultado.erro);
  }
  
  enviandoComentario.value = false;
}

function formatarData(data) {
  if (!data) return '';
  return new Date(data).toLocaleDateString('pt-BR');
}

onMounted(async () => {
  await carregarComunidade();
  await carregarComentarios();
});
</script>

<template>
  <div class="min-h-screen bg-[#f3eddb] font-sono text-[#3d3131]">
    <Header :show-search="true" />

    <!-- Loading / Error States -->
    <div v-if="loading" class="flex justify-center items-center h-[80vh]">
        <div class="i-mdi:loading animate-spin text-4xl text-roxo"></div>
    </div>
    
    <div v-else-if="error" class="flex flex-col items-center justify-center h-[80vh] text-center p-4">
        <div class="i-mdi:alert-circle text-6xl text-roxo mb-4"></div>
        <h2 class="text-xl mb-4">{{ error }}</h2>
        <button @click="router.push('/comunidades')" class="btn-primary">Voltar</button>
    </div>

    <!-- Main Content -->
    <main v-else-if="comunidade" class="container mx-auto px-4 max-w-[1400px]">
      

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- col 1  -->
        <div class="lg:col-span-3 flex flex-col">
            <!-- perfil -->
             <h2
                class="bg-incipit-card text-texto font-display text-center rounded-[30px] justify-self-start px-15 shadow-lg"
              >
                Perfil
              </h2>


            <!-- perfil -->
            <div class="bg-incipit-card rounded-[30px] p-6 shadow-md flex flex-col items-center text-center relative overflow-hidden">
                <!-- foto -->
                <div class="w-40 h-40 rounded-full border-4 border-roxo overflow-hidden bg-incipit-base">
                    <img :src="avatarComunidade" class="w-full h-full object-cover" />
                </div>

                <!-- info -->
                <h1 class="text-2xl font-display uppercase tracking-wide break-words w-full mb-0">{{ comunidade.nome }}</h1>
                <p class="text-sm text-[#3d3131] mt-0">
                    Criado por <span class="text-roxo font-bold uppercase">{{ comunidade.expand?.lider?.name || '---' }}</span>
                </p>

                <!-- about -->
                <div class="text-left w-full text-sm mb-8">
                    <div>
                        <h3 class="font-display mb-2">Sobre nós</h3>
                        <p class="leading-relaxed opacity-80">{{ comunidade.descricao || 'Sem descrição.' }}</p>
                    </div>
                </div>

                <!-- botoes -->
                <div class="mt-auto w-full flex flex-col gap-2">
                    <button 
                        v-if="!souMembro" 
                        @click="toggleMembership"
                        class="botao"
                    >
                        Entrar na comunidade
                    </button>
                    
                    <button 
                        v-else-if="souLider" 
                        class="botao"
                    >
                        Editar
                    </button>

                     <button 
                        v-else
                        @click="toggleMembership"
                        class="botao bg-vermelho"
                    >
                        Sair
                    </button>
                </div>
            </div>
        </div>

        <!-- col 2 -->
        <div class="lg:col-span-6 flex flex-col">
             <!-- header -->
             <h2
                class="bg-incipit-card text-texto font-display text-center rounded-[30px] justify-self-start px-15 shadow-lg"
              >
                Comentários
              </h2>

            <!-- input -->
            <div v-if="souMembro" class="bg-[#e6decf] rounded-[30px] p-4 shadow-sm flex gap-4 items-start mb-4">
                 <div class="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                     <!-- Avatar user atual -->
                     <img v-if="getAvatarUsuario(usuarioAtual)" :src="getAvatarUsuario(usuarioAtual)" class="w-full h-full object-cover" />
                     <div v-else class="w-full h-full bg-roxo"></div>
                 </div>
                 <div class="flex-1 relative">
                     <textarea 
                        v-model="novoComentario"
                        placeholder="Escreva algo..." 
                        rows="2"
                        class="w-full bg-incipit-fundo box-border rounded-xl p-3 border-none focus:ring-2 focus:ring-roxo outline-none resize-none text-sm"
                     ></textarea>
                     <button 
                        @click="enviarComentario"
                        :disabled="!novoComentario.trim() || enviandoComentario"
                        class="absolute bottom-2 right-2 text-roxo border-0 hover:text-[#7a6a8f] disabled:opacity-50"
                     >
                        <div class="i-mdi:send text-xl"></div>
                     </button>
                 </div>
            </div>

            <!-- lista coment  -->
            <div class="space-y-6 pb-10">
                <div v-if="comentarios.length === 0" class="text-center opacity-50 py-10">
                    Nenhum comentário ainda.
                </div>

                <div v-for="comentario in comentarios" :key="comentario.id" class="flex gap-4 group">
                    <!-- Avatar Lateral -->
                    <div class="flex flex-col items-center gap-1 flex-shrink-0 w-16">
                        <div class="w-12 h-12 rounded-full border-2 border-roxo overflow-hidden bg-white">
                            <img 
                                v-if="getAvatarUsuario(comentario.expand?.autor)" 
                                :src="getAvatarUsuario(comentario.expand?.autor)" 
                                class="w-full h-full object-cover" 
                            />
                            <div v-else class="w-full h-full flex items-center justify-center bg-gray-200">
                                <div class="i-mdi:account text-gray-400"></div>
                            </div>
                        </div>
                        <span class="text-[10px] font-bold text-center leading-tight truncate w-full">
                            {{ comentario.expand?.autor?.username || 'User' }}
                        </span>
                    </div>

                    <!-- Balão de Fala -->
                    <div class="relative flex-1 bg-incipit-card rounded-[20px] p-5 shadow-sm min-w-0">
                         <!-- Triângulo do balão -->
                         <div class="absolute top-6 -left-2 w-4 h-4 bg-incipit-card transform rotate-45"></div>
                         
                         <!-- Botão delete (apenas visual por enquanto ou se for dono) -->
                         <button v-if="comentario.autor === usuarioAtual?.id || souLider" class="absolute top-3 right-3 text-[#3d3131]/30 hover:text-red-500 transition">
                             <div class="i-mdi:close font-bold"></div>
                         </button>

                         <!-- Título/Conteúdo -->
                         <h4 class="font-bold text-[#3d3131] mb-1 text-sm">
                             {{ comentario.expand?.autor?.name || 'Membro' }} diz:
                         </h4>
                         <p class="text-[#3d3131] text-sm leading-relaxed mb-4 break-words whitespace-pre-wrap">
                             {{ comentario.conteudo }}
                         </p>

                         <!-- Rodapé do Card -->
                         <div class="flex justify-between items-center">
                             <div class="flex gap-4 text-roxo text-xs font-bold">
                                 <div class="flex items-center gap-1">
                                     <div class="i-mdi:heart"></div> 0
                                 </div>
                                 <div class="flex items-center gap-1">
                                     <div class="i-mdi:comment"></div> 0
                                 </div>
                             </div>
                             
                             <div class="bg-roxo text-[#3d3131] px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">
                                 Sem spoilers
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- col 3 -->
        <div class="lg:col-span-3 flex flex-col gap-8">
            
            <!-- livro com -->
            <div class="flex flex-col">
             <h2
                class="bg-incipit-card text-texto font-display text-center rounded-[30px] justify-self-start px-15 shadow-lg"
              >
                Livro Comunitário
              </h2>                <div class="bg-incipit-card rounded-[30px] p-2 shadow-md min-h-[150px] flex flex-col justify-center items-center text-center">                    <div v-if="comunidade.livro_semana" class="w-full p-4">
                         <!-- capa -->
                         <div class="w-32 h-48 mx-auto mb-4 shadow-xl rounded-lg overflow-hidden bg-gray-100">
                             <img 
                                v-if="capaLivroComunitario" 
                                :src="capaLivroComunitario" 
                                :alt="comunidade.expand?.livro_semana?.Nome"
                                class="w-full h-full object-cover"
                             />
                             <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-roxo/20 to-roxo/40">
                                <div class="i-mdi:book text-5xl text-roxo/50"></div>
                             </div>
                         </div>
                         
                         <h3 class="font-bold text-lg leading-tight mb-2 px-2">
                             {{ comunidade.expand?.livro_semana?.Nome || 'Livro Selecionado' }}
                         </h3>
                         <p class="text-xs mb-3 text-[#3d3131]/70">
                             Fim da leitura: {{ formatarData(comunidade.data_fim_leitura) }}
                         </p>
                         
                         <div v-if="diasRestantes !== null" class="bg-roxo/20 text-[#3d3131] px-3 py-1 rounded-full text-xs font-bold inline-block mb-3">
                             {{ diasRestantes }} dias restantes
                         </div>

                         <button 
                            v-if="souLider" 
                            @click="mostrarModalLivro = true"
                            class="bg-roxo text-white px-4 py-2 rounded-full text-sm hover:opacity-90 transition block mx-auto mt-2"
                        >
                             Trocar Livro
                         </button>
                    </div>

                    <div v-else class="flex flex-col items-center">
                        <p class="font-display text-md mb-4">Nenhum livro comunitário selecionado</p>
                        <button 
                            v-if="souLider" 
                            @click="mostrarModalLivro = true"
                            class="botao"
                        >
                            Selecionar
                        </button>
                         <p v-else class="text-xs mt-2">Aguardando o líder selecionar.</p>
                    </div>
                </div>
            </div>

            <!-- membros -->
            <div class="flex flex-col">
             <h2
                class="bg-incipit-card text-texto font-display text-center rounded-[30px] justify-self-start px-15 shadow-lg"
              >
                Membros
              </h2>

                <div class="bg-incipit-card rounded-[30px] p-6 shadow-md h-fit max-h-[400px] overflow-y-auto">
                    <div v-if="comunidade.expand?.membros" class="space-y-4">
                        <div v-for="membro in comunidade.expand.membros" :key="membro.id" class="flex items-center gap-3">
                            <!-- foto -->
                            <div class="w-10 h-10 rounded-full border-2 border-roxo overflow-hidden bg-white flex-shrink-0">
                                <img v-if="getAvatarUsuario(membro)" :src="getAvatarUsuario(membro)" class="w-full h-full object-cover" />
                            </div>
                            
                            <!-- membros lista -->
                            <div class="flex items-center gap-2 flex-1 min-w-0">
                                <span class="font-bold text-sm truncate">{{ membro.name || membro.username }}</span>
                                <div v-if="membro.id === comunidade.lider" class="i-mdi:crown text-yellow-600 text-sm" title="Líder"></div>
                            </div>

                            <!-- açoes  -->
                            <button v-if="souLider && membro.id !== usuarioAtual.id" class="text-roxo bg-[rgba(166,141,173,0.2)] rounded-[100%] border-0 hover:text-red-500">
                                <div class="i-mdi:close"></div>
                            </button>
                        </div>
                    </div>
                    <p v-else class="text-center text-sm">Lista vazia.</p>
                </div>
            </div>

        </div>

      </div>
    </main>

    <!-- modal  -->
    <div v-if="mostrarModalLivro" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-[#f3eddb] rounded-[30px] p-5 max-w-md w-full shadow-2xl border-4 border-incipit-card">
        <h3 class="text-2xl font-display text-[#3d3131] mb-6 mt-2 text-center">Selecionar Livro</h3>
        
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-bold mb-2 ml-2">ID do Livro</label>
                <input 
                  v-model="livroIdInput" 
                  type="text" 
                  placeholder="Cole o ISBN aqui..."
                  class="w-full bg-incipit-card rounded-xl box-border p-3 border-none outline-none focus:ring-2 focus:ring-roxo"
                />
                <p class="text-xs mt-1 ml-2 opacity-60">Copie o ID da URL da página do livro.</p>
            </div>
            
            <div>
                <label class="block text-sm font-bold mb-2 ml-2">Duração (dias)</label>
                <input 
                  v-model.number="diasDuracao" 
                  type="number" 
                  min="1" 
                  class="w-full bg-incipit-card rounded-xl box-border p-3 border-none outline-none focus:ring-2 focus:ring-roxo"
                />
            </div>
        </div>
        
        <div class="flex gap-4 mt-8">
            <button @click="mostrarModalLivro = false" class="botao">
                Cancelar
            </button>
            <button @click="salvarLivroSemana" class="botao">
                Salvar
            </button>
        </div>
      </div>
    </div>

  </div>
</template>
