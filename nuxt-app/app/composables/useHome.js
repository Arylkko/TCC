export const useHome = () => {
  const { $pb } = useNuxtApp();
  const { buscarDadosLivroAPI } = useLivros();  // Buscar livros que o usuário está lendo atualmente
  const buscarLivrosLendo = async (userId) => {
    try {
      console.log('🔍 Buscando livros lendo para usuário:', userId);
      const statusLendo = await $pb.collection('status').getList(1, 3, {
        filter: `usuario = "${userId}" && nome = "Lendo"`,
        expand: 'livro',
        sort: '-created',
        $autoCancel: false  // Evita auto-cancelamento
      });

      

      // Enriquecer com dados da API
      const livrosComDados = await Promise.all(
        statusLendo.items.map(async (item) => {
          const livro = item.expand?.livro;
          if (!livro) return null;

          const dadosAPI = await buscarDadosLivroAPI(livro.ISBN);
          
          return {
            id: livro.id,
            isbn: livro.ISBN,
            nome: livro.Nome,
            autor: dadosAPI.sucesso ? dadosAPI.dados.autor : livro.Autor,
            capa: dadosAPI.sucesso ? dadosAPI.dados.capa : null,
            genero: dadosAPI.sucesso ? dadosAPI.dados.genero : null
          };
        })
      );

      return { 
        sucesso: true, 
        dados: livrosComDados.filter(livro => livro !== null) 
      };
    } catch (error) {
      console.error('Erro ao buscar livros lendo:', error);
      return { sucesso: false, erro: error.message, dados: [] };
    }
  };
  // Buscar gêneros dos livros que o usuário já leu ou está lendo
  const buscarGenerosUsuario = async (userId) => {
    try {
      
      const statusLidos = await $pb.collection('status').getList(1, 50, {
        filter: `usuario = "${userId}" && (nome = "Lido" || nome = "Lendo")`,
        expand: 'livro',
        $autoCancel: false
      });

 

      const generos = new Set();      for (const item of statusLidos.items) {
        const livro = item.expand?.livro;
        if (!livro?.ISBN) {
       
          continue;
        }

       
        const dadosAPI = await buscarDadosLivroAPI(livro.ISBN);
       
        
        if (dadosAPI.sucesso && dadosAPI.dados.genero) {
          // Genero pode vir como array ou string
          if (Array.isArray(dadosAPI.dados.genero)) {
            dadosAPI.dados.genero.forEach(g => generos.add(g));
          } else {
            generos.add(dadosAPI.dados.genero);
          }
        } else {
     
        }
      }

    
      return Array.from(generos);
    } catch (error) {
      console.error('Erro ao buscar gêneros:', error);
      return [];
    }
  };
  // Buscar recomendações baseadas em gênero
  const buscarRecomendacoesPorGenero = async (userId) => {
    try {
     
      //  Buscar gêneros que o usuário gosta
      const generos = await buscarGenerosUsuario(userId);
      console.log('📖 Gêneros encontrados:', generos);
      if (generos.length === 0) {
        return { sucesso: true, dados: [] };
      }

      // Buscar todos os livros do sistema
      const todosLivros = await $pb.collection('livro').getList(1, 50, {
        sort: '-created'
      });      // Buscar livros que o usuário já tem (para não recomendar)
      const statusUsuario = await $pb.collection('status').getList(1, 200, {
        filter: `usuario = "${userId}"`,
        fields: 'livro',
        $autoCancel: false
      });

      const livrosUsuario = new Set(statusUsuario.items.map(s => s.livro));

      // Filtrar e enriquecer com dados da API
      const recomendacoes = [];
      
      for (const livro of todosLivros.items) {
        // Não recomendar livros que o usuário já tem
        if (livrosUsuario.has(livro.id)) continue;

        const dadosAPI = await buscarDadosLivroAPI(livro.ISBN);
        
        if (dadosAPI.sucesso && dadosAPI.dados.genero) {
          const generosLivro = Array.isArray(dadosAPI.dados.genero) 
            ? dadosAPI.dados.genero 
            : [dadosAPI.dados.genero];

          // Verifica se tem algum gênero em comum
          const temGeneroComum = generosLivro.some(g => generos.includes(g));

          if (temGeneroComum) {
            recomendacoes.push({
              id: livro.id,
              isbn: livro.ISBN,
              nome: livro.Nome,
              autor: dadosAPI.dados.autor,
              capa: dadosAPI.dados.capa,
              genero: dadosAPI.dados.genero
            });
          }
        }

        // Limitar a 3 recomendações
        if (recomendacoes.length >= 3) break;
      }

      return { sucesso: true, dados: recomendacoes };
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error);
      return { sucesso: false, erro: error.message, dados: [] };
    }
  };
  // Buscar livros mais bem avaliados (populares)
  const buscarLivrosPopulares = async () => {
    try {   
      // Buscar todas as notas
      const todasNotas = await $pb.collection('notas').getList(1, 500, {
        expand: 'livro',
        fields: 'livro,avaliacao',
        $autoCancel: false
      });

      
      // Agrupar por livro e calcular média
      const avaliacoesPorLivro = {};
      
      todasNotas.items.forEach(nota => {
        const livroId = nota.livro;
        if (!livroId) {
          console.log('Nota sem livroId:', nota);
          return;
        }
        
        if (!avaliacoesPorLivro[livroId]) {
          avaliacoesPorLivro[livroId] = {
            livro: nota.expand?.livro,
            avaliacoes: [],
            soma: 0,
            count: 0
          };
        }
        avaliacoesPorLivro[livroId].avaliacoes.push(nota.avaliacao);
        avaliacoesPorLivro[livroId].soma += nota.avaliacao;
        avaliacoesPorLivro[livroId].count += 1;
      });

      console.log('📚 Livros agrupados:', Object.keys(avaliacoesPorLivro).length);
      console.log('📖 Primeiro livro agrupado:', Object.values(avaliacoesPorLivro)[0]);

      // Calcular média e ordenar
      const livrosComMedia = Object.values(avaliacoesPorLivro)
        .map(item => ({
          livro: item.livro,
          media: item.soma / item.count,
          totalAvaliacoes: item.count
        }))
        .filter(item => item.livro && item.totalAvaliacoes >= 1) // Mínimo 1 avaliação
        .sort((a, b) => b.media - a.media)
        .slice(0, 3);

   

      // Enriquecer com dados da API
      const livrosPopulares = await Promise.all(
        livrosComMedia.map(async (item) => {
          const dadosAPI = await buscarDadosLivroAPI(item.livro.ISBN);
          
          return {
            id: item.livro.id,
            isbn: item.livro.ISBN,
            nome: item.livro.Nome,
            autor: dadosAPI.sucesso ? dadosAPI.dados.autor : item.livro.Autor,
            capa: dadosAPI.sucesso ? dadosAPI.dados.capa : null,
            media: item.media.toFixed(1),
            totalAvaliacoes: item.totalAvaliacoes
          };
        })
      );

      return { sucesso: true, dados: livrosPopulares };
    } catch (error) {
      console.error('Erro ao buscar livros populares:', error);
      return { sucesso: false, erro: error.message, dados: [] };
    }
  };
  // Buscar listas mais populares (com mais livros)
  const buscarListasPopulares = async () => {
    try {
   
      // Buscar todas as listas
      const todasListas = await $pb.collection('listas').getList(1, 50, {
        expand: 'autor',
        sort: '-created',
        $autoCancel: false
      });

     

      // Contar livros de cada lista (campo 'livros' é um array)
      const listasComContagem = todasListas.items.map(lista => ({
        id: lista.id,
        nome: lista.nome,
        descricao: lista.descricao,
        autor: lista.expand?.autor?.name || 'Usuário',
        totalLivros: lista.livros?.length || 0
      }));

      // Ordenar por total de livros e pegar top 3
      const listasPopulares = listasComContagem
        .filter(lista => lista.totalLivros > 0)
        .sort((a, b) => b.totalLivros - a.totalLivros)
        .slice(0, 3);

      console.log('📊 Listas ordenadas:', listasPopulares);

      return { sucesso: true, dados: listasPopulares };
    } catch (error) {
      console.error('Erro ao buscar listas populares:', error);
      return { sucesso: false, erro: error.message, dados: [] };
    }
  };
  // Buscar comunidades mais populares (com mais membros)
  const buscarComunidadesPopulares = async () => {
    try {
    
      const comunidades = await $pb.collection('comunidade').getList(1, 50, {
        expand: 'lider',
        sort: '-created',
        $autoCancel: false
      });

      

      // Ordenar por número de membros
      const comunidadesPopulares = comunidades.items
        .map(comunidade => ({
          id: comunidade.id,
          nome: comunidade.nome,
          descricao: comunidade.descricao,
          lider: comunidade.expand?.lider?.name || 'Líder',
          totalMembros: comunidade.membros?.length || 0,
          imagem: comunidade.imagem_comunidade 
            ? $pb.files.getURL(comunidade, comunidade.imagem_comunidade)
            : null
        }))
        .sort((a, b) => b.totalMembros - a.totalMembros)
        .slice(0, 3);

      return { sucesso: true, dados: comunidadesPopulares };
    } catch (error) {
      console.error('Erro ao buscar comunidades populares:', error);
      return { sucesso: false, erro: error.message, dados: [] };
    }
  };

  return {
    buscarLivrosLendo,
    buscarRecomendacoesPorGenero,
    buscarLivrosPopulares,
    buscarListasPopulares,
    buscarComunidadesPopulares
  };
};