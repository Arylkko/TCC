// Composable para gerenciar comentários e respostas
export const useComentarios = () => {
  const { $pb } = useNuxtApp();
  // Busca todos os comentários de um livro (apenas comentários principais, sem respostas)
  const buscarComentariosLivro = async (livroId) => {
    try {
      const comentarios = await $pb.collection('comentario').getList(1, 50, {
        filter: `livro = "${livroId}" && comentario_pai = ""`,
        expand: 'autor',
        sort: '-created',
        requestKey: `comentarios_livro_${livroId}` // Previne auto-cancellation
      });
      return { sucesso: true, dados: comentarios.items };
    } catch (error) {
      // Ignora erro de auto-cancellation
      if (error.isAbort) {
        console.log('Requisição cancelada (normal):', livroId);
        return { sucesso: true, dados: [] };
      }
      console.error('Erro ao buscar comentários:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar comentários' };
    }
  };
  // Busca respostas de um comentário específico
  const buscarRespostas = async (comentarioId) => {
    try {
      // Adiciona requestKey único para evitar auto-cancellation
      const respostas = await $pb.collection('comentario').getList(1, 50, {
        filter: `comentario_pai = "${comentarioId}"`,
        expand: 'autor',
        sort: 'created',
        requestKey: `respostas_${comentarioId}` // Previne auto-cancellation
      });
      return { sucesso: true, dados: respostas.items };
    } catch (error) {
      // Ignora erro de auto-cancellation
      if (error.isAbort) {
        console.log('Requisição cancelada (normal):', comentarioId);
        return { sucesso: true, dados: [] };
      }
      console.error('Erro ao buscar respostas:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar respostas' };
    }
  };

  // Cria um novo comentário
  const criarComentario = async (dadosComentario) => {
    try {
      const comentario = await $pb.collection('comentario').create(dadosComentario);
      return { sucesso: true, dados: comentario };
    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      return { sucesso: false, erro: error.message || 'Erro ao criar comentário' };
    }
  };

  // Cria uma resposta a um comentário
  const responderComentario = async (comentarioPaiId, livroId, conteudo, autorId) => {
    try {
      const resposta = await $pb.collection('comentario').create({
        conteudo,
        autor: autorId,
        livro: livroId,
        comentario_pai: comentarioPaiId
      });
      return { sucesso: true, dados: resposta };
    } catch (error) {
      console.error('Erro ao responder comentário:', error);
      return { sucesso: false, erro: error.message || 'Erro ao responder comentário' };
    }
  };

  // Atualiza um comentário
  const atualizarComentario = async (comentarioId, conteudo) => {
    try {
      const comentario = await $pb.collection('comentario').update(comentarioId, { conteudo });
      return { sucesso: true, dados: comentario };
    } catch (error) {
      console.error('Erro ao atualizar comentário:', error);
      return { sucesso: false, erro: error.message || 'Erro ao atualizar comentário' };
    }
  };

  // Deleta um comentário
  const deletarComentario = async (comentarioId) => {
    try {
      await $pb.collection('comentario').delete(comentarioId);
      return { sucesso: true };
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
      return { sucesso: false, erro: error.message || 'Erro ao deletar comentário' };
    }
  };

  // Busca comentários com suas respostas (hierárquico)
  const buscarComentariosComRespostas = async (livroId) => {
    try {
      const comentariosPrincipais = await buscarComentariosLivro(livroId);
      
      if (!comentariosPrincipais.sucesso) {
        return comentariosPrincipais;
      }

      // Para cada comentário principal, busca suas respostas
      const comentariosCompletos = await Promise.all(
        comentariosPrincipais.dados.map(async (comentario) => {
          const respostas = await buscarRespostas(comentario.id);
          return {
            ...comentario,
            respostas: respostas.sucesso ? respostas.dados : []
          };
        })
      );

      return { sucesso: true, dados: comentariosCompletos };
    } catch (error) {
      console.error('Erro ao buscar comentários com respostas:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar comentários' };
    }
  };

  return {
    buscarComentariosLivro,
    buscarRespostas,
    criarComentario,
    responderComentario,
    atualizarComentario,
    deletarComentario,
    buscarComentariosComRespostas
  };
};
