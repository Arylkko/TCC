export const useLivros = () => {
  const { $pb } = useNuxtApp();
  const config = useRuntimeConfig();

  const cacheGoogleBooks = new Map();
  const CACHE_DURATION = 10 * 60 * 1000; 

 
  const limparCacheAntigo = () => {
    const agora = Date.now();
    for (const [isbn, cached] of cacheGoogleBooks.entries()) {
      if (agora - cached.timestamp > CACHE_DURATION) {
        cacheGoogleBooks.delete(isbn);
      }
    }
  };

  
  const buscarDadosLivroAPI = async (isbn) => {
    if (!isbn) {
      return { sucesso: false, erro: 'ISBN não fornecido' };
    }


    const isbnLimpo = isbn.toString().replace(/[-\s]/g, '');
    const isISBNValido = /^[0-9]{10}$|^[0-9]{13}$/.test(isbnLimpo);
    
    if (!isISBNValido) {
      console.warn(` ISBN inválido ignorado: ${isbn}`);
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

   
    const agora = Date.now();
    const cached = cacheGoogleBooks.get(isbn);
    
    if (cached && (agora - cached.timestamp) < CACHE_DURATION) {
      console.log(`Cache hit para ISBN: ${isbn}`);
      return cached.dados;
    }

    
    try {
      console.log(`Buscando na API Google Books: ${isbn}`);
      
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

       
        cacheGoogleBooks.set(isbn, {
          dados: resultado,
          timestamp: agora
        });

        
        if (cacheGoogleBooks.size % 20 === 0) {
          limparCacheAntigo();
        }

        return resultado;
      }
      
      
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
      
      
      const resultadoErro = { 
        sucesso: false, 
        erro: 'Erro ao conectar com a API' 
      };
      
      cacheGoogleBooks.set(isbn, {
        dados: resultadoErro,
        timestamp: agora - CACHE_DURATION + 60000 
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

 
  const limparCache = () => {
    cacheGoogleBooks.clear();
    console.log(' Cache do Google Books limpo');
  };


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