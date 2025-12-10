// Composable para gerenciar comunidades
export const useComunidades = () => {
  const { $pb } = useNuxtApp();

  // Buscar todas as comunidades
  const buscarComunidades = async (filtro = '') => {
    try {
      const filter = filtro ? `nome ~ "${filtro}" || descricao ~ "${filtro}"` : '';
      const comunidades = await $pb.collection('comunidade').getList(1, 50, {
        filter,
        expand: 'lider,membros,livro_semana',
        sort: '-created'
      });
      return { sucesso: true, dados: comunidades.items };
    } catch (error) {
      console.error('Erro ao buscar comunidades:', error);
      return { sucesso: false, erro: error.message };
    }
  };

  // Buscar comunidade por ID
  const buscarComunidadePorId = async (id) => {
    try {
      const comunidade = await $pb.collection('comunidade').getOne(id, {
        expand: 'lider,membros,livro_semana'
      });
      return { sucesso: true, dados: comunidade };
    } catch (error) {
      console.error('Erro ao buscar comunidade:', error);
      return { sucesso: false, erro: error.message };
    }
  };
  // Criar nova comunidade
  const criarComunidade = async (dados) => {
    try {
      const usuarioId = $pb.authStore.model?.id;
      if (!usuarioId) {
        return { sucesso: false, erro: 'Usuário não autenticado' };
      }

      // Usar FormData para upload de arquivo
      const formData = new FormData();
      formData.append('nome', dados.nome);
      formData.append('descricao', dados.descricao || '');
      formData.append('lider', usuarioId);
      formData.append('membros', usuarioId);

      if (dados.imagem_comunidade) {
        formData.append('imagem_comunidade', dados.imagem_comunidade);
      }

      const comunidade = await $pb.collection('comunidade').create(formData);
      return { sucesso: true, dados: comunidade };
    } catch (error) {
      console.error('Erro ao criar comunidade:', error);
      return { sucesso: false, erro: error.message };
    }
  };  // Entrar na comunidade
  const entrarNaComunidade = async (comunidadeId) => {
    try {
      const usuarioId = $pb.authStore.model?.id;
      if (!usuarioId) {
        return { sucesso: false, erro: 'Usuário não autenticado' };
      }

      

      // Buscar a comunidade atual
      const comunidade = await $pb.collection('comunidade').getOne(comunidadeId, {
        $autoCancel: false
      });

      
      if (comunidade.membros && comunidade.membros.includes(usuarioId)) {
        return { sucesso: false, erro: 'Você já é membro desta comunidade' };
      }

      // Usar operador += para adicionar membro (sintaxe do PocketBase para relações)
      const atualizado = await $pb.collection('comunidade').update(comunidadeId, {
        'membros+': usuarioId  // Usar += para adicionar sem remover os existentes
      }, {
        $autoCancel: false
      });

 

      return { sucesso: true, dados: atualizado };
    } catch (error) {
      console.error('Erro ao entrar na comunidade:', error);
      console.error('Detalhes do erro:', error.response?.data);
      console.error('Status do erro:', error.status);
      return { sucesso: false, erro: error.message || 'Erro ao entrar na comunidade' };
    }
  };
  // Sair da comunidade
  const sairDaComunidade = async (comunidadeId) => {
    try {
      const usuarioId = $pb.authStore.model?.id;
      if (!usuarioId) {
        return { sucesso: false, erro: 'Usuário não autenticado' };
      }

      const comunidade = await $pb.collection('comunidade').getOne(comunidadeId);

      if (comunidade.lider === usuarioId) {
        return { sucesso: false, erro: 'O líder não pode sair da comunidade' };
      }

      const novosMembros = (comunidade.membros || []).filter(id => id !== usuarioId);
      
      const atualizado = await $pb.collection('comunidade').update(comunidadeId, {
        'membros': novosMembros
      });

      return { sucesso: true, dados: atualizado };
    } catch (error) {
      console.error('Erro ao sair da comunidade:', error);
      console.error('Detalhes do erro:', error.response?.data);
      return { sucesso: false, erro: error.message || 'Erro ao sair da comunidade' };
    }
  };

  const ehLider = (comunidade, usuarioId = null) => {
    const userId = usuarioId || $pb.authStore.model?.id;
    return comunidade?.lider === userId;
  };
  const ehMembro = (comunidade, usuarioId = null) => {
    const userId = usuarioId || $pb.authStore.model?.id;
    return comunidade?.membros?.includes(userId) || false;
  };  // Definir livro da semana
  const definirLivroSemana = async (comunidadeId, livroId, diasDuracao = 7) => { 
    try {
        // acho que ficaria legal algum tipo de search para pegar o livro, ai tipo quando o usuário clica
        //  ja coloca o ID, deixa q eu faço isso depois de tu fazer o css
      const dataFim = new Date();
      dataFim.setDate(dataFim.getDate() + diasDuracao);
      
      const atualizado = await $pb.collection('comunidade').update(comunidadeId, {
        livro_semana: livroId,
        data_fim_leitura: dataFim.toISOString()
      });

      return { sucesso: true, dados: atualizado };
    } catch (error) {
      console.error('Erro ao definir livro da semana:', error);
      return { sucesso: false, erro: error.message };
    }
  };

  // Buscar comentários da comunidade
  const buscarComentarios = async (comunidadeId) => {
    try {
      const comentarios = await $pb.collection('comentario').getList(1, 100, {
        filter: `comunidade = "${comunidadeId}"`,
        expand: 'autor',
        sort: '-created',
        $autoCancel: false
      });
      return { sucesso: true, dados: comentarios.items };
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      return { sucesso: false, erro: error.message };
    }
  };
  // Criar comentário
  const criarComentario = async (comunidadeId, conteudo, spoiler = false) => {
    try {
      const usuarioId = $pb.authStore.model?.id;
      if (!usuarioId) {
        return { sucesso: false, erro: 'Usuário não autenticado' };
      }

      const comentario = await $pb.collection('comentario').create({
        conteudo,
        autor: usuarioId,
        comunidade: comunidadeId,
        spoiler: spoiler
      });

      return { sucesso: true, dados: comentario };
    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      return { sucesso: false, erro: error.message };
    }
  };

  return {
    buscarComunidades,
    buscarComunidadePorId,
    criarComunidade,
    entrarNaComunidade,
    sairDaComunidade,
    ehLider,
    ehMembro,
    definirLivroSemana,
    buscarComentarios,
    criarComentario
  };
};
