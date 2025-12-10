export const useLivros = () => {
  const { $pb } = useNuxtApp();
  const config = useRuntimeConfig();

  // ✅ CACHE GLOBAL para evitar requisições duplicadas à API do Google Books
  const cacheGoogleBooks = new Map();
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos (mais tempo que useHome)

  // Limpar cache antigo periodicamente
  const limparCacheAntigo = () => {
    const agora = Date.now();
    for (const [isbn, cached] of cacheGoogleBooks.entries()) {
      if (agora - cached.timestamp > CACHE_DURATION) {
        cacheGoogleBooks.delete(isbn);
      }
    }
  };

  // Busca informações do livro na API do Google Books usando ISBN
  const buscarDadosLivroAPI = async (isbn) => {
    if (!isbn) {
      return { sucesso: false, erro: 'ISBN não fornecido' };
    }

    // ✅ VALIDAÇÃO: Verificar se é um ISBN válido (apenas números e 10 ou 13 dígitos)
    const isbnLimpo = isbn.toString().replace(/[-\s]/g, '');
    const isISBNValido = /^[0-9]{10}$|^[0-9]{13}$/.test(isbnLimpo);
    
    if (!isISBNValido) {
      console.warn(`⚠️ ISBN inválido ignorado: ${isbn}`);
      return { 
        sucesso: false, 
        erro: 'ISBN inválido',
        dados: {
          autor: 'Autor não informado',
          capa: '',
          titulo: '',
          descricao: '',
          editora: '',
          dataPublicacao: '',
          paginas: 0,
          genero: null
        }
      };
    }

    // ✅ VERIFICAR CACHE PRIMEIRO
    const agora = Date.now();
    const cached = cacheGoogleBooks.get(isbn);
    
    if (cached && (agora - cached.timestamp) < CACHE_DURATION) {
      console.log(`📦 Cache hit para ISBN: ${isbn}`);
      return cached.dados;
    }

    // ✅ BUSCAR NA API SE NÃO ESTIVER NO CACHE
    try {
      console.log(`🌐 Buscando na API Google Books: ${isbn}`);
      
      const apiKey = config.public.googleBooksApiKey;
      const url = apiKey 
        ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbnLimpo}&key=${apiKey}`
        : `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbnLimpo}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API retornou status ${response.status}`);
      }
      
      const data = await response.json();
        
      if (data.items && data.items.length > 0) {
        const livro = data.items[0].volumeInfo;
        
        const resultado = {
          sucesso: true,
          dados: {
            autor: livro.authors ? livro.authors.join(', ') : 'Autor não informado',
            capa: livro.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
            titulo: livro.title || '',
            descricao: livro.description || '',
            editora: livro.publisher || '',
            dataPublicacao: livro.publishedDate || '',
            paginas: livro.pageCount || 0,
            genero: livro.categories || null
          }
        };

        // ✅ SALVAR NO CACHE
        cacheGoogleBooks.set(isbn, {
          dados: resultado,
          timestamp: agora
        });

        // Limpar cache antigo a cada 20 requisições
        if (cacheGoogleBooks.size % 20 === 0) {
          limparCacheAntigo();
        }

        return resultado;
      }
      
      // Se não encontrou, também cachear a resposta negativa
      const resultadoNaoEncontrado = { 
        sucesso: false, 
        erro: 'Livro não encontrado na API' 
      };
      
      cacheGoogleBooks.set(isbn, {
        dados: resultadoNaoEncontrado,
        timestamp: agora
      });
      
      return resultadoNaoEncontrado;
      
    } catch (error) {
      console.error('Erro ao buscar dados do livro na API:', error);
      
      // ✅ CACHEAR ERRO TEMPORARIAMENTE (1 minuto apenas)
      const resultadoErro = { 
        sucesso: false, 
        erro: 'Erro ao conectar com a API' 
      };
      
      cacheGoogleBooks.set(isbn, {
        dados: resultadoErro,
        timestamp: agora - CACHE_DURATION + 60000 // Expira em 1 minuto
      });
      
      return resultadoErro;
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

  // ✅ FUNÇÃO PARA LIMPAR CACHE MANUALMENTE (útil para debugging)
  const limparCache = () => {
    cacheGoogleBooks.clear();
    console.log('🗑️ Cache do Google Books limpo');
  };

  // ✅ FUNÇÃO PARA VER ESTATÍSTICAS DO CACHE
  const estatisticasCache = () => {
    return {
      totalItens: cacheGoogleBooks.size,
      itens: Array.from(cacheGoogleBooks.keys())
    };
  };

  return {
    buscarLivroPorISBN,
    salvarLivro,
    buscarTodosLivros,
    buscarDadosLivroAPI,
    limparCache,
    estatisticasCache
  };
};