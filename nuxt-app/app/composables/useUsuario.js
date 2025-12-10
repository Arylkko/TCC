export const useUsuario = () => {
  const { $pb } = useNuxtApp();

  // Buscar usuário por ID
  const buscarUsuarioPorId = async (userId) => {
    try {
      const usuario = await $pb.collection('users').getOne(userId);
      return { sucesso: true, dados: usuario };
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return { sucesso: false, erro: error.message };
    }
  };

  // Atualizar perfil do usuário
  const atualizarPerfil = async (userId, dados) => {
    try {
      // Se for apenas texto (Description com D maiúsculo), usa objeto simples
      if (dados.description !== undefined && !dados.avatar) {
        const usuarioAtualizado = await $pb.collection('users').update(userId, {
          Description: dados.description  // Campo é Description com D maiúsculo!
        });
        
        return { sucesso: true, dados: usuarioAtualizado };
      }
      
      // Se tiver arquivo (avatar), usa FormData
      const formData = new FormData();
      
      if (dados.description !== undefined) {
        formData.append('description', dados.description);
      }
      
      if (dados.avatar) {
        formData.append('avatar', dados.avatar);
      }
      
      if (dados.name) {
        formData.append('name', dados.name);
      }

      const usuarioAtualizado = await $pb.collection('users').update(userId, formData);
      
      return { sucesso: true, dados: usuarioAtualizado };
    } catch (error) {
      return { sucesso: false, erro: error.message };
    }
  };

  // Calcular nível baseado no XP (a cada 100 XP = 1 nível)
  const calcularNivel = (xp = 0) => {
    return Math.floor(xp / 100) + 1;
  };

  // Calcular XP necessário para o próximo nível
  const xpParaProximoNivel = (xp = 0) => {
    const nivelAtual = calcularNivel(xp);
    const xpProximoNivel = nivelAtual * 100;
    return xpProximoNivel - xp;
  };

  // Buscar conquistas do usuário
  const buscarConquistasUsuario = async (userId) => {
    try {
      // Busca relação usuario_conquista com expand para pegar dados da conquista
      const usuarioConquistas = await $pb.collection('usuario_conquista').getList(1, 50, {
        filter: `usuario = "${userId}"`,
        expand: 'conquista',
        sort: '-created'
      });

      const conquistasComDados = usuarioConquistas.items.map(item => ({
        id: item.id,
        nome: item.expand?.conquista?.nome || 'Conquista',
        icone: item.expand?.conquista?.icone || '🏆',
        descricao: item.expand?.conquista?.descricao || '',
        data: item.created
      }));

      return { sucesso: true, dados: conquistasComDados };
    } catch (error) {
      console.error('Erro ao buscar conquistas:', error);
      return { sucesso: false, erro: error.message, dados: [] };
    }
  };
  
  const buscarTotalLivrosLidos = async (userId) => {
    try {
      // Busca na collection 'status' onde nome = 'Lido'
      const statusLidos = await $pb.collection('status').getList(1, 1, {
        filter: `usuario = "${userId}" && nome = "Lido"`,
        fields: 'id',
        $autoCancel: false  // Evita auto-cancelamento
      });

      return { sucesso: true, total: statusLidos.totalItems || 0 };
    } catch (error) {
      console.error('Erro ao buscar total de livros lidos:', error);
      return { sucesso: false, total: 0 };
    }
  };

  // Buscar livros favoritos (avaliação >= 3)
  const buscarLivrosFavoritos = async (userId) => {
    try {
      const notas = await $pb.collection('notas').getList(1, 10, {
        filter: `autor = "${userId}" && avaliacao >= 3`,
        expand: 'livro',
        sort: '-avaliacao,-created'
      });

      return { sucesso: true, dados: notas.items };
    } catch (error) {
      console.error('Erro ao buscar livros favoritos:', error);
      return { sucesso: false, dados: [] };
    }
  };

  // Buscar listas do usuário
  const buscarListasUsuario = async (userId) => {
    try {
      const listas = await $pb.collection('listas').getList(1, 50, {
        filter: `autor = "${userId}"`,
        sort: '-created'
      });

      // Contagem de livros usando o campo 'livros' da lista
      const listasComContagem = listas.items.map((lista) => ({
        ...lista,
        totalLivros: lista.livros?.length || 0
      }));

      return { sucesso: true, dados: listasComContagem };
    } catch (error) {
      console.error('Erro ao buscar listas:', error);
      return { sucesso: false, dados: [] };
    }
  };

  // Buscar comunidades do usuário
  const buscarComunidadesUsuario = async (userId) => {
    try {
      const comunidades = await $pb.collection('comunidade').getList(1, 50, {
        filter: `membros ~ "${userId}"`,  // Operador ~ para verificar se userId está no array membros
        sort: '-created',
        $autoCancel: false
      });
      
      return { sucesso: true, dados: comunidades.items || [] };  // Retorna .items
    } catch (error) {
      console.error('Erro ao buscar comunidades:', error);
      return { sucesso: true, dados: [] };  // Retorna array vazio mas com sucesso para não travar
    }
  };

  // Verificar se é o próprio usuário
  const ehProprioUsuario = (userId) => {
    const usuarioAtual = $pb.authStore.model;
    return usuarioAtual && String(usuarioAtual.id) === String(userId);
  };

  // Adicionar XP ao usuário
  const adicionarXP = async (userId, quantidade) => {
    try {
      const usuario = await $pb.collection('users').getOne(userId);
      const xpAtual = usuario.XP || 0; 
      const novoXP = xpAtual + quantidade;

      const atualizado = await $pb.collection('users').update(userId, {
        XP: novoXP  
      });

      return { sucesso: true, dados: atualizado, novoXP };
    } catch (error) {
      console.error('Erro ao adicionar XP:', error);
      return { sucesso: false, erro: error.message };
    }
  };

  return {
    buscarUsuarioPorId,
    atualizarPerfil,
    calcularNivel,
    xpParaProximoNivel,
    buscarConquistasUsuario,
    buscarTotalLivrosLidos,
    buscarLivrosFavoritos,
    buscarListasUsuario,
    ehProprioUsuario,
    adicionarXP,
    buscarComunidadesUsuario
  };
};