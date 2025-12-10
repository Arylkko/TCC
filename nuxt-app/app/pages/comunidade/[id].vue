<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useComunidades } from '~/composables/useComunidades';
import { useConquistas } from '~/composables/useConquistas';
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

// Busca de livros no modal
const buscaLivro = ref('');
const resultadosBusca = ref([]);
const buscandoLivros = ref(false);
const livroSelecionado = ref(null);

// Comentários
const comentarios = ref([]);
const novoComentario = ref('');
const enviandoComentario = ref(false);
const comentarioTemSpoiler = ref(false);
const comentariosRevelados = ref(new Set()); // IDs dos comentários revelados

// Conquistas
const conquistaObtida = ref(null);

const {
  buscarComunidadePorId,
  entrarNaComunidade,
  sairDaComunidade,
  expulsarMembro,
  ehLider,
  ehMembro,
  definirLivroSemana,
  buscarComentarios,
  criarComentario
} = useComunidades();

const { buscarDadosLivroAPI } = useLivros();
const { toggleLikeComentario, usuarioDeulLikeComentario } = useLikes();
const { deletarComentario } = useComentarios();
const { verificarConquistaComentador, verificarConquistaMembroGalera } = useConquistas();

const usuarioAtual = computed(() => $pb.authStore.model);
const souLider = computed(() => ehLider(comunidade.value));
const souMembro = computed(() => ehMembro(comunidade.value));

// Avatar da Comunidade (Placeholder se não tiver)
const avatarComunidade = computed(() => {
    if (comunidade.value?.imagem_comunidade) {
        return $pb.files.getURL(comunidade.value, comunidade.value.imagem_comunidade)
    }
    return 'https://via.placeholder.com/150/000000/FFFFFF/?text=' + (comunidade.value?.nome?.[0] || 'C');
});

// Avatar do Usuário (Helper)
function getAvatarUsuario(usuario) {
    if (usuario?.avatar) {
        return $pb.files.getURL(usuario, usuario.avatar);
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
    console.log('Tentando entrar - ID da comunidade:', comunidadeId);
    console.log('Usuário atual:', $pb.authStore.model);
    
    const resultado = await entrarNaComunidade(comunidadeId);
    
    console.log('Resultado de entrar:', resultado);
    
    if (resultado.sucesso) {
      await carregarComunidade();
      
      // Verificar conquista "Membro da Galera"
      if (resultado.conquistaObtida) {
        conquistaObtida.value = resultado.conquistaObtida;
        setTimeout(() => {
          conquistaObtida.value = null;
        }, 5500);
      }
      
      alert('Você entrou na comunidade com sucesso!');
    } else {
      alert(resultado.erro);
    }
  }
}

async function salvarLivroSemana() {
  if (!livroSelecionado.value) {
    alert('Selecione um livro primeiro');
    return;
  }

  const resultado = await definirLivroSemana(comunidadeId, livroSelecionado.value.id, diasDuracao.value);
  
  if (resultado.sucesso) {
    alert('Livro da semana definido com sucesso!');
    mostrarModalLivro.value = false;
    livroSelecionado.value = null;
    buscaLivro.value = '';
    resultadosBusca.value = [];
    await carregarComunidade();
  } else {
    alert('Erro: ' + resultado.erro);
  }
}

// Buscar livros na API do Google Books
async function buscarLivrosAPI() {
  if (!buscaLivro.value.trim()) {
    resultadosBusca.value = [];
    return;
  }

  buscandoLivros.value = true;
  
  try {
    const query = encodeURIComponent(buscaLivro.value.trim());
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=10`);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      resultadosBusca.value = data.items.map(item => ({
        googleId: item.id,
        isbn: item.volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || 
              item.volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier || '',
        nome: item.volumeInfo.title || 'Título não disponível',
        autor: item.volumeInfo.authors?.join(', ') || 'Autor desconhecido',
        capa: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
        editora: item.volumeInfo.publisher || '',
        anoPublicacao: item.volumeInfo.publishedDate?.split('-')[0] || ''
      }));
    } else {
      resultadosBusca.value = [];
    }
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    alert('Erro ao buscar livros');
  } finally {
    buscandoLivros.value = false;
  }
}

// Selecionar livro e salvar no PocketBase se não existir
async function selecionarLivro(livro) {
  try {
    // Verificar se o livro já existe no PocketBase
    let livroNoBanco = null;
    
    if (livro.isbn) {
      try {
        livroNoBanco = await $pb.collection('livro').getFirstListItem(`ISBN = "${livro.isbn}"`);
      } catch (error) {
        // Livro não existe, vamos criar
        if (error.status === 404) {
          const novoLivro = await $pb.collection('livro').create({
            ISBN: livro.isbn,
            Nome: livro.nome,
            Autor: livro.autor,
            Editora: livro.editora,
            Ano_publicacao: livro.anoPublicacao
          });
          livroNoBanco = novoLivro;
        } else {
          throw error;
        }
      }
    } else {
      // Sem ISBN, criar livro mesmo assim
      const novoLivro = await $pb.collection('livro').create({
        ISBN: livro.googleId, // Usar ID do Google como fallback
        Nome: livro.nome,
        Autor: livro.autor,
        Editora: livro.editora,
        Ano_publicacao: livro.anoPublicacao
      });
      livroNoBanco = novoLivro;
    }

    // Armazenar o livro selecionado com a capa da API
    livroSelecionado.value = {
      ...livroNoBanco,
      capa: livro.capa // Manter a capa da API para exibição
    };

  } catch (error) {
    console.error('Erro ao selecionar livro:', error);
    alert('Erro ao selecionar livro: ' + error.message);
  }
}

function ExpandirComentario(comentario) {

  if (comentario.id) {
    navigateTo(`/comentario/c${comentario.id}`);
  } else {
    alert("Comentário não encontrada.");
  }
}
// Limpar seleção
function limparSelecao() {
  livroSelecionado.value = null;
}

async function enviarComentario() {
  if (!novoComentario.value.trim()) return;

  enviandoComentario.value = true;
  const resultado = await criarComentario(comunidadeId, novoComentario.value, comentarioTemSpoiler.value);
  
  if (resultado.sucesso) {
    novoComentario.value = '';
    comentarioTemSpoiler.value = false;
    await carregarComentarios();
    
    // Verificar conquista "Comentador"
    if (resultado.conquistaObtida) {
      conquistaObtida.value = resultado.conquistaObtida;
      setTimeout(() => {
        conquistaObtida.value = null;
      }, 5500);
    }
  } else {
    alert('Erro ao enviar comentário: ' + resultado.erro);
  }
  
  enviandoComentario.value = false;
}

// Toggle revelar/ocultar spoiler
function toggleSpoiler(comentarioId) {
  if (comentariosRevelados.value.has(comentarioId)) {
    comentariosRevelados.value.delete(comentarioId);
  } else {
    comentariosRevelados.value.add(comentarioId);
  }
}

// Verificar se comentário está revelado
function comentarioRevelado(comentarioId) {
  return comentariosRevelados.value.has(comentarioId);
}

// Likes
async function darLikeComentario(comentarioId) {
  if (!$pb.authStore.isValid) {
    alert('Faça login para curtir');
    return;
  }

  const resultado = await toggleLikeComentario(comentarioId);
  if (resultado.sucesso) {
    await carregarComentarios();
  } else {
    alert('Erro ao curtir: ' + resultado.erro);
  }
}

// Deletar comentário
async function removerComentario(comentarioId, autorId) {
  // Verificar se o usuário é o autor do comentário ou líder da comunidade
  if (autorId !== $pb.authStore.model?.id && !souLider.value) {
    alert('Você só pode deletar seus próprios comentários');
    return;
  }

  if (!confirm('Tem certeza que deseja deletar este comentário?')) {
    return;
  }

  const resultado = await deletarComentario(comentarioId);
  if (resultado.sucesso) {
    await carregarComentarios();
  } else {
    alert('Erro ao deletar comentário: ' + resultado.erro);
  }
}

// Expulsar membro
async function expulsarMembroDaComunidade(membroId) {
  if (!confirm('Tem certeza que deseja expulsar este membro?')) {
    return;
  }

  const resultado = await expulsarMembro(comunidadeId, membroId);
  
  if (resultado.sucesso) {
    await carregarComunidade();
    alert('Membro expulso com sucesso');
  } else {
    alert('Erro ao expulsar membro: ' + resultado.erro);
  }
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
              </h2>            <!-- input -->
            <div v-if="souMembro" class="bg-[#e6decf] rounded-[30px] p-4 shadow-sm flex gap-4 items-start mb-4">
                 <div class="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                     <!-- Avatar user atual -->
                     <img v-if="getAvatarUsuario(usuarioAtual)" :src="getAvatarUsuario(usuarioAtual)" class="w-full h-full object-cover" />
                     <div v-else class="w-full h-full bg-roxo"></div>
                 </div>
                 <div class="flex-1">
                     <textarea 
                        v-model="novoComentario"
                        placeholder="Escreva algo..." 
                        rows="2"
                        class="w-full bg-incipit-fundo box-border rounded-xl p-3 border-none focus:ring-2 focus:ring-roxo outline-none resize-none text-sm mb-2"
                     ></textarea>
                     
                     <!-- Checkbox de Spoiler -->
                     <div class="flex items-center justify-between">
                       <div class="flex items-center gap-2 ml-2">
                         <input 
                           type="checkbox" 
                           id="comentario-spoiler-checkbox"
                           v-model="comentarioTemSpoiler"
                           class="w-4 h-4 text-roxo border-gray-300 rounded focus:ring-roxo cursor-pointer"
                         />
                         <label for="comentario-spoiler-checkbox" class="text-xs text-texto cursor-pointer">
                           Este comentário contém spoilers
                         </label>
                       </div>
                       
                       <button 
                          @click="enviarComentario"
                          :disabled="!novoComentario.trim() || enviandoComentario"
                          class="text-roxo border-0 hover:text-[#7a6a8f] disabled:opacity-50"
                       >
                          <div class="i-mdi:send text-xl"></div>
                       </button>
                     </div>
                 </div>
            </div>

            <!-- lista coment  -->
            <div class="space-y-6 pb-10">
                <div v-if="comentarios.length === 0" class="text-center opacity-50 py-10">
                    Nenhum comentário ainda.
                </div>

                <div v-for="comentario in comentarios" :key="comentario.id" class="flex gap-4 group" @click="ExpandirComentario(comentario)">
                    <!-- Avatar Lateral -->
                    <div class="flex flex-col items-center gap-1 flex-shrink-0 w-16">
                    <div
                      class="w-15 h-15 rounded-full border-2 border-roxo overflow-hidden bg-roxo"
                    >
           <img 
                                v-if="getAvatarUsuario(comentario.expand?.autor)" 
                                :src="getAvatarUsuario(comentario.expand?.autor)" 
                                class="w-full h-full object-cover " 
                            />
                    </div>
                    <span
                      class="font-display mt-2 text-texto text-center leading-tight truncate w-full"
                    >
                      {{ comentario.expand?.autor?.name || "User" }}
                    </span>
                  </div>                  <div
                    class="relative flex-1 bg-incipit-card rounded-[20px] p-5 shadow-sm min-w-0 cursor-pointer"
                  >
                    <div
                      class="absolute top-6 -left-2 w-4 h-4 bg-incipit-card transform rotate-45"
                    ></div>

                    <button
                      v-if="comentario.expand?.autor?.id === $pb.authStore.model?.id"
                      @click.stop="removerComentario(comentario.id, comentario.expand?.autor?.id)"
                      class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition border-0 cursor-pointer"
                      title="Deletar comentário"
                    >
                      <div class="i-mdi:close text-sm"></div>
                    </button>

                    <h4 class="font-bold text-[#3d3131] mb-1 mt-0 text-sm">
                      {{ comentario.expand?.autor?.name || "Leitor" }} diz:
                    </h4>
                    
                    <!-- Conteúdo com/sem spoiler -->
                    <div v-if="comentario.spoiler && !comentarioRevelado(comentario.id)" 
                         @click.stop="toggleSpoiler(comentario.id)"
                         class="cursor-pointer text-[#3d3131]/60 italic text-sm py-2 mb-4">
                      <span class="hover:text-[#3d3131] transition">
                        Este comentário contém spoilers. Clique para revelar.
                      </span>
                    </div>
                    
                    <p v-else
                      @click.stop="comentario.spoiler ? toggleSpoiler(comentario.id) : null"
                      :class="['text-[#3d3131] text-sm leading-relaxed mb-4 break-words whitespace-pre-wrap', 
                               comentario.spoiler && comentarioRevelado(comentario.id) ? 'cursor-pointer' : '']"
                    >
                      {{ comentario.conteudo }}
                      <span v-if="comentario.spoiler && comentarioRevelado(comentario.id)" 
                            class="text-xs text-roxo/60 italic block mt-2">
                        (Clique para ocultar)
                      </span>
                    </p>

                    <div class="flex justify-between items-center">
                      <div class="flex gap-4 text-roxo text-xs">
                        <div 
                          @click.stop="darLikeComentario(comentario.id)"
                          class="flex items-center gap-1 cursor-pointer hover:scale-110 transition"
                          :class="{ 'text-red-500': usuarioDeulLikeComentario(comentario, $pb.authStore.model?.id) }"
                        >
                          <div 
                            :class="[
                              'text-lg',
                              usuarioDeulLikeComentario(comentario, $pb.authStore.model?.id) 
                                ? 'i-mdi:heart' 
                                : 'i-mdi:heart-outline' 
                            ]"
                          ></div>
                          <span class="text-texto/60 text-xs">{{ comentario.likes?.length || 0 }}</span>
                        </div>

                        <div class="flex items-center gap-1">
                            <div class="i-mdi:comment"></div>
                          comentários
                        </div>
                      </div>

                      <button
                        class="bg-roxo text-branco py-1 px-2 rounded-full border-0 font-sono text-xs"
                      >
                        {{ comentario.spoiler ? 'COM spoilers' : 'SEM spoilers' }}
                      </button>
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
                            </div>                            <!-- açoes  -->
                            <button 
                              v-if="souLider && membro.id !== usuarioAtual?.id" 
                              @click="expulsarMembroDaComunidade(membro.id)"
                              class="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition border-0 cursor-pointer"
                              title="Expulsar membro"
                            >
                                <div class="i-mdi:close text-sm"></div>
                            </button>
                        </div>
                    </div>
                    <p v-else class="text-center text-sm">Lista vazia.</p>
                </div>
            </div>

        </div>      </div>
    </main>
    
    <!-- Notificação de Conquista -->
    <ConquistaNotificacao :conquista="conquistaObtida" />

    <!-- Modal Selecionar Livro -->
    <div v-if="mostrarModalLivro" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-[#f3eddb] rounded-[30px] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-incipit-card">
        <h3 class="text-2xl font-display text-[#3d3131] mb-6 text-center">Selecionar Livro Comunitário</h3>
        
        <!-- Campo de Busca -->
        <div class="mb-6">
          <div class="relative">
            <input 
              v-model="buscaLivro"
              @input="buscarLivrosAPI"
              type="text" 
              placeholder="Digite o nome do livro para buscar..."
              class="w-full bg-incipit-card rounded-xl box-border p-4 pr-12 border-none outline-none focus:ring-2 focus:ring-roxo"
            />
            <div v-if="buscandoLivros" class="absolute right-4 top-1/2 -translate-y-1/2">
              <div class="i-mdi:loading animate-spin text-2xl text-roxo"></div>
            </div>
            <div v-else class="absolute right-4 top-1/2 -translate-y-1/2">
              <div class="i-mdi:magnify text-2xl text-roxo/50"></div>
            </div>
          </div>
          <p class="text-xs mt-2 ml-2 opacity-60">Busque por título, autor ou ISBN</p>
        </div>

        <!-- Livro Selecionado -->
        <div v-if="livroSelecionado" class="mb-6 p-4 bg-roxo/10 rounded-xl border-2 border-roxo">
          <div class="flex items-center gap-4">
            <img 
              v-if="livroSelecionado.capa" 
              :src="livroSelecionado.capa" 
              :alt="livroSelecionado.Nome"
              class="w-16 h-24 object-cover rounded-lg shadow-md"
            />
            <div class="flex-1">
              <h4 class="font-bold text-lg">{{ livroSelecionado.Nome }}</h4>
              <p class="text-sm opacity-70">{{ livroSelecionado.Autor }}</p>
              <p class="text-xs mt-1 text-roxo font-bold">✓ Selecionado</p>
            </div>
            <button 
              @click="limparSelecao"
              class="text-red-500 hover:text-red-700"
            >
              <div class="i-mdi:close text-2xl"></div>
            </button>
          </div>
        </div>

        <!-- Resultados da Busca -->
        <div v-if="resultadosBusca.length > 0 && !livroSelecionado" class="mb-6 max-h-96 overflow-y-auto space-y-2">
          <p class="text-sm font-bold mb-3">Resultados da busca:</p>
          <div 
            v-for="livro in resultadosBusca" 
            :key="livro.googleId"
            @click="selecionarLivro(livro)"
            class="flex gap-3 p-3 bg-incipit-card rounded-xl hover:bg-roxo/20 cursor-pointer transition"
          >
            <img 
              v-if="livro.capa" 
              :src="livro.capa" 
              :alt="livro.nome"
              class="w-12 h-16 object-cover rounded shadow-sm"
            />
            <div class="w-12 h-16 bg-gray-200 rounded flex items-center justify-center" v-else>
              <div class="i-mdi:book text-gray-400"></div>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-sm truncate">{{ livro.nome }}</h4>
              <p class="text-xs opacity-70 truncate">{{ livro.autor }}</p>
              <p class="text-xs opacity-50">{{ livro.anoPublicacao }}</p>
            </div>
            <div class="i-mdi:chevron-right text-2xl text-roxo/50"></div>
          </div>
        </div>

        <!-- Mensagem vazia -->
        <div v-if="buscaLivro && resultadosBusca.length === 0 && !buscandoLivros && !livroSelecionado" class="text-center py-8 opacity-50">
          <div class="i-mdi:book-search text-5xl mb-2"></div>
          <p>Nenhum livro encontrado</p>
        </div>

        <!-- Duração -->
        <div v-if="livroSelecionado" class="mb-6">
          <label class="block text-sm font-bold mb-2 ml-2">Duração da leitura (dias)</label>
          <input 
            v-model.number="diasDuracao" 
            type="number" 
            min="1" 
            max="365"
            class="w-full bg-incipit-card rounded-xl box-border p-3 border-none outline-none focus:ring-2 focus:ring-roxo"
          />
        </div>
        
        <!-- Botões -->
        <div class="flex gap-4 mt-6">
          <button 
            @click="mostrarModalLivro = false; limparSelecao(); buscaLivro = ''; resultadosBusca = [];" 
            class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-full font-bold hover:bg-gray-400 transition"
          >
            Cancelar
          </button>
          <button 
            @click="salvarLivroSemana" 
            :disabled="!livroSelecionado"
            class="flex-1 bg-roxo text-white px-6 py-3 rounded-full font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar Seleção
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
