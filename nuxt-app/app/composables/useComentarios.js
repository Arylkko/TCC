// composables/useComentarios.js

export const useComentarios = () => {
  const { $pb } = useNuxtApp();
  const { ganharXPReceberComentario } = useXP(); 

  // Busca todos os comentários de um livro (apenas comentários principais, sem respostas)
  const buscarComentariosLivro = async (livroId) => {
    try {
      const comentarios = await $pb.collection('comentario').getList(1, 50, {
        filter: `livro = "${livroId}" && comentario_pai = null`,
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
      // Inclui 'comunidade' no expand
      const comentario = await $pb.collection('comentario').getOne(comentarioId, {
        expand: 'autor,livro,comunidade', 
        requestKey: `comentario_${comentarioId}`
      });

      // Busca as respostas deste comentário
      const respostas = await $pb.collection('comentario').getList(1, 50, {
        filter: `comentario_pai = "${comentarioId}"`,
        expand: 'autor', 
        sort: 'created',
        requestKey: `respostas_${comentarioId}`
      });

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

  // Busca comentários com suas respostas (para listagem de tópicos principais)
  const buscarComentariosComRespostas = async (origemId, tipoOrigem = 'livro') => {
    try {
      const filterField = tipoOrigem === 'livro' ? 'livro' : 'comunidade';
      
      // Filtra APENAS COMENTÁRIOS PRINCIPAIS (sem pai)
      const comentarios = await $pb.collection('comentario').getList(1, 50, {
        filter: `${filterField} = "${origemId}" && comentario_pai = null`, // null ao invés de ""
        expand: 'autor',
        sort: '-created',
        $autoCancel: false
      });

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
        console.log('Requisição cancelada (normal):', origemId);
        return { sucesso: true, dados: [] };
      }
      console.error('Erro ao buscar comentários com respostas:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar comentários' };
    }
  };

  // Cria um novo comentário (para o comentário principal)
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
  const responderComentario = async (comentarioPaiId, origemId, conteudo, autorId, tipoOrigem) => {
    try {
      // Estrutura base do comentário
      const dadosCriacao = {
        autor: autorId,
        conteudo: conteudo,
        spoiler: false, 
        comentario_pai: comentarioPaiId,
        likes: []
      };

      // Define o campo de origem correto (livro ou comunidade)
      if (tipoOrigem === 'livro') {
        dadosCriacao.livro = origemId;
        // Garante que comunidade está vazio/null
        dadosCriacao.comunidade = "";
      } else if (tipoOrigem === 'comunidade') {
        dadosCriacao.comunidade = origemId;
        // Garante que livro está vazio/null
        dadosCriacao.livro = "";
      } else {
        throw new Error("Tipo de origem inválido: deve ser 'livro' ou 'comunidade'.");
      }

      console.log('Dados que serão enviados:', dadosCriacao);

      const resposta = await $pb.collection('comentario').create(dadosCriacao);
      
      // Lógica de XP
      try {
        const comentarioPai = await $pb.collection('comentario').getOne(comentarioPaiId, {
          fields: 'autor'
        });
        
        if (comentarioPai.autor && comentarioPai.autor !== autorId) {
          await ganharXPReceberComentario(comentarioPai.autor);
        }
      } catch (xpError) {
        console.warn('Erro ao processar XP, mas comentário foi criado:', xpError);
      }
      
      return { sucesso: true, dados: resposta };
    } catch (error) {
      console.error('Erro ao responder comentário:', error);
      console.error('Detalhes do erro:', error.data);
      return { 
        sucesso: false, 
        erro: error.data?.data ? JSON.stringify(error.data.data) : error.message || 'Erro ao responder comentário' 
      };
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