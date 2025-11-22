# Documentação dos Composables

## Visão Geral

Os composables são funções reutilizáveis que encapsulam a lógica de negócio da aplicação. Este documento detalha todos os composables disponíveis no projeto Incipit.

## Localização

Todos os composables estão em: `app/composables/`

## Lista de Composables

1. **useLivros.js** - Gerenciamento de livros
2. **useNotas.js** - Gerenciamento de avaliações/reviews
3. **useComentarios.js** - Gerenciamento de comentários
4. **useStatus.js** - Gerenciamento de status de leitura
5. **useTags.js** - Gerenciamento de tags/gêneros
6. **useSearch.js** - Busca de livros na API Google Books
7. **useListas.js** - Gerenciamento de listas de livros

---

## 1. useLivros.js

### Propósito
Gerencia operações relacionadas a livros, incluindo busca no banco de dados e na API do Google Books.

### Funções

#### `buscarLivroPorISBN(isbn)`
Busca um livro no banco de dados pelo ISBN.

**Parâmetros:**
- `isbn` (string): ISBN do livro

**Retorno:**
```javascript
{
  sucesso: boolean,
  dados?: object,
  erro?: string
}
```

**Exemplo:**
```javascript
const { buscarLivroPorISBN } = useLivros();
const resultado = await buscarLivroPorISBN('9788535932775');

if (resultado.sucesso) {
  console.log(resultado.dados); // Objeto do livro
}
```

#### `buscarDadosLivroAPI(isbn)`
Busca informações do livro na API do Google Books.

**Parâmetros:**
- `isbn` (string): ISBN do livro

**Retorno:**
```javascript
{
  sucesso: boolean,
  dados?: {
    autor: string,
    capa: string,
    titulo: string,
    descricao: string,
    editora: string,
    dataPublicacao: string,
    paginas: number
  },
  erro?: string
}
```

**Exemplo:**
```javascript
const { buscarDadosLivroAPI } = useLivros();
const resultado = await buscarDadosLivroAPI('9788535932775');

if (resultado.sucesso) {
  console.log(resultado.dados.autor);
  console.log(resultado.dados.capa);
}
```

#### `salvarLivro(dadosLivro)`
Salva um livro no banco de dados (verifica duplicatas).

**Parâmetros:**
- `dadosLivro` (object): Dados do livro

**Retorno:**
```javascript
{
  sucesso: boolean,
  dados?: object,
  jaExistia: boolean,
  erro?: string
}
```

#### `buscarTodosLivros()`
Busca todos os livros cadastrados.

**Retorno:**
```javascript
{
  sucesso: boolean,
  dados?: array,
  erro?: string
}
```

---

## 2. useNotas.js

### Propósito
Gerencia avaliações/reviews de livros (rating + texto opcional).

### Funções

#### `buscarNotasLivro(livroId)`
Busca todas as avaliações de um livro.

**Parâmetros:**
- `livroId` (string): ID do livro

**Retorno:**
```javascript
{
  sucesso: boolean,
  dados?: array, // Array de notas com expand de autor
  erro?: string
}
```

**Exemplo:**
```javascript
const { buscarNotasLivro } = useNotas();
const resultado = await buscarNotasLivro(livroId);

resultado.dados.forEach(nota => {
  console.log(nota.avaliacao); // 1-5
  console.log(nota.resenha); // Texto opcional
  console.log(nota.expand.autor.username);
});
```

#### `criarNota(dadosNota)`
Cria uma nova avaliação.

**Parâmetros:**
```javascript
dadosNota = {
  livro: string,      // ID do livro
  autor: string,      // ID do usuário
  avaliacao: number,  // 1-5
  resenha?: string    // Texto opcional
}
```

**Retorno:**
```javascript
{
  sucesso: boolean,
  dados?: object,
  erro?: string
}
```

#### `atualizarNota(notaId, dadosNota)`
Atualiza uma avaliação existente.

#### `deletarNota(notaId)`
Deleta uma avaliação.

#### `buscarNotaUsuario(livroId, usuarioId)`
Busca a avaliação de um usuário específico para um livro.

**Exemplo:**
```javascript
const { buscarNotaUsuario } = useNotas();
const resultado = await buscarNotaUsuario(livroId, usuarioId);

if (resultado.sucesso) {
  console.log('Usuário já avaliou este livro');
}
```

#### `atualizarMediaAvaliacoes(livroId)`
Calcula e atualiza a média de avaliações do livro.

**Retorno:**
```javascript
{
  sucesso: boolean,
  media: number,
  total: number,
  erro?: string
}
```

**Uso:**
```javascript
// Após criar/atualizar uma nota
await criarNota(dados);
await atualizarMediaAvaliacoes(livroId);
```

---

## 3. useComentarios.js

### Propósito
Gerencia comentários e respostas em livros.

### Funções

#### `buscarComentariosLivro(livroId)`
Busca comentários principais de um livro (sem respostas).

**Exemplo:**
```javascript
const { buscarComentariosLivro } = useComentarios();
const resultado = await buscarComentariosLivro(livroId);
```

#### `buscarRespostas(comentarioId)`
Busca respostas de um comentário específico.

#### `criarComentario(dadosComentario)`
Cria um novo comentário.

**Parâmetros:**
```javascript
dadosComentario = {
  conteudo: string,  // Texto do comentário
  autor: string,     // ID do usuário
  livro: string      // ID do livro
}
```

#### `responderComentario(comentarioPaiId, livroId, conteudo, autorId)`
Cria uma resposta a um comentário.

**Exemplo:**
```javascript
const { responderComentario } = useComentarios();
await responderComentario(
  comentarioPaiId,
  livroId,
  'Concordo!',
  usuarioId
);
```

#### `buscarComentariosComRespostas(livroId)`
Busca comentários com suas respostas aninhadas (hierárquico).

**Retorno:**
```javascript
{
  sucesso: boolean,
  dados?: [
    {
      ...comentario,
      respostas: [...] // Array de respostas
    }
  ],
  erro?: string
}
```

**Uso Recomendado:**
```javascript
// Use esta função para exibir comentários com respostas
const { buscarComentariosComRespostas } = useComentarios();
const resultado = await buscarComentariosComRespostas(livroId);

resultado.dados.forEach(comentario => {
  console.log(comentario.conteudo);
  comentario.respostas.forEach(resposta => {
    console.log('  → ' + resposta.conteudo);
  });
});
```

#### `atualizarComentario(comentarioId, conteudo)`
Atualiza o texto de um comentário.

#### `deletarComentario(comentarioId)`
Deleta um comentário.

---

## 4. useStatus.js

### Propósito
Gerencia status de leitura dos livros para usuários.

### Constantes

#### `OPCOES_STATUS`
Array com as opções de status disponíveis:
```javascript
[
  { valor: 'Pretendo ler', label: 'Pretendo ler' },
  { valor: 'Lendo', label: 'Lendo' },
  { valor: 'Lido', label: 'Lido' },
  { valor: 'Abandonei', label: 'Abandonei' }
]
```

### Funções

#### `buscarStatus(livroId, usuarioId)`
Busca o status atual de um usuário para um livro.

**Exemplo:**
```javascript
const { buscarStatus } = useStatus();
const resultado = await buscarStatus(livroId, usuarioId);

if (resultado.sucesso) {
  console.log(resultado.dados.nome); // 'Lendo'
}
```

#### `definirStatus(livroId, usuarioId, nomeStatus)`
Define ou atualiza o status de leitura.

**Parâmetros:**
- `livroId` (string): ID do livro
- `usuarioId` (string): ID do usuário
- `nomeStatus` (string): Um dos valores em OPCOES_STATUS

**Retorno:**
```javascript
{
  sucesso: boolean,
  dados?: object,
  atualizado: boolean, // true se atualizou, false se criou
  erro?: string
}
```

**Exemplo:**
```javascript
const { definirStatus } = useStatus();
await definirStatus(livroId, usuarioId, 'Lendo');
```

#### `removerStatus(statusId)`
Remove o status de leitura.

#### `buscarLivrosPorStatus(usuarioId, nomeStatus)`
Busca todos os livros com um determinado status.

**Exemplo:**
```javascript
const { buscarLivrosPorStatus } = useStatus();
const resultado = await buscarLivrosPorStatus(usuarioId, 'Lido');

console.log(`${resultado.dados.length} livros lidos`);
```

#### `buscarEstatisticasUsuario(usuarioId)`
Retorna estatísticas de leitura do usuário.

**Retorno:**
```javascript
{
  sucesso: boolean,
  dados?: {
    'Pretendo ler': number,
    'Lendo': number,
    'Lido': number,
    'Abandonei': number
  },
  erro?: string
}
```

**Uso:**
```javascript
const { buscarEstatisticasUsuario } = useStatus();
const resultado = await buscarEstatisticasUsuario(usuarioId);

console.log(`Livros lidos: ${resultado.dados.Lido}`);
```

---

## 5. useTags.js

### Propósito
Gerencia tags/gêneros associadas aos livros.

### Funções

#### `buscarTodasTags()`
Busca todas as tags cadastradas.

**Exemplo:**
```javascript
const { buscarTodasTags } = useTags();
const resultado = await buscarTodasTags();

resultado.dados.forEach(tag => {
  console.log(tag.nome);
});
```

#### `buscarTagsLivro(livroId)`
Busca as tags de um livro específico.

**Retorno:**
```javascript
{
  sucesso: boolean,
  dados?: array, // Array de objetos de tags
  erro?: string
}
```

#### `criarTag(nomeTag)`
Cria uma nova tag (verifica duplicatas).

**Comportamento:**
- Normaliza o nome (lowercase para comparação)
- Verifica se já existe
- Formata com primeira letra maiúscula

**Retorno:**
```javascript
{
  sucesso: boolean,
  dados?: object,
  jaExistia: boolean,
  erro?: string
}
```

**Exemplo:**
```javascript
const { criarTag } = useTags();
const resultado = await criarTag('ficção científica');

// Retorna tag existente ou cria nova como "Ficção científica"
```

#### `adicionarTagAoLivro(livroId, tagId)`
Adiciona uma tag existente a um livro.

#### `removerTagDoLivro(livroId, tagId)`
Remove uma tag de um livro.

#### `adicionarOuCriarTag(livroId, nomeTag)`
Função helper que cria ou busca uma tag e a associa ao livro.

**Retorno:**
```javascript
{
  sucesso: boolean,
  dados?: object,
  tagCriada: boolean,      // true se criou nova tag
  tagJaAdicionada: boolean, // true se já estava no livro
  erro?: string
}
```

**Uso Recomendado:**
```javascript
const { adicionarOuCriarTag } = useTags();
await adicionarOuCriarTag(livroId, 'Romance');
// Cria "Romance" se não existir e adiciona ao livro
```

#### `buscarLivrosPorTag(tagId)`
Busca todos os livros com uma determinada tag.

---

## 6. useSearch.js

### Propósito
Busca e formata dados de livros da API Google Books.

### Funções

#### `buscarLivros(termoBusca, startIndex, maxResults)`
Busca livros na API do Google Books.

**Parâmetros:**
- `termoBusca` (string): Termo de busca
- `startIndex` (number): Índice inicial para paginação
- `maxResults` (number): Quantidade máxima de resultados

**Retorno:**
```javascript
{
  sucesso: boolean,
  dados?: array,        // Array de livros formatados
  totalItems?: number,  // Total de resultados disponíveis
  erro?: string
}
```

**Exemplo:**
```javascript
const { buscarLivros } = useSearch();
const resultado = await buscarLivros('Harry Potter', 0, 20);

console.log(`${resultado.totalItems} resultados encontrados`);
resultado.dados.forEach(livro => {
  console.log(livro.volumeInfo.title);
});
```

#### `extrairISBN(livro)`
Extrai o ISBN de um objeto de livro da API.

**Retorno:** string (ISBN_13 ou ISBN_10)

#### `prepararDadosLivro(item)`
Formata dados da API para salvar no banco.

**Retorno:**
```javascript
{
  ISBN: string,
  Nome: string
}
```

#### `formatarInfoLivro(volume, item)`
Formata informações do livro para exibição na UI.

**Retorno:**
```javascript
{
  titulo: string,
  autor: string,
  capa: string,
  isbn: string,
  dataPublicacao?: string,
  descricao?: string,
  paginas?: number
}
```

---

## 7. useListas.js

### Propósito
Gerencia listas de livros criadas pelos usuários.

### Funções Principais

#### `buscarMinhasListas(usuarioId)`
Busca todas as listas de um usuário.

#### `criarLista(dadosLista)`
Cria uma nova lista.

#### `adicionarLivroNaLista(listaId, livroId)`
Adiciona um livro a uma lista.

#### `removerLivroDaLista(listaId, livroId)`
Remove um livro de uma lista.

---

## Padrões de Uso

### 1. Tratamento de Erros
Todos os composables seguem o mesmo padrão de retorno:

```javascript
const resultado = await funcao();

if (resultado.sucesso) {
  // Sucesso - dados em resultado.dados
  console.log(resultado.dados);
} else {
  // Erro - mensagem em resultado.erro
  console.error(resultado.erro);
  alert(resultado.erro);
}
```

### 2. Autenticação
Para acessar o usuário autenticado:

```javascript
const { $pb } = useNuxtApp();

if ($pb.authStore.isValid) {
  const usuarioId = $pb.authStore.model.id;
  const username = $pb.authStore.model.username;
}
```

### 3. Reatividade
Use `ref()` para dados reativos:

```javascript
import { ref } from 'vue';

const livros = ref([]);
const loading = ref(true);

// Atualizar
const resultado = await buscarLivros();
livros.value = resultado.dados;
loading.value = false;
```

### 4. Carregamento Paralelo
Use `Promise.all()` para carregar múltiplos dados:

```javascript
await Promise.all([
  carregarNotas(),
  carregarComentarios(),
  carregarTags()
]);
```

### 5. Expand de Relações
PocketBase permite expandir relações:

```javascript
const notas = await $pb.collection('notas').getList(1, 50, {
  filter: `livro = "${livroId}"`,
  expand: 'autor', // Expande informações do autor
  sort: '-created'
});

// Acessar dados expandidos
notas.items.forEach(nota => {
  console.log(nota.expand.autor.username);
});
```

## Boas Práticas

### 1. Sempre Verifique Sucesso
```javascript
const resultado = await funcao();
if (!resultado.sucesso) {
  // Tratar erro
  return;
}
// Continuar com resultado.dados
```

### 2. Use Composables em setup()
```javascript
<script setup>
const { buscarLivros } = useSearch();
const { salvarLivro } = useLivros();
</script>
```

### 3. Não Repita Lógica
Se uma operação é comum, crie uma função helper no composable:

```javascript
// ❌ Não fazer
async function salvarESomar() {
  await salvar();
  await calcular();
}

// ✅ Fazer - adicionar ao composable
export const useLivros = () => {
  const salvarEAtualizar = async (dados) => {
    const r1 = await salvar(dados);
    const r2 = await atualizar();
    return { sucesso: r1.sucesso && r2.sucesso };
  };
  
  return { salvarEAtualizar };
};
```

### 4. Nomeie Claramente
- Funções de busca: `buscar*`
- Funções de criação: `criar*`
- Funções de atualização: `atualizar*`
- Funções de deleção: `deletar*`

## Testes e Debugging

### Console Logs
Todos os composables incluem `console.error()` para facilitar debugging:

```javascript
try {
  // operação
} catch (error) {
  console.error('Erro ao buscar livro:', error);
  return { sucesso: false, erro: error.message };
}
```

### Verificar Conexão PocketBase
```javascript
const { $pb } = useNuxtApp();
console.log('PocketBase conectado:', $pb.baseUrl);
console.log('Usuário autenticado:', $pb.authStore.isValid);
```

### Verificar API Google Books
```javascript
const config = useRuntimeConfig();
console.log('API Key:', config.public.googleBooksApiKey ? 'Configurada' : 'Não configurada');
```

## Documentação Relacionada
- `PAGINA_LIVRO.md` - Uso dos composables na página de livro
- `REFATORACAO_COMPOSABLES.md` - Processo de refatoração
- `pocketbasescheme.json` - Esquema do banco de dados
