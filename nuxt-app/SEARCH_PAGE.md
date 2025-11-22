# 🔍 Página de Busca - Documentação

## 📱 Layout Atualizado

A página de busca (`searchteste.vue`) foi completamente redesenhada para seguir o padrão visual do projeto Incipit.

### 🎨 Características Visuais

#### Header
- Logo "Incipit" clicável (redireciona para home)
- Barra de pesquisa centralizada e responsiva
- Ícone de conta e menu lateral
- Background: `#C7B198` (incipit-base)
- Bordas arredondadas na parte inferior

#### Grid de Resultados
- Layout responsivo em grid:
  - 2 colunas em mobile
  - 3 colunas em tablets
  - 4 colunas em desktop médio
  - 5 colunas em desktop grande
- Cards com:
  - Capa do livro (aspect ratio 2:3)
  - Hover com overlay e botões
  - Informações do autor e título

#### Filtros
- Contagem de resultados
- Opções: "Data" e "Nota" (dropdown)
- Botão "Aplicar filtros"
- Alternância entre "Livros" e "Comunidades"

### 🎯 Funcionalidades

#### Busca
1. Digite o termo na barra de pesquisa
2. Pressione Enter ou clique no ícone de lupa
3. Resultados aparecem em grid

#### Adicionar à Lista
1. Hover sobre o card do livro
2. Clique em "+ Lista"
3. Selecione a lista no modal
4. Livro é salvo no banco e adicionado à lista

#### Salvar Livro
1. Hover sobre o card
2. Clique em "Salvar"
3. Livro é salvo no banco de dados

### 🔗 Integração com Outras Páginas

#### Vindo de uma Lista
Se acessar com `?lista=ID_DA_LISTA`:
- Aparece botão "Voltar para a Lista"
- Ao adicionar livro, adiciona diretamente à lista específica
- Redireciona de volta após adicionar

#### Vindo do Header (outras páginas)
Se acessar com `?q=TERMO`:
- Busca é executada automaticamente
- Resultados aparecem imediatamente

### 📦 Componente Reutilizável

Foi criado `HeaderSearch.vue` para uso em outras páginas:

```vue
<template>
  <HeaderSearch 
    :enable-search="true"
    v-model:search-term="searchTerm"
    @search="searchBooks"
  />
</template>
```

#### Props:
- `searchTerm` (String) - Termo de busca
- `loading` (Boolean) - Estado de loading
- `enableSearch` (Boolean) - Se true, busca na página atual. Se false, redireciona para /searchteste

### 🎨 Classes UnoCSS Usadas

- `bg-incipit-fundo` - Fundo da página
- `bg-incipit-base` - Header e elementos base
- `bg-incipit-card` - Cards e modais
- `text-texto` - Texto principal
- `text-roxo` - Cor de destaque
- `text-branco` - Texto claro

### 📱 Responsividade

```css
grid-cols-2           /* Mobile: 2 colunas */
sm:grid-cols-3        /* Tablet: 3 colunas */
md:grid-cols-4        /* Desktop médio: 4 colunas */
lg:grid-cols-5        /* Desktop grande: 5 colunas */
```

### 🚀 Melhorias Futuras

- [ ] Implementar filtros funcionais (Data, Nota)
- [ ] Adicionar paginação
- [ ] Implementar busca por "Comunidades"
- [ ] Adicionar preview do livro ao clicar
- [ ] Salvar histórico de buscas
- [ ] Adicionar autocomplete na busca
- [ ] Implementar busca avançada (por autor, gênero, etc)

### 🎯 Estados da Página

1. **Inicial** - Ícone de livro e mensagem "Pesquise por livros"
2. **Loading** - Spinner animado
3. **Com Resultados** - Grid de cards
4. **Erro** - Ícone de alerta e mensagem de erro
5. **Sem Resultados** - Mensagem apropriada

### 💡 Dicas de Uso

- Use `Ctrl+K` para focar na busca (futuro)
- Hover nos cards para ver opções
- Modal pode ser fechado clicando fora
- Botões desabilitados durante operações
