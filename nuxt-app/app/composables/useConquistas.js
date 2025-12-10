// Composable para gerenciar conquistas dos usuários
export const useConquistas = () => {
  const { $pb } = useNuxtApp();

  // Buscar todas as conquistas disponíveis
  const buscarTodasConquistas = async () => {
    try {
      const conquistas = await $pb.collection('conquista').getList(1, 50, {
        sort: 'created'
      });
      return { sucesso: true, dados: conquistas.items };
    } catch (error) {
      console.error('Erro ao buscar conquistas:', error);
      return { sucesso: false, erro: error.message };
    }
  };

  // Verificar se usuário já possui uma conquista
  const usuarioPossuiConquista = async (usuarioId, nomeConquista) => {
    try {
      // Buscar a conquista pelo nome
      const conquista = await $pb.collection('conquista').getFirstListItem(
        `nome = "${nomeConquista}"`
      );

      // Verificar se usuário já possui
      const usuarioConquista = await $pb.collection('usuario_conquista').getFirstListItem(
        `usuario = "${usuarioId}" && conquista = "${conquista.id}"`
      );

      return { possui: true, conquistaId: conquista.id };
    } catch (error) {
      if (error.status === 404) {
        return { possui: false, conquistaId: null };
      }
      console.error('Erro ao verificar conquista:', error);
      return { possui: false, conquistaId: null };
    }
  };

  // Conceder conquista ao usuário
  const concederConquista = async (usuarioId, nomeConquista) => {
    try {
      // Verificar se já possui
      const verificacao = await usuarioPossuiConquista(usuarioId, nomeConquista);
      
      if (verificacao.possui) {
        return { sucesso: false, erro: 'Usuário já possui esta conquista', japossuia: true };
      }

      // Buscar dados completos da conquista
      const conquista = await $pb.collection('conquista').getFirstListItem(
        `nome = "${nomeConquista}"`
      );

      // Criar registro na usuario_conquista
      const usuarioConquista = await $pb.collection('usuario_conquista').create({
        usuario: usuarioId,
        conquista: conquista.id,
        data_obtencao: new Date().toISOString()
      });

      console.log(`🏆 Conquista "${nomeConquista}" obtida!`);
      
      return { 
        sucesso: true, 
        dados: usuarioConquista,
        conquista: conquista,
        japossuia: false
      };
    } catch (error) {
      console.error('Erro ao conceder conquista:', error);
      return { sucesso: false, erro: error.message, japossuia: false };
    }
  };

  // Verificar e conceder "Leitor Nato" (primeiro livro lido)
  const verificarConquistaLeitorNato = async (usuarioId) => {
    try {
      // Contar livros com status "Lido"
      const livrosLidos = await $pb.collection('status').getList(1, 1, {
        filter: `usuario = "${usuarioId}" && nome = "Lido"`,
        fields: 'id'
      });

      // Se tem pelo menos 1 livro lido, conceder conquista
      if (livrosLidos.totalItems >= 1) {
        return await concederConquista(usuarioId, 'Leitor Nato');
      }

      return { sucesso: false, erro: 'Critério não atingido' };
    } catch (error) {
      console.error('Erro ao verificar Leitor Nato:', error);
      return { sucesso: false, erro: error.message };
    }
  };

  // Verificar e conceder "Comentador" (primeiro comentário)
  const verificarConquistaComentador = async (usuarioId) => {
    try {
      // Contar comentários do usuário
      const comentarios = await $pb.collection('comentario').getList(1, 1, {
        filter: `autor = "${usuarioId}"`,
        fields: 'id'
      });

      // Se tem pelo menos 1 comentário, conceder conquista
      if (comentarios.totalItems >= 1) {
        return await concederConquista(usuarioId, 'Comentador');
      }

      return { sucesso: false, erro: 'Critério não atingido' };
    } catch (error) {
      console.error('Erro ao verificar Comentador:', error);
      return { sucesso: false, erro: error.message };
    }
  };

  // Verificar e conceder "Membro da Galera" (entrar em uma comunidade)
  const verificarConquistaMembroGalera = async (usuarioId) => {
    try {
      // Contar comunidades que o usuário é membro
      const comunidades = await $pb.collection('comunidade').getList(1, 1, {
        filter: `membros ~ "${usuarioId}"`,
        fields: 'id'
      });

      // Se é membro de pelo menos 1 comunidade, conceder conquista
      if (comunidades.totalItems >= 1) {
        return await concederConquista(usuarioId, 'Membro da Galera');
      }

      return { sucesso: false, erro: 'Critério não atingido' };
    } catch (error) {
      console.error('Erro ao verificar Membro da Galera:', error);
      return { sucesso: false, erro: error.message };
    }
  };

  return {
    buscarTodasConquistas,
    usuarioPossuiConquista,
    concederConquista,
    verificarConquistaLeitorNato,
    verificarConquistaComentador,
    verificarConquistaMembroGalera
  };
};