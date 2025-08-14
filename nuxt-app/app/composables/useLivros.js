
export const useLivros = () => {
  const { $pb } = useNuxtApp();


  const buscarLivroPorISBN = async (isbn) => {
    try {
      const livro = await $pb.collection('livro').getFirstListItem(`ISBN = "${isbn}"`);
      return { sucesso: true, dados: livro };
    } catch (error) {
      if (error.status === 404) {
        return { sucesso: false, erro: 'Livro não encontrado' };
      }
      console.error('Erro ao buscar livro:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar livro' };
    }
  };

 
  const salvarLivro = async (dadosLivro) => {
    try {
     
      const existente = await buscarLivroPorISBN(dadosLivro.ISBN);
      
      if (existente.sucesso) {
        return { sucesso: false, erro: 'Livro já existe no banco de dados', dados: existente.dados };
      }

      const livro = await $pb.collection('livro').create(dadosLivro);
      return { sucesso: true, dados: livro };
    } catch (error) {
      console.error('Erro ao salvar livro:', error);
      return { sucesso: false, erro: error.message || 'Erro ao salvar livro' };
    }
  };


  const buscarTodosLivros = async () => {
    try {
      const livros = await $pb.collection('livro').getList(1, 50, {
        sort: '-created'
      });
      return { sucesso: true, dados: livros.items };
    } catch (error) {
      console.error('Erro ao buscar livros:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar livros' };
    }
  };

  return {
    buscarLivroPorISBN,
    salvarLivro,
    buscarTodosLivros
  };
};
