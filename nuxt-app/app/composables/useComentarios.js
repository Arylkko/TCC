// Composable para gerenciar comentários e respostas
export const useComentarios = () => {
  const { $pb } = useNuxtApp();
  const { ganharXPReceberComentario } = useXP();

  // Busca todos os comentários de um livro (apenas comentários principais, sem respostas)
  const buscarComentariosLivro = async (livroId) => {
    try {
      const comentarios = await $pb.collection('comentario').getList(1, 50, {
        filter: `livro = "${livroId}" && comentario_pai = ""`,
        expand: 'autor',
        sort: '-created',
        $autoCancel: false
      });
      return { sucesso: true, dados: comentarios.items };
    } catch (error) {
      if (error.isAbort) {
        console.log('Requisição cancelada (normal):', livroId);
        return { sucesso: true, dados: [] };
      }
      console.error('Erro ao buscar comentários:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar comentários' };
    }
  };

  // Busca um comentário específico com suas respostas
  const buscarComentarioPorId = async (comentarioId) => {
    try {
      // Busca o comentário principal
      const comentario = await $pb.collection('comentario').getOne(comentarioId, {
        expand: 'autor,livro',
        requestKey: `comentario_${comentarioId}`
      });

      // Busca as respostas deste comentário
      const respostas = await $pb.collection('comentario').getList(1, 50, {
        filter: `comentario_pai = "${comentarioId}"`,
        expand: 'autor',
        sort: '-created',
        requestKey: `respostas_${comentarioId}`
      });

      // Adiciona as respostas ao comentário
      comentario.respostas = respostas.items;

      return { sucesso: true, dados: comentario };
    } catch (error) {
      if (error.isAbort) {
        console.log('Requisição cancelada (normal):', comentarioId);
        return { sucesso: false, erro: 'Requisição cancelada' };
      }
      console.error('Erro ao buscar comentário:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar comentário' };
    }
  };

  // Busca comentários com suas respostas (para página do livro)
  const buscarComentariosComRespostas = async (livroId) => {
    try {
      // Busca comentários principais
      const comentarios = await $pb.collection('comentario').getList(1, 50, {
        filter: `livro = "${livroId}" && comentario_pai = ""`,
        expand: 'autor',
        sort: '-created',
        $autoCancel: false
      });

      // Para cada comentário, busca suas respostas
      const comentariosComRespostas = await Promise.all(
        comentarios.items.map(async (comentario) => {
          const respostas = await $pb.collection('comentario').getList(1, 50, {
            filter: `comentario_pai = "${comentario.id}"`,
            expand: 'autor',
            sort: 'created',
            $autoCancel: false
          });
          
          return {
            ...comentario,
            respostas: respostas.items
          };
        })
      );

      return { sucesso: true, dados: comentariosComRespostas };
    } catch (error) {
      if (error.isAbort) {
        console.log('Requisição cancelada (normal):', livroId);
        return { sucesso: true, dados: [] };
      }
      console.error('Erro ao buscar comentários com respostas:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar comentários' };
    }
  };

  // Cria um novo comentário
  const criarComentario = async (dados) => {
    try {
      const novoComentario = await $pb.collection('comentario').create(dados);
      return { sucesso: true, dados: novoComentario };
    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      return { sucesso: false, erro: error.message || 'Erro ao criar comentário' };
    }
  };

  // Responde a um comentário (cria um comentário filho)
  const responderComentario = async (comentarioPaiId, livroId, conteudo, autorId) => {
    try {
      const resposta = await $pb.collection('comentario').create({
        livro: livroId,
        autor: autorId,
        conteudo: conteudo,
        comentario_pai: comentarioPaiId,
        likes: []
      });
      
      // Buscar autor do comentário pai para dar XP
      const comentarioPai = await $pb.collection('comentario').getOne(comentarioPaiId, {
        fields: 'autor'
      });
      
      // Dar XP ao autor do comentário pai (se não for ele mesmo respondendo)
      if (comentarioPai.autor && comentarioPai.autor !== autorId) {
        await ganharXPReceberComentario(comentarioPai.autor);
      }
      
      return { sucesso: true, dados: resposta };
    } catch (error) {
      console.error('Erro ao responder comentário:', error);
      return { sucesso: false, erro: error.message || 'Erro ao responder comentário' };
    }
  };

  // Atualiza um comentário
  const atualizarComentario = async (comentarioId, dados) => {
    try {
      const comentarioAtualizado = await $pb.collection('comentario').update(comentarioId, dados);
      return { sucesso: true, dados: comentarioAtualizado };
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

  return {
    buscarComentariosLivro,
    buscarComentarioPorId,
    buscarComentariosComRespostas,
    criarComentario,
    responderComentario,
    atualizarComentario,
    deletarComentario
  };
};