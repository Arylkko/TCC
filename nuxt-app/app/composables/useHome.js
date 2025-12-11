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

  // ✨ NOVA FUNÇÃO: Buscar último livro lido com nota > 4
  const buscarUltimoLivroComNotaAlta = async (userId) => {
    try {
      console.log('🔍 Buscando último livro com nota > 4...');
      console.log('👤 User ID:', userId);
      
      try {
        // Buscar todas as notas do usuário (campo 'autor' não 'usuario')
        const todasNotas = await $pb.collection('notas').getList(1, 200, {
          filter: `autor = "${userId}"`,
          sort: '-created',
          $autoCancel: false
        });
        
        console.log(`📝 Total de notas do usuário: ${todasNotas.items.length}`);
        
        // Filtrar manualmente por avaliação > 4
        const notasAltas = todasNotas.items.filter(nota => {
          const avaliacao = nota.avaliacao || 0;
          return avaliacao > 4;
        });
        
        console.log(`📝 Notas com avaliação > 4: ${notasAltas.length}`);

        if (notasAltas.length === 0) {
          console.log('⚠️ Nenhuma nota > 4 encontrada');
          return { sucesso: true, dados: null };
        }

        // Pegar a nota mais recente
        const notaMaisRecente = notasAltas[0];
        console.log('🎯 Nota mais recente:', notaMaisRecente);

        // Buscar o livro manualmente
        const livroId = notaMaisRecente.livro;
        
        if (!livroId) {
          console.log('⚠️ ID do livro não encontrado na nota');
          return { sucesso: true, dados: null };
        }

        console.log('📖 Buscando livro:', livroId);
        const livro = await $pb.collection('livro').getOne(livroId);

        if (!livro) {
          console.log('⚠️ Livro não encontrado');
          return { sucesso: true, dados: null };
        }

        console.log('📚 Livro encontrado:', livro.Nome);

        // Buscar dados da API do livro
        const dadosAPI = await buscarComCache(livro.ISBN);

        if (!dadosAPI.sucesso || !dadosAPI.dados.genero) {
          console.log('⚠️ Não foi possível obter gênero do livro');
          return { sucesso: true, dados: null };
        }

        const livroComDados = {
          id: livro.id,
          isbn: livro.ISBN,
          nome: livro.Nome,
          autor: dadosAPI.dados.autor || livro.Autor,
          capa: dadosAPI.dados.capa,
          genero: dadosAPI.dados.genero,
          nota: notaMaisRecente.avaliacao
        };

        console.log('✅ Último livro com nota alta:', livroComDados);
        return { sucesso: true, dados: livroComDados };
        
      } catch (dbError) {
        console.error('❌ Erro ao buscar notas:', dbError);
        console.error('❌ Detalhes:', dbError.data);
        
        // Se falhar, retornar sucesso mas sem dados (não quebra a página)
        return { sucesso: true, dados: null };
      }

    } catch (error) {
      console.error('❌ Erro geral ao buscar último livro com nota alta:', error);
      return { sucesso: true, dados: null }; // Não quebra a página
    }
  };

  // ✨ NOVA FUNÇÃO: Buscar recomendações baseadas em livro específico
  const buscarRecomendacoesPorLivro = async (userId) => {
    try {
      console.log('🎯 Iniciando busca de recomendações por livro...');

      // 1. Buscar o último livro com nota > 4
      const resultadoLivro = await buscarUltimoLivroComNotaAlta(userId);
      
      if (!resultadoLivro.sucesso || !resultadoLivro.dados) {
        console.log('⚠️ Nenhum livro com nota > 4 encontrado');
        return { sucesso: true, dados: [], livroReferencia: null };
      }

      const livroReferencia = resultadoLivro.dados;
      console.log('📚 Livro de referência:', livroReferencia.nome);

      // 2. Extrair gênero principal
      const generosPrincipais = Array.isArray(livroReferencia.genero) 
        ? livroReferencia.genero 
        : [livroReferencia.genero];
      
      const generoPrincipal = generosPrincipais[0];
      console.log('🏷️ Gênero principal:', generoPrincipal);

      // 3. Buscar todos os livros e status do usuário em paralelo
      const [todosLivros, statusUsuario] = await Promise.all([
        $pb.collection('livro').getList(1, 50, { 
          sort: '-created',
          $autoCancel: false 
        }),
        $pb.collection('status').getList(1, 200, {
          filter: `usuario = "${userId}"`,
          fields: 'livro',
          $autoCancel: false
        })
      ]);

      // IDs dos livros que o usuário já tem
      const livrosUsuario = new Set(statusUsuario.items.map(s => s.livro));
      
      // Remover também o livro de referência
      livrosUsuario.add(livroReferencia.id);

      // 4. Filtrar livros que o usuário não tem
      const livrosParaVerificar = todosLivros.items
        .filter(livro => !livrosUsuario.has(livro.id));

      console.log(`🔍 Verificando ${livrosParaVerificar.length} livros...`);

      // 5. Buscar dados da API para todos os livros
      const livrosComDadosAPI = await Promise.all(
        livrosParaVerificar.map(async (livro) => {
          const dadosAPI = await buscarComCache(livro.ISBN);
          return {
            livro,
            dadosAPI
          };
        })
      );

      // 6. Filtrar livros do mesmo gênero e com boa avaliação do Google
      const recomendacoes = [];
      
      for (const { livro, dadosAPI } of livrosComDadosAPI) {
        if (!dadosAPI.sucesso || !dadosAPI.dados.genero) continue;

        const generosLivro = Array.isArray(dadosAPI.dados.genero) 
          ? dadosAPI.dados.genero 
          : [dadosAPI.dados.genero];

        // Verificar se tem o mesmo gênero
        const temGeneroComum = generosLivro.some(g => 
          g.toLowerCase() === generoPrincipal.toLowerCase()
        );

        if (temGeneroComum) {
          // Pegar a avaliação do Google (normalmente vem como averageRating)
          const avaliacaoGoogle = dadosAPI.dados.avaliacaoGoogle || 
                                   dadosAPI.dados.averageRating || 
                                   0;

          recomendacoes.push({
            id: livro.id,
            isbn: livro.ISBN,
            nome: livro.Nome,
            autor: dadosAPI.dados.autor,
            capa: dadosAPI.dados.capa,
            genero: dadosAPI.dados.genero,
            avaliacaoGoogle: avaliacaoGoogle
          });
        }

        // Parar se já encontrou pelo menos 6 candidatos
        if (recomendacoes.length >= 6) break;
      }

      // 7. Ordenar por avaliação do Google e pegar top 3
      const top3Recomendacoes = recomendacoes
        .sort((a, b) => b.avaliacaoGoogle - a.avaliacaoGoogle)
        .slice(0, 3);

      console.log(`✅ ${top3Recomendacoes.length} recomendações encontradas`);
      console.log('📊 Recomendações:', top3Recomendacoes.map(r => 
        `${r.nome} (${r.avaliacaoGoogle}⭐)`
      ));

      return { 
        sucesso: true, 
        dados: top3Recomendacoes,
        livroReferencia: livroReferencia
      };

    } catch (error) {
      console.error('Erro ao buscar recomendações por livro:', error);
      return { 
        sucesso: false, 
        erro: error.message, 
        dados: [],
        livroReferencia: null
      };
    }
  };

  // Buscar livros mais bem avaliados (populares)
  const buscarLivrosPopulares = async () => {
    try {
      console.log('🔍 INICIANDO buscarLivrosPopulares');
      
      const todasNotas = await $pb.collection('notas').getList(1, 200, {
        expand: 'livro',
        $autoCancel: false
      });

      console.log('📝 Notas encontradas:', todasNotas.items.length);

      const avaliacoesPorLivro = {};
      
      todasNotas.items.forEach(nota => {
        const livroId = nota.livro;
        if (!livroId) return;
        
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

      const livrosComDados = await Promise.all(
        topLivrosIds.map(async (item) => {
          try {
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
      
      return { sucesso: true, dados: livrosValidos };
      
    } catch (error) {
      console.error('❌ ERRO GERAL em buscarLivrosPopulares:', error);
      return { sucesso: false, erro: error.message, dados: [] };
    }
  };

  // Buscar listas mais populares
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

  // Buscar comunidades mais populares
  const buscarComunidadesPopulares = async () => {
    try {
      console.log('👥 Buscando comunidades populares...');
      
      const comunidades = await $pb.collection('comunidade').getList(1, 50, {
        expand: 'lider',
        sort: '-created',
        $autoCancel: false
      });

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
    buscarRecomendacoesPorLivro, // ✨ Nova função principal
    buscarLivrosPopulares,
    buscarListasRecentes,
    buscarComunidadesPopulares
  };
};