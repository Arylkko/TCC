
export const useTags = () => {
  const { $pb } = useNuxtApp();

  // Busca todas as tags
  const buscarTodasTags = async () => {
    try {
      const tags = await $pb.collection('tags').getList(1, 200, {
        sort: 'nome'
      });
      return { sucesso: true, dados: tags.items };
    } catch (error) {
      console.error('Erro ao buscar tags:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar tags' };
    }
  };

  // Busca tags de um livro especifico
  const buscarTagsLivro = async (livroId) => {
    try {
      const livro = await $pb.collection('livro').getOne(livroId, {
        expand: 'tags'
      });
      
      if (livro.expand?.tags) {
        return { sucesso: true, dados: livro.expand.tags };
      }
      
      return { sucesso: true, dados: [] };
    } catch (error) {
      console.error('Erro ao buscar tags do livro:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar tags' };
    }
  };

  // Cria uma nova tag)
  const criarTag = async (nomeTag) => {
    try {
      
      const nomeNormalizado = nomeTag.trim().toLowerCase();
      
      
      const tagsExistentes = await $pb.collection('tags').getList(1, 1, {
        filter: `nome ~ "${nomeNormalizado}"`
      });

      if (tagsExistentes.items.length > 0) {
        return { 
          sucesso: true, 
          dados: tagsExistentes.items[0], 
          jaExistia: true 
        };
      }

      // Cria a nova tag com o nome formatado (primeira letra maiúscula)
      const nomeFormatado = nomeTag.trim().charAt(0).toUpperCase() + nomeTag.trim().slice(1).toLowerCase();
      const tag = await $pb.collection('tags').create({ nome: nomeFormatado });
      
      return { sucesso: true, dados: tag, jaExistia: false };
    } catch (error) {
      console.error('Erro ao criar tag:', error);
      return { sucesso: false, erro: error.message || 'Erro ao criar tag' };
    }
  };

  // Adiciona uma tag a um livro
  const adicionarTagAoLivro = async (livroId, tagId) => {
    try {
     
      const livro = await $pb.collection('livro').getOne(livroId);
      const tagsAtuais = livro.tags || [];

      
      if (tagsAtuais.includes(tagId)) {
        return { sucesso: true, dados: livro, jaAdicionada: true };
      }

      
      const novasTags = [...tagsAtuais, tagId];
      const livroAtualizado = await $pb.collection('livro').update(livroId, {
        tags: novasTags
      });

      return { sucesso: true, dados: livroAtualizado, jaAdicionada: false };
    } catch (error) {
      console.error('Erro ao adicionar tag ao livro:', error);
      return { sucesso: false, erro: error.message || 'Erro ao adicionar tag' };
    }
  };

  // Remove uma tag de um livro
  const removerTagDoLivro = async (livroId, tagId) => {
    try {
      const livro = await $pb.collection('livro').getOne(livroId);
      const tagsAtuais = livro.tags || [];

      const novasTags = tagsAtuais.filter(id => id !== tagId);
      const livroAtualizado = await $pb.collection('livro').update(livroId, {
        tags: novasTags
      });

      return { sucesso: true, dados: livroAtualizado };
    } catch (error) {
      console.error('Erro ao remover tag do livro:', error);
      return { sucesso: false, erro: error.message || 'Erro ao remover tag' };
    }
  };

  // Adiciona ou cria tag e associa ao livro (função helper)
  const adicionarOuCriarTag = async (livroId, nomeTag) => {
    try {
      // Cria ou busca a tag
      const resultadoTag = await criarTag(nomeTag);
      
      if (!resultadoTag.sucesso) {
        return resultadoTag;
      }

      // Adiciona a tag ao livro
      const resultado = await adicionarTagAoLivro(livroId, resultadoTag.dados.id);
      
      return {
        ...resultado,
        tagCriada: !resultadoTag.jaExistia,
        tagJaAdicionada: resultado.jaAdicionada
      };
    } catch (error) {
      console.error('Erro ao adicionar ou criar tag:', error);
      return { sucesso: false, erro: error.message || 'Erro ao processar tag' };
    }
  };

  // Busca livros por tag
  const buscarLivrosPorTag = async (tagId) => {
    try {
      const livros = await $pb.collection('livro').getList(1, 50, {
        filter: `tags ~ "${tagId}"`,
        sort: '-created'
      });
      return { sucesso: true, dados: livros.items };
    } catch (error) {
      console.error('Erro ao buscar livros por tag:', error);
      return { sucesso: false, erro: error.message || 'Erro ao buscar livros' };
    }
  };

  return {
    buscarTodasTags,
    buscarTagsLivro,
    criarTag,
    adicionarTagAoLivro,
    removerTagDoLivro,
    adicionarOuCriarTag,
    buscarLivrosPorTag
  };
};
