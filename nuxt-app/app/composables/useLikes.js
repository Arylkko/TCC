// Composable para gerenciar likes em comentários e notas
export const useLikes = () => {
  const { $pb } = useNuxtApp();
  const { ganharXPReceberLike } = useXP();

  // Toggle like em comentário
  const toggleLikeComentario = async (comentarioId) => {
    try {
      const usuarioId = $pb.authStore.model?.id;
      if (!usuarioId) {
        return { sucesso: false, erro: 'Usuário não autenticado' };
      }

      // Buscar comentário atual
      const comentario = await $pb.collection('comentario').getOne(comentarioId, {
        expand: 'autor',
        $autoCancel: false
      });

      const likes = comentario.likes || [];
      const jaDeulLike = likes.includes(usuarioId);

      // Toggle: se já deu like, remove; se não, adiciona
      const atualizado = await $pb.collection('comentario').update(comentarioId, {
        'likes': jaDeulLike ? likes.filter(id => id !== usuarioId) : [...likes, usuarioId]
      }, {
        $autoCancel: false
      });

      // Dar XP ao autor do comentário apenas quando ADICIONA like (não ao remover)
      if (!jaDeulLike && comentario.autor && comentario.autor !== usuarioId) {
        await ganharXPReceberLike(comentario.autor);
      }

      return { 
        sucesso: true, 
        dados: atualizado,
        adicionou: !jaDeulLike 
      };
    } catch (error) {
      console.error('Erro ao dar like no comentário:', error);
      return { sucesso: false, erro: error.message };
    }
  };

  // Toggle like em nota/resenha
  const toggleLikeNota = async (notaId) => {
    try {
      const usuarioId = $pb.authStore.model?.id;
      if (!usuarioId) {
        return { sucesso: false, erro: 'Usuário não autenticado' };
      }

      // Buscar nota atual
      const nota = await $pb.collection('notas').getOne(notaId, {
        expand: 'autor',
        $autoCancel: false
      });

      const likes = nota.likes || [];
      const jaDeulLike = likes.includes(usuarioId);

      // Toggle: se já deu like, remove; se não, adiciona
      const atualizado = await $pb.collection('notas').update(notaId, {
        'likes': jaDeulLike ? likes.filter(id => id !== usuarioId) : [...likes, usuarioId]
      }, {
        $autoCancel: false
      });

      // Dar XP ao autor da nota apenas quando ADICIONA like (não ao remover)
      if (!jaDeulLike && nota.autor && nota.autor !== usuarioId) {
        await ganharXPReceberLike(nota.autor);
      }

      return { 
        sucesso: true, 
        dados: atualizado,
        adicionou: !jaDeulLike 
      };
    } catch (error) {
      console.error('Erro ao dar like na nota:', error);
      return { sucesso: false, erro: error.message };
    }
  };

  // Verificar se usuário já deu like no comentário
  const usuarioDeulLikeComentario = (comentario, usuarioId) => {
    if (!comentario || !comentario.likes) return false;
    return comentario.likes.includes(usuarioId);
  };

  // Verificar se usuário já deu like na nota
  const usuarioDeulLikeNota = (nota, usuarioId) => {
    if (!nota || !nota.likes) return false;
    return nota.likes.includes(usuarioId);
  };

  return {
    toggleLikeComentario,
    toggleLikeNota,
    usuarioDeulLikeComentario,
    usuarioDeulLikeNota
  };
};