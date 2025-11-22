# Página de Detalhes do Livro

## Visão Geral

A página de detalhes do livro (`/livro/[isbn]`) é uma página dinâmica que exibe informações completas sobre um livro específico, permitindo que usuários interajam através de avaliações, comentários, status de leitura e tags.

## Estrutura de Arquivos

### Página Principal
- **Localização**: `app/pages/livro/[isbn].vue`
- **Rota**: `/livro/:isbn` (dinâmica baseada no ISBN)
- **Estilos**: `app/styles/pages/livro.css`

### Componentes Utilizados
- **Header**: `app/components/Header.vue` - Header reutilizável com busca opcional
- **Estilos do Header**: `app/styles/components/header.css`

### Composables
1. **useLivros.js** - Busca informações do livro (DB + API)
2. **useNotas.js** - Gerencia avaliações/reviews (rating + texto)
3. **useComentarios.js** - Gerencia comentários e respostas
4. **useStatus.js** - Gerencia status de leitura (Pretendo ler, Lendo, Lido, Abandonei)
5. **useTags.js** - Gerencia tags/gêneros dos livros

## Funcionalidades

### 1. Exibição de Informações do Livro

#### Dados do Banco de Dados
- Nome do livro
- ISBN
- Avaliação média (calculada)
- Total de avaliações

#### Dados da Google Books API
- Capa do livro
- Autor(es)
- Editora
- Data de publicação
- Número de páginas
- Descrição/Sinopse

### 2. Sistema de Avaliações (Reviews)

#### Características
- **Rating**: Escala de 1 a 5 estrelas (obrigatório)
- **Resenha**: Texto opcional do usuário
- **Edição**: Usuários podem editar suas próprias avaliações
- **Listagem**: Exibe todas as avaliações com autor e data

#### Implementação
```javascript
// Criar ou atualizar avaliação
const { criarNota, atualizarNota, buscarNotaUsuario } = useNotas();

// Dados da avaliação
const dados = {
  livro: livroId,
  autor: usuarioId,
  avaliacao: 1-5, // Rating
  resenha: 'Texto opcional...'
};
```

#### Atualização da Média
- Após cada avaliação, a média do livro é recalculada automaticamente
- Usa `atualizarMediaAvaliacoes()` do composable `useNotas`

### 3. Sistema de Comentários

#### Características
- **Comentários principais**: Texto puro, sem rating
- **Respostas**: Usuários podem responder comentários de outros
- **Hierarquia**: Sistema de comentário pai/filho
- **Listagem**: Exibe comentários com suas respostas aninhadas

#### Implementação
```javascript
// Criar comentário
const { criarComentario, responderComentario } = useComentarios();

// Comentário principal
await criarComentario({
  conteudo: 'Texto do comentário',
  autor: usuarioId,
  livro: livroId
});

// Responder comentário
await responderComentario(comentarioPaiId, livroId, conteudo, usuarioId);
```

### 4. Status de Leitura

#### Opções Disponíveis
- **Pretendo ler**: Livro na lista de desejos
- **Lendo**: Atualmente lendo
- **Lido**: Livro finalizado
- **Abandonei**: Livro abandonado

#### Implementação
- Dropdown select para escolha do status
- Salva automaticamente ao alterar
- Um usuário pode ter apenas um status por livro
- Atualiza registro existente ou cria novo

```javascript
const { definirStatus, buscarStatus } = useStatus();

// Definir ou atualizar status
await definirStatus(livroId, usuarioId, 'Lendo');
```

### 5. Tags/Gêneros

#### Características
- **Tags personalizadas**: Usuários podem criar novas tags
- **Prevenção de duplicatas**: Verifica nome antes de criar
- **Normalização**: Primeira letra maiúscula, remove espaços extras
- **Remoção**: Usuários autenticados podem remover tags

#### Implementação
```javascript
const { adicionarOuCriarTag, removerTagDoLivro } = useTags();

// Adicionar ou criar tag
await adicionarOuCriarTag(livroId, 'Ficção Científica');

// Remover tag
await removerTagDoLivro(livroId, tagId);
```

## Fluxo de Dados

### Carregamento Inicial
1. Busca livro no banco de dados pelo ISBN
2. Busca dados adicionais na Google Books API
3. Carrega avaliações, comentários e tags
4. Se autenticado:
   - Busca status de leitura do usuário
   - Busca avaliação do usuário (se existir)

### Interações do Usuário

#### Avaliação
1. Usuário seleciona rating (1-5 estrelas)
2. Opcional: escreve resenha
3. Clica em "Publicar Avaliação"
4. Sistema salva ou atualiza nota no banco
5. Recalcula média de avaliações do livro
6. Recarrega dados da página

#### Comentário
1. Usuário escreve comentário
2. Clica em "Publicar Comentário"
3. Sistema salva no banco
4. Recarrega lista de comentários

#### Resposta
1. Usuário clica em "Responder" em um comentário
2. Formulário de resposta aparece
3. Usuário escreve e envia resposta
4. Sistema salva com referência ao comentário pai
5. Recarrega comentários (com respostas aninhadas)

#### Status
1. Usuário seleciona status no dropdown
2. Sistema salva automaticamente (onChange)
3. Atualiza ou cria registro de status

#### Tags
1. Usuário clica no botão "+"
2. Input aparece para digitar nome da tag
3. Usuário pressiona Enter
4. Sistema verifica duplicatas
5. Cria tag (se nova) e associa ao livro
6. Recarrega lista de tags

## Estrutura do Banco de Dados

### Tabela: livro
```
id: string
ISBN: string
Nome: string
AvaliacaoMedia: number
TotalAvaliacoes: number
tags: relation[] (tags)
created: datetime
updated: datetime
```

### Tabela: notas
```
id: string
resenha: text (opcional)
autor: relation (users)
livro: relation (livro)
avaliacao: number (1-5)
created: datetime
updated: datetime
```

### Tabela: comentario
```
id: string
conteudo: text
autor: relation (users)
livro: relation (livro)
comentario_pai: relation (comentario, opcional)
created: datetime
updated: datetime
```

### Tabela: status
```
id: string
nome: select (Pretendo ler, Lendo, Lido, Abandonei)
usuario: relation (users)
livro: relation (livro)
created: datetime
updated: datetime
```

### Tabela: tags
```
id: string
nome: string (único)
created: datetime
updated: datetime
```

## Estilos e Design

### Paleta de Cores (UnoCSS)
- **Background**: `var(--incipit-background)` - #0D1117
- **Cards**: `var(--incipit-card)` - #161B22
- **Primary**: `var(--incipit-primary)` - #DC892F
- **Text**: `var(--incipit-texto)` - #E6EDF3

### Layout Responsivo
- **Desktop**: Layout em duas colunas (capa + info)
- **Tablet**: Layout coluna única, mantém espaçamentos
- **Mobile**: Layout otimizado, elementos empilhados

### Componentes Visuais
- **Stars**: Sistema de estrelas para rating (amarelo #fbbf24)
- **Tags**: Pills arredondadas com cor primary
- **Buttons**: Hover com transformação e brightness
- **Cards**: Background escuro com bordas sutis
- **Forms**: Inputs e textareas com foco destacado

## Segurança e Validações

### Autenticação
- **Obrigatória para**:
  - Criar/editar avaliações
  - Criar comentários e respostas
  - Definir status de leitura
  - Adicionar/remover tags

### Validações
- **Avaliação**: Rating obrigatório (1-5)
- **Comentário**: Texto não pode estar vazio
- **Tags**: Nome não pode estar vazio, previne duplicatas
- **Status**: Apenas valores predefinidos

### Permissões
- Usuários podem editar apenas suas próprias avaliações
- Apenas usuários autenticados podem remover tags
- Confirmação antes de remover tags

## Performance

### Otimizações
- **Promise.all**: Carrega notas, comentários e tags em paralelo
- **Lazy loading**: Dados carregados apenas quando necessário
- **Recarregamento seletivo**: Atualiza apenas seção modificada

### Cache
- PocketBase mantém cache de autenticação
- Dados da API Google Books são buscados novamente a cada visita

## Melhorias Futuras

### Funcionalidades Planejadas
1. **Adicionar a listas**: Botão para adicionar livro a listas do usuário
2. **Compartilhamento**: Botões de compartilhamento em redes sociais
3. **Reações**: Sistema de likes/reações em comentários
4. **Ordenação**: Ordenar avaliações por data, rating, etc.
5. **Filtros**: Filtrar comentários e avaliações
6. **Notificações**: Notificar quando alguém responde seu comentário
7. **Edição**: Permitir editar/deletar comentários próprios
8. **Imagens**: Upload de imagens em resenhas
9. **Spoiler**: Marcar resenhas/comentários com spoilers
10. **Relatórios**: Sistema de denúncia de conteúdo impróprio

### Melhorias de UX
1. **Loading states**: Skeleton loaders durante carregamento
2. **Animações**: Transições suaves entre estados
3. **Infinite scroll**: Para comentários e avaliações extensas
4. **Preview**: Preview de resenha antes de publicar
5. **Markdown**: Suporte a formatação em resenhas
6. **Contadores**: Contador de caracteres em textareas
7. **Confirmações**: Modais de confirmação para ações destrutivas

## Exemplos de Uso

### Acessar Página
```
/livro/9788535932775
```

### De Outra Página (Search, Lista, etc.)
```vue
<NuxtLink :to="`/livro/${livro.ISBN}`">
  Ver Detalhes
</NuxtLink>
```

### Programaticamente
```javascript
const router = useRouter();
router.push(`/livro/${isbn}`);
```

## Troubleshooting

### Livro não carrega
- Verificar se ISBN existe no banco de dados
- Verificar conexão com Google Books API
- Checar console para erros de rede

### Avaliação não salva
- Verificar autenticação do usuário
- Confirmar que rating foi selecionado (1-5)
- Checar permissões no PocketBase

### Tags duplicadas
- Sistema previne duplicatas verificando nome
- Normalização remove diferenças de capitalização

### Comentários não aparecem
- Verificar se `expand: 'autor'` está funcionando
- Checar se relações estão corretas no PocketBase
- Confirmar que `comentario_pai` está vazio para principais

## Componente Header Reutilizável

### Uso
```vue
<Header :show-search="true" />
```

### Props
- `show-search` (Boolean): Exibe barra de busca no header

### Funcionalidades
- Logo com link para home
- Barra de busca (opcional)
- Menu de usuário (autenticado)
- Links de login/cadastro (não autenticado)
- Dropdown menu com opções do usuário

## Documentação Relacionada
- `ORGANIZACAO_CSS.md` - Organização de estilos
- `REFATORACAO_COMPOSABLES.md` - Uso de composables
- `pocketbasescheme.json` - Esquema do banco de dados
- `README.md` - Documentação geral do projeto
