// Composable para gerenciar reviews/notas de livros
export const useNotas = () => {
  const { $pb } = useNuxtApp();

  // Busca todas as notas de um livro
  const buscarNotasLivro = async (livroId) => {
    try {
      const notas = await $pb.collection('notas').getList(1, 50, {
        filter: `livro = "${livroId}"`,
        expand: 'autor',
        sort: '-created'
      });
      return { sucesso: true, dados: notas.items };
    } catch (error) {
      console.error('Erro ao buscar notas:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar notas' };
    }
  };

  // Cria uma nova nota/review
  const criarNota = async (dadosNota) => {
    try {
      const nota = await $pb.collection('notas').create(dadosNota);
      return { sucesso: true, dados: nota };
    } catch (error) {
      console.error('Erro ao criar nota:', error);
      return { sucesso: false, erro: error.message || 'Erro ao criar nota' };
    }
  };

  // Atualiza uma nota existente
  const atualizarNota = async (notaId, dadosNota) => {
    try {
      const nota = await $pb.collection('notas').update(notaId, dadosNota);
      return { sucesso: true, dados: nota };
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      return { sucesso: false, erro: error.message || 'Erro ao atualizar nota' };
    }
  };

  // Deleta uma nota
  const deletarNota = async (notaId) => {
    try {
      await $pb.collection('notas').delete(notaId);
      return { sucesso: true };
    } catch (error) {
      console.error('Erro ao deletar nota:', error);
      return { sucesso: false, erro: error.message || 'Erro ao deletar nota' };
    }
  };

  // Busca nota de um usuário específico para um livro
  const buscarNotaUsuario = async (livroId, usuarioId) => {
    try {
      const nota = await $pb.collection('notas').getFirstListItem(
        `livro = "${livroId}" && autor = "${usuarioId}"`
      );
      return { sucesso: true, dados: nota };
    } catch (error) {
      if (error.status === 404) {
        return { sucesso: false, erro: 'Nota não encontrada' };
      }
      console.error('Erro ao buscar nota do usuário:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar nota' };
    }
  };

  // Calcula e atualiza a média de avaliações do livro
  const atualizarMediaAvaliacoes = async (livroId) => {
    try {
      const notas = await buscarNotasLivro(livroId);
      if (!notas.sucesso || notas.dados.length === 0) {
        return { sucesso: true, media: 0, total: 0 };
      }

      const soma = notas.dados.reduce((acc, nota) => acc + nota.avaliacao, 0);
      const media = soma / notas.dados.length;
      const total = notas.dados.length;

      // Atualiza o livro com a nova média
      await $pb.collection('livro').update(livroId, {
        AvaliacaoMedia: media,
        TotalAvaliacoes: total
      });

      return { sucesso: true, media, total };
    } catch (error) {
      console.error('Erro ao atualizar média de avaliações:', error);
      return { sucesso: false, erro: error.message || 'Erro ao atualizar média' };
    }
  };

  return {
    buscarNotasLivro,
    criarNota,
    atualizarNota,
    deletarNota,
    buscarNotaUsuario,
    atualizarMediaAvaliacoes
  };
};
