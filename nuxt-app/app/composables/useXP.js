// Composable para gerenciar sistema de XP dos usuários
export const useXP = () => {
  const { $pb } = useNuxtApp();

  // Valores de XP por ação
  const XP_VALUES = {
    ABRIR_LIVRO: 1,
    LIVRO_LIDO: 20,
    COMENTARIO: 20,
    RECEBER_COMENTARIO: 20,
    RECEBER_LIKE: 20,
    RESENHA: 40,
    CRIAR_COMUNIDADE: 50,
    CRIAR_LISTA: 50
  };

  // Função principal para adicionar XP ao usuário
  const adicionarXP = async (usuarioId, quantidade) => {
    try {
      if (!usuarioId || quantidade <= 0) {
        return { sucesso: false, erro: 'Parâmetros inválidos' };
      }

      // Buscar usuário atual
      const usuario = await $pb.collection('users').getOne(usuarioId);
      const xpAtual = usuario.XP || 0;
      const novoXP = xpAtual + quantidade;

      // Atualizar XP
      const atualizado = await $pb.collection('users').update(usuarioId, {
        XP: novoXP
      });

      console.log(`✨ +${quantidade} XP | Total: ${novoXP}`);
      return { sucesso: true, xpAnterior: xpAtual, xpNovo: novoXP, ganho: quantidade };
    } catch (error) {
      console.error('Erro ao adicionar XP:', error);
      return { sucesso: false, erro: error.message };
    }
  };

  // XP por abrir livro (toda vez)
  const ganharXPAbrirLivro = async (usuarioId) => {
    return await adicionarXP(usuarioId, XP_VALUES.ABRIR_LIVRO);
  };

  // XP por marcar livro como lido
  const ganharXPLivroLido = async (usuarioId) => {
    return await adicionarXP(usuarioId, XP_VALUES.LIVRO_LIDO);
  };

  // XP por fazer comentário
  const ganharXPComentario = async (usuarioId) => {
    return await adicionarXP(usuarioId, XP_VALUES.COMENTARIO);
  };

  // XP por receber comentário (resposta)
  const ganharXPReceberComentario = async (usuarioId) => {
    return await adicionarXP(usuarioId, XP_VALUES.RECEBER_COMENTARIO);
  };

  // XP por receber like
  const ganharXPReceberLike = async (usuarioId) => {
    return await adicionarXP(usuarioId, XP_VALUES.RECEBER_LIKE);
  };

  // XP por fazer resenha
  const ganharXPResenha = async (usuarioId) => {
    return await adicionarXP(usuarioId, XP_VALUES.RESENHA);
  };

  // XP por criar comunidade
  const ganharXPCriarComunidade = async (usuarioId) => {
    return await adicionarXP(usuarioId, XP_VALUES.CRIAR_COMUNIDADE);
  };

  // XP por criar lista
  const ganharXPCriarLista = async (usuarioId) => {
    return await adicionarXP(usuarioId, XP_VALUES.CRIAR_LISTA);
  };

  return {
    XP_VALUES,
    adicionarXP,
    ganharXPAbrirLivro,
    ganharXPLivroLido,
    ganharXPComentario,
    ganharXPReceberComentario,
    ganharXPReceberLike,
    ganharXPResenha,
    ganharXPCriarComunidade,
    ganharXPCriarLista
  };
};