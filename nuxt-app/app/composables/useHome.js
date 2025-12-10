export const useHome = () => {
  const { $pb } = useNuxtApp();
  const { buscarDadosLivroAPI } = useLivros();

  // Cache simples para evitar requisições duplicadas
  const cacheAPI = new Map();
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Wrapper com cache para buscarDadosLivroAPI
  const buscarComCache = async (isbn) => {
    const agora = Date.now();
    const cached = cacheAPI.get(isbn);
    
    if (cached && (agora - cached.timestamp) < CACHE_DURATION) {
      return cached.dados;
    }

    const dados = await buscarDadosLivroAPI(isbn);
    cacheAPI.set(isbn, { dados, timestamp: agora });
    return dados;
  };

  // Buscar livros que o usuário está lendo atualmente
  const buscarLivrosLendo = async (userId) => {
    try {
      console.log('🔍 Buscando livros lendo para usuário:', userId);
      const statusLendo = await $pb.collection('status').getList(1, 3, {
        filter: `usuario = "${userId}" && nome = "Lendo"`,
        expand: 'livro',
        sort: '-created',
        $autoCancel: false
      });

      console.log('📚 Status lendo encontrados:', statusLendo.items.length);

      // ✅ OTIMIZAÇÃO: Promise.all ao invés de loop com await
      const livrosComDados = await Promise.all(
        statusLendo.items.map(async (item) => {
          const livro = item.expand?.livro;
          if (!livro) return null;

          const dadosAPI = await buscarComCache(livro.ISBN);
          
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
      console.log('🎨 Buscando gêneros do usuário:', userId);
      const statusLidos = await $pb.collection('status').getList(1, 50, {
        filter: `usuario = "${userId}" && (nome = "Lido" || nome = "Lendo")`,
        expand: 'livro',
        $autoCancel: false
      });

      console.log('📚 Livros lidos/lendo encontrados:', statusLidos.items.length);

      // ✅ OTIMIZAÇÃO: Buscar todos os ISBNs em paralelo
      const livrosComISBN = statusLidos.items
        .map(item => item.expand?.livro)
        .filter(livro => livro?.ISBN);

      const dadosAPIs = await Promise.all(
        livrosComISBN.map(livro => buscarComCache(livro.ISBN))
      );

      const generos = new Set();
      dadosAPIs.forEach(dadosAPI => {
        if (dadosAPI.sucesso && dadosAPI.dados.genero) {
          if (Array.isArray(dadosAPI.dados.genero)) {
            dadosAPI.dados.genero.forEach(g => generos.add(g));
          } else {
            generos.add(dadosAPI.dados.genero);
          }
        }
      });

      console.log('✅ Gêneros finais:', Array.from(generos));
      return Array.from(generos);
    } catch (error) {
      console.error('Erro ao buscar gêneros:', error);
      return [];
    }
  };

  // Buscar recomendações baseadas em gênero
  const buscarRecomendacoesPorGenero = async (userId) => {
    try {
      // 1. Buscar apenas gêneros primeiro (rápido)
      const generos = await buscarGenerosUsuario(userId);
    
      if (generos.length === 0) {
        return { sucesso: true, dados: [] };
      }

      // 2. Agora buscar livros e status em paralelo
      const [todosLivros, statusUsuario] = await Promise.all([
        $pb.collection('livro').getList(1, 30, { sort: '-created' }),
        $pb.collection('status').getList(1, 200, {
          filter: `usuario = "${userId}"`,
          fields: 'livro',
          $autoCancel: false
        })
      ]);

      const livrosUsuario = new Set(statusUsuario.items.map(s => s.livro));

      // 3. Filtrar livros que o usuário não tem
      const livrosParaVerificar = todosLivros.items
        .filter(livro => !livrosUsuario.has(livro.id))
        .slice(0, 6);

      console.log(`🔍 Verificando ${livrosParaVerificar.length} livros para recomendações...`);

      // ✅ OTIMIZAÇÃO: Buscar todos de uma vez
      const dadosAPIs = await Promise.all(
        livrosParaVerificar.map(livro => buscarComCache(livro.ISBN))
      );

      // 4. Montar recomendações
      const recomendacoes = [];
      
      for (let i = 0; i < livrosParaVerificar.length; i++) {
        const livro = livrosParaVerificar[i];
        const dadosAPI = dadosAPIs[i];
        
        if (dadosAPI.sucesso && dadosAPI.dados.genero) {
          const generosLivro = Array.isArray(dadosAPI.dados.genero) 
            ? dadosAPI.dados.genero 
            : [dadosAPI.dados.genero];

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

        // ⚡ Parar assim que encontrar 3
        if (recomendacoes.length >= 3) break;
      }

      console.log(`✅ ${recomendacoes.length} recomendações encontradas`);
      return { sucesso: true, dados: recomendacoes };
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error);
      return { sucesso: false, erro: error.message, dados: [] };
    }
  };

  // Buscar livros mais bem avaliados (populares)
  const buscarLivrosPopulares = async () => {
    try {
      console.log('🔍 INICIANDO buscarLivrosPopulares');
      
      // ✅ CORREÇÃO: Buscar TODAS as notas sem filtrar campos
      const todasNotas = await $pb.collection('notas').getList(1, 200, {
        expand: 'livro',
        $autoCancel: false
      });

      console.log('📝 Notas encontradas:', todasNotas.items.length);

      // Calcular médias por livro
      const avaliacoesPorLivro = {};
      
      todasNotas.items.forEach(nota => {
        const livroId = nota.livro;
        if (!livroId) return;
        
        // ✅ IMPORTANTE: Verificar se o livro foi expandido
        const livroExpandido = nota.expand?.livro;
        
        if (!avaliacoesPorLivro[livroId]) {
          avaliacoesPorLivro[livroId] = {
            livroId: livroId,
            livroExpandido: livroExpandido,
            soma: 0,
            count: 0
          };
        }
        avaliacoesPorLivro[livroId].soma += nota.avaliacao;
        avaliacoesPorLivro[livroId].count += 1;
      });

      console.log('📊 Livros com avaliações:', Object.keys(avaliacoesPorLivro).length);

      // Pegar os IDs dos top 10 livros
      const topLivrosIds = Object.values(avaliacoesPorLivro)
        .map(item => ({
          livroId: item.livroId,
          livroExpandido: item.livroExpandido,
          media: item.soma / item.count,
          totalAvaliacoes: item.count
        }))
        .filter(item => item.totalAvaliacoes >= 1)
        .sort((a, b) => b.media - a.media)
        .slice(0, 10);

      console.log('🏆 Top 10 livros:', topLivrosIds.length);

      // ✅ CORREÇÃO: Buscar os livros manualmente se não foram expandidos
      const livrosComDados = await Promise.all(
        topLivrosIds.map(async (item) => {
          try {
            // Se o livro foi expandido, usar ele, senão buscar manualmente
            let livro = item.livroExpandido;
            
            if (!livro) {
              console.log(`   🔍 Livro não expandido, buscando manualmente: ${item.livroId}`);
              livro = await $pb.collection('livro').getOne(item.livroId);
            }

            console.log(`   📖 Processando: ${livro.Nome} (${livro.ISBN})`);
            const dadosAPI = await buscarComCache(livro.ISBN);
            
            const livroFormatado = {
              id: livro.id,
              isbn: livro.ISBN,
              nome: livro.Nome,
              autor: dadosAPI.sucesso ? dadosAPI.dados.autor : livro.Autor,
              capa: dadosAPI.sucesso ? dadosAPI.dados.capa : null,
              media: item.media.toFixed(1),
              totalAvaliacoes: item.totalAvaliacoes
            };
            
            console.log(`   ✅ Dados obtidos:`, livroFormatado);
            return livroFormatado;
          } catch (error) {
            console.error(`   ❌ Erro ao processar livro:`, error);
            return null;
          }
        })
      );

      const livrosValidos = livrosComDados.filter(livro => livro !== null);

      console.log('✅ RESULTADO FINAL buscarLivrosPopulares:');
      console.log('   - Total válidos:', livrosValidos.length);
      console.log('   - Livros:', livrosValidos);
      
      return { sucesso: true, dados: livrosValidos };
      
    } catch (error) {
      console.error('❌ ERRO GERAL em buscarLivrosPopulares:', error);
      return { sucesso: false, erro: error.message, dados: [] };
    }
  };

  // Buscar listas mais populares (com mais livros)
  const buscarListasRecentes = async () => {
    try {
      const listasRecentes = await $pb.collection('listas').getList(1, 10, {
        expand: 'autor',
        sort: '-created',
        $autoCancel: false
      });

      console.log('📚 Listas encontradas:', listasRecentes.items.length);

      const dadosFormatados = listasRecentes.items.map(lista => ({
        id: lista.id,
        nome: lista.nome,
        descricao: lista.descricao,
        autor: lista.expand?.autor?.name || 'Usuário',
      }));

      return { sucesso: true, dados: dadosFormatados };
    } catch (error) {
      console.error('Erro ao buscar listas recentes:', error);
      return { sucesso: false, erro: error.message, dados: [] };
    }
  };

  // Buscar comunidades mais populares (com mais membros)
  const buscarComunidadesPopulares = async () => {
    try {
      console.log('👥 Buscando comunidades populares...');
      
      const comunidades = await $pb.collection('comunidade').getList(1, 50, {
        expand: 'lider',
        sort: '-created',
        $autoCancel: false
      });

      console.log('🏘️ Total de comunidades encontradas:', comunidades.items.length);

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
    buscarListasRecentes,
    buscarComunidadesPopulares
  };
};