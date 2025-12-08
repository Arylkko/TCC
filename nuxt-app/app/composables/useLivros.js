export const useLivros = () => {
  const { $pb } = useNuxtApp();
  const config = useRuntimeConfig();

  // Busca informações do livro na API do Google Books usando ISBN
  const buscarDadosLivroAPI = async (isbn) => {
    try {
      const apiKey = config.public.googleBooksApiKey;
      const url = apiKey 
        ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`
        : `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
      
      const response = await fetch(url);
      const data = await response.json();
        if (data.items && data.items.length > 0) {
        const livro = data.items[0].volumeInfo;
        return {
          sucesso: true,
          dados: {
            autor: livro.authors ? livro.authors.join(', ') : 'Autor não informado',
            capa: livro.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
            titulo: livro.title || '',
            descricao: livro.description || '',
            editora: livro.publisher || '',
            dataPublicacao: livro.publishedDate || '',
            paginas: livro.pageCount || 0,
            genero: livro.categories || null  // Adicionar categories como genero
          }
        };
      }
      
      return { sucesso: false, erro: 'Livro não encontrado na API' };
    } catch (error) {
      console.error('Erro ao buscar dados do livro na API:', error);
      return { sucesso: false, erro: 'Erro ao conectar com a API' };
    }
  };

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
        // Se já existe, retorna o livro existente como sucesso
        return { sucesso: true, dados: existente.dados, jaExistia: true };
      }

      const livro = await $pb.collection('livro').create(dadosLivro);
      return { sucesso: true, dados: livro, jaExistia: false };
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
    buscarTodosLivros,
    buscarDadosLivroAPI
  };
};
