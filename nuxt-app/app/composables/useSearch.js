export const useSearch = () => {
  const config = useRuntimeConfig();
  const apiKey = config.public.googleBooksApiKey;

  /**
   * Busca livros na API do Google Books
   * @param {string} searchTerm - Termo de busca
   * @param {number} startIndex - Índice inicial para paginação
   * @param {number} maxResults - Quantidade máxima de resultados
   * @returns {Promise<Object>} Resultado da busca
   */
  const buscarLivros = async (searchTerm, startIndex = 0, maxResults = 20) => {
    if (!searchTerm || !searchTerm.trim()) {
      return { 
        sucesso: false, 
        erro: 'Termo de busca vazio' 
      };
    }

    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&startIndex=${startIndex}&maxResults=${maxResults}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.items && Array.isArray(data.items)) {
        return {
          sucesso: true,
          dados: data.items,
          totalItems: data.totalItems || 0
        };
      }

      return {
        sucesso: false,
        erro: 'Nenhum livro encontrado',
        dados: [],
        totalItems: 0
      };
    } catch (error) {
      console.error('Erro ao buscar livros:', error);
      return {
        sucesso: false,
        erro: 'Erro ao conectar com a API do Google Books',
        dados: [],
        totalItems: 0
      };
    }
  };

  /**
   * Extrai ISBN de um item da API do Google Books
   * @param {Object} item - Item retornado da API
   * @returns {string} ISBN ou string vazia
   */
  const extrairISBN = (item) => {
    if (!item?.volumeInfo?.industryIdentifiers) {
      return '';
    }

    const identifiers = item.volumeInfo.industryIdentifiers;
    const isbnObj = identifiers.find(i => i.type && i.identifier);
    return isbnObj ? isbnObj.identifier : '';
  };

  /**
   * Prepara dados do livro para salvar no banco
   * @param {Object} item - Item da API do Google Books
   * @returns {Object|null} Dados formatados ou null se inválido
   */
  const prepararDadosLivro = (item) => {
    const volume = item?.volumeInfo;
    if (!volume) return null;

    const nome = volume.title;
    const isbn = extrairISBN(item);

    if (!nome || !isbn) {
      console.warn('Livro sem nome ou ISBN:', { nome, isbn });
      return null;
    }

    return {
      Nome: nome,
      ISBN: isbn
    };
  };

  /**
   * Formata informações do livro para exibição
   * @param {Object} item - Item da API do Google Books
   * @returns {Object} Informações formatadas
   */
  const formatarInfoLivro = (item) => {
    const volume = item?.volumeInfo || {};
    
    return {
      id: item.id,
      titulo: volume.title || 'Título não disponível',
      autores: volume.authors || [],
      autor: volume.authors ? volume.authors[0] : 'Autor não informado',
      temMaisAutores: volume.authors && volume.authors.length > 1,
      capa: volume.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
      temCapa: !!volume.imageLinks?.thumbnail,
      descricao: volume.description || '',
      editora: volume.publisher || '',
      dataPublicacao: volume.publishedDate || '',
      isbn: extrairISBN(item)
    };
  };

  return {
    buscarLivros,
    extrairISBN,
    prepararDadosLivro,
    formatarInfoLivro
  };
};
