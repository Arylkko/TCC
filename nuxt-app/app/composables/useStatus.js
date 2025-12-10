// Composable para gerenciar status de leitura
export const useStatus = () => {
  const { $pb } = useNuxtApp();
  const { ganharXPLivroLido } = useXP();

  // Opções de status disponíveis
  const OPCOES_STATUS = [
    { valor: 'Pretendo ler', label: 'Pretendo ler' },
    { valor: 'Lendo', label: 'Lendo' },
    { valor: 'Lido', label: 'Lido' },
    { valor: 'Abandonei', label: 'Abandonei' }
  ];

  // Busca o status de um usuário para um livro específico
  const buscarStatus = async (livroId, usuarioId) => {
    try {
      const status = await $pb.collection('status').getFirstListItem(
        `livro = "${livroId}" && usuario = "${usuarioId}"`
      );
      return { sucesso: true, dados: status };
    } catch (error) {
      if (error.status === 404) {
        return { sucesso: false, erro: 'Status não encontrado' };
      }
      console.error('Erro ao buscar status:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar status' };
    }
  };

  // Define ou atualiza o status de leitura
  const definirStatus = async (livroId, usuarioId, nomeStatus) => {
    try {
      // Verifica se o status já existe
      const statusExistente = await buscarStatus(livroId, usuarioId);

      if (statusExistente.sucesso) {
        // Atualiza o status existente
        const status = await $pb.collection('status').update(statusExistente.dados.id, {
          nome: nomeStatus
        });
        
        // Ganhar XP se marcar como "Lido"
        if (nomeStatus === 'Lido') {
          await ganharXPLivroLido(usuarioId);
        }
        
        return { sucesso: true, dados: status, atualizado: true };
      } else {
        // Cria um novo status
        const status = await $pb.collection('status').create({
          nome: nomeStatus,
          usuario: usuarioId,
          livro: livroId
        });
        
        // Ganhar XP se marcar como "Lido"
        if (nomeStatus === 'Lido') {
          await ganharXPLivroLido(usuarioId);
        }
        
        return { sucesso: true, dados: status, atualizado: false };
      }
    } catch (error) {
      console.error('Erro ao definir status:', error);
      return { sucesso: false, erro: error.message || 'Erro ao definir status' };
    }
  };

  // Remove o status de leitura
  const removerStatus = async (statusId) => {
    try {
      await $pb.collection('status').delete(statusId);
      return { sucesso: true };
    } catch (error) {
      console.error('Erro ao remover status:', error);
      return { sucesso: false, erro: error.message || 'Erro ao remover status' };
    }
  };

  // Busca todos os livros com um determinado status para um usuário
  const buscarLivrosPorStatus = async (usuarioId, nomeStatus) => {
    try {
      const registros = await $pb.collection('status').getList(1, 50, {
        filter: `usuario = "${usuarioId}" && nome = "${nomeStatus}"`,
        expand: 'livro',
        sort: '-updated'
      });
      return { sucesso: true, dados: registros.items };
    } catch (error) {
      console.error('Erro ao buscar livros por status:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar livros' };
    }
  };

  // Busca estatísticas de leitura do usuário
  const buscarEstatisticasUsuario = async (usuarioId) => {
    try {
      const todosStatus = await $pb.collection('status').getList(1, 200, {
        filter: `usuario = "${usuarioId}"`
      });

      const estatisticas = {
        'Pretendo ler': 0,
        'Lendo': 0,
        'Lido': 0,
        'Abandonei': 0
      };

      todosStatus.items.forEach(status => {
        if (estatisticas[status.nome] !== undefined) {
          estatisticas[status.nome]++;
        }
      });

      return { sucesso: true, dados: estatisticas };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar estatísticas' };
    }
  };

  return {
    OPCOES_STATUS,
    buscarStatus,
    definirStatus,
    removerStatus,
    buscarLivrosPorStatus,
    buscarEstatisticasUsuario
  };
};
