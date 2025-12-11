export const useListas = () => {
  const { $pb } = useNuxtApp();
  const { ganharXPCriarLista } = useXP();

  
  const criarLista = async (dadosLista) => {
    try {
      const lista = await $pb.collection('listas').create(dadosLista);
      
      // Ganhar XP por criar lista
      if (dadosLista.autor) {
        await ganharXPCriarLista(dadosLista.autor);
      }
      
      return { sucesso: true, dados: lista };
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      return { sucesso: false, erro: error.message || 'Erro ao criar lista' };
    }
  };


  const buscarListasUsuario = async (usuarioId) => {
    try {
      const listas = await $pb.collection('listas').getList(1, 50, {
        filter: `autor = "${usuarioId}"`,
        sort: '-created'
      });
      return { sucesso: true, dados: listas.items };
    } catch (error) {
      console.error('Erro ao buscar listas:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar listas' };
    }
  };

  
  const buscarListaPorId = async (listaId) => {
    try {
      const lista = await $pb.collection('listas').getOne(listaId);
      return { sucesso: true, dados: lista };
    } catch (error) {
      console.error('Erro ao buscar lista:', error);
      return { sucesso: false, erro: error.message || 'Lista não encontrada' };
    }
  };

  
  const atualizarLista = async (listaId, dadosAtualizados) => {
    try {
      const lista = await $pb.collection('listas').update(listaId, dadosAtualizados);
      return { sucesso: true, dados: lista };
    } catch (error) {
      console.error('Erro ao atualizar lista:', error);
      return { sucesso: false, erro: error.message || 'Erro ao atualizar lista' };
    }
  };

  
  const deletarLista = async (listaId) => {
    try {
      await $pb.collection('listas').delete(listaId);
      return { sucesso: true };
    } catch (error) {
      console.error('Erro ao deletar lista:', error);
      return { sucesso: false, erro: error.message || 'Erro ao deletar lista' };
    }
  };

 
  const adicionarLivroNaLista = async (listaId, livroId) => {
    try {
    
      const listaAtual = await $pb.collection('listas').getOne(listaId);
      
      
      const livrosAtuais = listaAtual.livros || [];
      if (livrosAtuais.includes(livroId)) {
        return { sucesso: false, erro: 'Livro já está na lista' };
      }

      // Adiciona o novo livro
      const novosLivros = [...livrosAtuais, livroId];
      
      const listaAtualizada = await $pb.collection('listas').update(listaId, {
        livros: novosLivros
      });
      
      return { sucesso: true, dados: listaAtualizada };
    } catch (error) {
      console.error('Erro ao adicionar livro na lista:', error);
      return { sucesso: false, erro: error.message || 'Erro ao adicionar livro na lista' };
    }
  };

   const removerLivroDaLista = async (listaId, livroId) => {
    try {
     
      const listaAtual = await $pb.collection('listas').getOne(listaId);
      
      
      const livrosAtuais = listaAtual.livros || [];
      const novosLivros = livrosAtuais.filter(id => id !== livroId);
      
      const listaAtualizada = await $pb.collection('listas').update(listaId, {
        livros: novosLivros
      });
      
      return { sucesso: true, dados: listaAtualizada };
    } catch (error) {
      console.error('Erro ao remover livro da lista:', error);
      return { sucesso: false, erro: error.message || 'Erro ao remover livro da lista' };
    }
  };

  // Buscar listas (busca geral com filtro por nome/descrição)
  const buscarListas = async (termoBusca = '') => {
    try {
      let filter = '';
      
      if (termoBusca) {
        // Busca por nome, descrição ou autor
        filter = `nome ~ "${termoBusca}" || descricao ~ "${termoBusca}" || autor.name ~ "${termoBusca}"`;
      }

      const listas = await $pb.collection('listas').getList(1, 100, {
        filter,
        expand: 'autor,livros',
        sort: '-created'
      });

      return { sucesso: true, dados: listas.items };
    } catch (error) {
      console.error('Erro ao buscar listas:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar listas' };
    }
  };

  return {
    criarLista,
    buscarListasUsuario,
    buscarListaPorId,
    atualizarLista,
    deletarLista,
    adicionarLivroNaLista,
    removerLivroDaLista,
    buscarListas
  };
};
