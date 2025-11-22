# Incipit - Plataforma de Livros

Plataforma web para descoberta, organização e discussão sobre livros. Desenvolvida com Nuxt 3, PocketBase e UnoCSS.

## 📚 Sobre o Projeto

Incipit é uma rede social para leitores que permite:
- 🔍 Buscar livros usando a API do Google Books
- ⭐ Avaliar livros com notas de 1-5 estrelas e resenhas
- 💬 Comentar e discutir sobre livros
- 📖 Marcar status de leitura (Pretendo ler, Lendo, Lido, Abandonei)
- 🏷️ Organizar livros com tags/gêneros personalizadas
- 📋 Criar e gerenciar listas de livros

## 🛠️ Tecnologias

- **Framework**: [Nuxt 3](https://nuxt.com/)
- **Backend**: [PocketBase](https://pocketbase.io/)
- **CSS**: [UnoCSS](https://unocss.dev/)
- **API Externa**: [Google Books API](https://developers.google.com/books)

## 📖 Documentação

- [PAGINA_LIVRO.md](./PAGINA_LIVRO.md) - Página de detalhes do livro
- [COMPOSABLES.md](./COMPOSABLES.md) - Documentação completa dos composables
- [ORGANIZACAO_CSS.md](./ORGANIZACAO_CSS.md) - Organização de estilos
- [REFATORACAO_COMPOSABLES.md](./REFATORACAO_COMPOSABLES.md) - Refatoração de composables
- [INFINITE_SCROLL.md](./INFINITE_SCROLL.md) - Implementação de scroll infinito
- [SISTEMA_LISTAS.md](./SISTEMA_LISTAS.md) - Sistema de listas de livros

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## 📁 Estrutura do Projeto

```
app/
├── components/          # Componentes reutilizáveis
│   └── Header.vue      # Header com busca e menu de usuário
├── composables/        # Lógica de negócio reutilizável
│   ├── useLivros.js   # Gerenciamento de livros
│   ├── useNotas.js    # Gerenciamento de avaliações
│   ├── useComentarios.js # Gerenciamento de comentários
│   ├── useStatus.js   # Status de leitura
│   ├── useTags.js     # Tags/gêneros
│   ├── useSearch.js   # Busca na API
│   └── useListas.js   # Listas de livros
├── pages/             # Rotas da aplicação
│   ├── index.vue     # Página inicial
│   ├── search.vue    # Busca de livros
│   ├── login.vue     # Login
│   ├── cadastro.vue  # Cadastro
│   ├── livro/
│   │   └── [isbn].vue # Detalhes do livro
│   └── lista/
│       └── [id].vue   # Detalhes da lista
└── styles/            # Estilos CSS organizados
    ├── components/    # Estilos de componentes
    └── pages/         # Estilos de páginas
```

## 🚀 Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## 🔑 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
NUXT_PUBLIC_GOOGLE_BOOKS_API_KEY=sua_chave_aqui
NUXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

### PocketBase

1. Baixe o [PocketBase](https://pocketbase.io/docs/)
2. Execute o servidor: `./pocketbase serve`
3. Acesse http://127.0.0.1:8090/_/
4. Importe o schema em `app/utils/pocketbasescheme.json`

## 🎯 Funcionalidades Principais

### Página de Detalhes do Livro (`/livro/[isbn]`)

- **Informações do Livro**: Capa, título, autor, editora, sinopse
- **Sistema de Avaliações**: Rating de 1-5 estrelas + resenha opcional
- **Comentários**: Comentários com respostas aninhadas
- **Status de Leitura**: Pretendo ler, Lendo, Lido, Abandonei
- **Tags**: Adicione e gerencie gêneros/tags personalizadas

### Busca de Livros (`/search`)

- Busca na API do Google Books
- Infinite scroll (carrega 20 livros por vez)
- Adicionar livros a listas
- Salvar livros no banco de dados

### Sistema de Listas

- Criar listas personalizadas
- Adicionar/remover livros
- Compartilhar listas

## 🧩 Composables

Os composables encapsulam toda a lógica de negócio:

```javascript
// Exemplo: Usar composables
import { useLivros } from '~/composables/useLivros';
import { useNotas } from '~/composables/useNotas';

const { buscarLivroPorISBN } = useLivros();
const { criarNota, buscarNotasLivro } = useNotas();

// Buscar livro
const resultado = await buscarLivroPorISBN('9788535932775');

// Criar avaliação
await criarNota({
  livro: livroId,
  autor: usuarioId,
  avaliacao: 5,
  resenha: 'Excelente livro!'
});
```

Veja [COMPOSABLES.md](./COMPOSABLES.md) para documentação completa.

## 🎨 Estilos

O projeto usa UnoCSS com variáveis CSS customizadas:

```css
:root {
  --incipit-background: #0D1117;
  --incipit-card: #161B22;
  --incipit-primary: #DC892F;
  --incipit-texto: #E6EDF3;
}
```

Todos os estilos estão organizados em arquivos separados:
- `styles/components/` - Estilos de componentes
- `styles/pages/` - Estilos de páginas

Veja [ORGANIZACAO_CSS.md](./ORGANIZACAO_CSS.md) para detalhes.

## 🗄️ Banco de Dados

### Coleções Principais

- **livro**: Livros cadastrados (ISBN, Nome, AvaliacaoMedia, TotalAvaliacoes)
- **notas**: Avaliações dos usuários (rating + resenha)
- **comentario**: Comentários e respostas
- **status**: Status de leitura dos usuários
- **tags**: Tags/gêneros dos livros
- **listas**: Listas criadas pelos usuários

Schema completo: `app/utils/pocketbasescheme.json`

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 👥 Autores

Projeto desenvolvido como Trabalho de Conclusão de Curso (TCC).
