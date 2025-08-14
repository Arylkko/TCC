# Sistema de Listas de Livros

Este sistema permite que usuários criem listas personalizadas de livros, pesquisem livros usando a API do Google Books e organizem suas coleções.

## Estrutura do Projeto

### Composables (Funções Reutilizáveis)

#### `useListas.js`
Gerencia todas as operações relacionadas a listas:
- `criarLista(dadosLista)` - Cria uma nova lista
- `buscarListasUsuario(usuarioId)` - Busca todas as listas de um usuário
- `buscarListaPorId(listaId)` - Busca uma lista específica
- `atualizarLista(listaId, dadosAtualizados)` - Atualiza uma lista
- `deletarLista(listaId)` - Deleta uma lista
- `adicionarLivroNaLista(listaId, livroId)` - Adiciona um livro à lista
- `removerLivroDaLista(listaId, livroId)` - Remove um livro da lista

#### `useLivros.js`
Gerencia todas as operações relacionadas a livros:
- `buscarLivroPorISBN(isbn)` - Busca um livro pelo ISBN
- `salvarLivro(dadosLivro)` - Salva um novo livro no banco
- `buscarTodosLivros()` - Busca todos os livros

### Páginas

#### `/Criarlistas` 
- Interface para criar novas listas
- Visualização de todas as listas do usuário
- Opções para editar/deletar listas

#### `/searchteste`
- Pesquisa de livros usando Google Books API
- Salvamento de livros no banco de dados
- Adição de livros às listas existentes

#### `/lista/[id]`
- Visualização detalhada de uma lista específica
- Exibição de todos os livros da lista
- Opções para remover livros (se for o dono da lista)

## Como Usar

### 1. Configuração do PocketBase

Primeiro, configure as seguintes coleções no PocketBase:

**Coleção: livro**
- Nome: text (obrigatório)
- ISBN: text (obrigatório, único)
- Autor: text (opcional)
- Capa: url (opcional)
- AvaliacaoMedia: number (opcional, padrão: 0)
- TotalAvaliacoes: number (opcional, padrão: 0)

**Coleção: listas**
- nome: text (obrigatório)
- descricao: text (opcional)
- publica: bool (padrão: false)
- autor: relação com users (obrigatório)
- livros: relação com livro (múltipla, opcional)

### 2. Fluxo de Uso

1. **Login**: O usuário deve estar logado para criar listas
2. **Criar Lista**: Acesse `/Criarlistas` para criar uma nova lista
3. **Pesquisar Livros**: Acesse `/searchteste` para pesquisar livros
4. **Adicionar à Lista**: Use o botão "Adicionar à Lista" nos resultados da pesquisa
5. **Visualizar Lista**: Clique em "Ver/Editar" em uma lista para ver seus detalhes

### 3. Funcionalidades

- **Listas Públicas/Privadas**: Controle a visibilidade das suas listas
- **Pesquisa Integrada**: Busque livros diretamente pela API do Google Books
- **Gestão Completa**: Crie, edite, delete e organize suas listas
- **Interface Responsiva**: Funciona em desktop e mobile

## Estrutura do Banco de Dados

```
users (PocketBase padrão)
├── id
├── username
├── email
├── name
└── ...

livro
├── id
├── Nome
├── ISBN (único)
├── Autor
├── Capa
├── AvaliacaoMedia
├── TotalAvaliacoes
├── created
└── updated

listas
├── id
├── nome
├── descricao
├── publica
├── autor (relação com users)
├── livros (relação múltipla com livro)
├── created
└── updated
```

## Tecnologias Utilizadas

- **Nuxt 3**: Framework Vue.js
- **PocketBase**: Backend e banco de dados
- **Google Books API**: Pesquisa de livros
- **Vue Composition API**: Gerenciamento de estado reativo

## Próximas Funcionalidades

- [ ] Sistema de reviews/notas para livros
- [ ] Compartilhamento de listas públicas
- [ ] Busca e filtros avançados
- [ ] Importação/exportação de listas
- [ ] Sistema de tags para categorização
