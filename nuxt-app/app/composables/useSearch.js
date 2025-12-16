export const useSearch = () => {
  const config = useRuntimeConfig();
  const apiKey = config.public.googleBooksApiKey;

  /**
   * Busca livro por ISBN na API do Google Books
   * @param {string} isbn - ISBN do livro
   * @returns {Promise<Object>} Resultado da busca
   */
  const buscarLivroPorISBN = async (isbn) => {
    if (!isbn || !isbn.trim()) {
      return { 
        sucesso: false, 
        erro: 'ISBN vazio' 
      };
    }

    try {
      const params = new URLSearchParams({
        q: `isbn:${isbn}`,
        key: apiKey,
        maxResults: '1'
      });

      const url = `https://www.googleapis.com/books/v1/volumes?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        return {
          sucesso: true,
          dados: data.items,
          totalItems: data.totalItems || 0
        };
      }

      return {
        sucesso: false,
        erro: 'Livro não encontrado',
        dados: [],
        totalItems: 0
      };
    } catch (error) {
      console.error('Erro ao buscar livro por ISBN:', error);
      return {
        sucesso: false,
        erro: 'Erro ao conectar com a API do Google Books',
        dados: [],
        totalItems: 0
      };
    }
  };

  /**
   * Busca livros na API do Google Books com filtros otimizados
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
      // Melhora a busca usando intitle para priorizar títulos
      // e adiciona filtros para português e apenas livros
      const termoBusca = `intitle:${searchTerm}`;
      
      const params = new URLSearchParams({
        q: termoBusca,
        startIndex: startIndex.toString(),
        maxResults: maxResults.toString(),
        key: apiKey,
        langRestrict: 'pt', // Apenas livros em português
        printType: 'books', // Apenas livros (exclui revistas, etc)
        orderBy: 'relevance' // Ordena por relevância
      });

      const url = `https://www.googleapis.com/books/v1/volumes?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.items && Array.isArray(data.items)) {
        // Filtra ainda mais para garantir apenas livros válidos
        const livrosFiltrados = data.items.filter(item => {
          const volume = item?.volumeInfo;
          if (!volume) return false;
          
          // Remove itens sem título ou ISBN
          const temTitulo = !!volume.title;
          const temISBN = !!(volume.industryIdentifiers?.length);
          
          // Remove revistas e periódicos que podem passar pelo filtro
          const tipoInvalido = volume.categories?.some(cat => 
            cat.toLowerCase().includes('magazine') || 
            cat.toLowerCase().includes('journal') ||
            cat.toLowerCase().includes('revista')
          );
          
          return temTitulo && temISBN && !tipoInvalido;
        });

        return {
          sucesso: true,
          dados: livrosFiltrados,
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
   * Busca avançada com múltiplos critérios
   * Útil para buscas mais específicas
   */
  const buscarLivrosAvancado = async (opcoes = {}) => {
    const {
      titulo = '',
      autor = '',
      isbn = '',
      categoria = '',
      startIndex = 0,
      maxResults = 20
    } = opcoes;

    let termoBusca = '';
    
    if (titulo) termoBusca += `intitle:${titulo}`;
    if (autor) termoBusca += ` inauthor:${autor}`;
    if (isbn) termoBusca += ` isbn:${isbn}`;
    if (categoria) termoBusca += ` subject:${categoria}`;

    if (!termoBusca.trim()) {
      return {
        sucesso: false,
        erro: 'Nenhum critério de busca fornecido'
      };
    }

    const params = new URLSearchParams({
      q: termoBusca.trim(),
      startIndex: startIndex.toString(),
      maxResults: maxResults.toString(),
      key: config.public.googleBooksApiKey,
      langRestrict: 'pt',
      printType: 'books',
      orderBy: 'relevance'
    });

    try {
      const url = `https://www.googleapis.com/books/v1/volumes?${params.toString()}`;
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
      console.error('Erro na busca avançada:', error);
      return {
        sucesso: false,
        erro: 'Erro ao conectar com a API',
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
    // Prioriza ISBN_13, depois ISBN_10
    const isbn13 = identifiers.find(i => i.type === 'ISBN_13');
    if (isbn13) return isbn13.identifier;
    
    const isbn10 = identifiers.find(i => i.type === 'ISBN_10');
    if (isbn10) return isbn10.identifier;
    
    // Fallback para qualquer identificador disponível
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
      isbn: extrairISBN(item),
      idioma: volume.language || 'pt',
      categorias: volume.categories || []
    };
  };

  return {
    buscarLivros,
    buscarLivroPorISBN,
    buscarLivrosAvancado,
    extrairISBN,
    prepararDadosLivro,
    formatarInfoLivro
  };
};  