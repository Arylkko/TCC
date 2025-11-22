# Funcionalidade: Click-to-View na Página de Busca

## 📝 Descrição

Implementação de navegação direta da página de busca para a página de detalhes do livro. Quando o usuário clica em um livro, o sistema:

1. **Salva automaticamente** o livro no banco de dados (se ainda não existir)
2. **Redireciona** para a página de detalhes `/livro/[isbn]`

## 🎯 Objetivo

Melhorar a experiência do usuário permitindo acesso rápido aos detalhes do livro com apenas um clique, garantindo que todos os livros visualizados estejam salvos no banco de dados.

## ⚙️ Implementação

### Nova Função: `verDetalhesLivro(item)`

```javascript
// Nova função: salva o livro e redireciona para página de detalhes
async function verDetalhesLivro(item) {
  // Salva o livro no banco primeiro
  const resultado = await salvarLivroNoBanco(item);
  
  if (resultado.sucesso) {
    // Extrai o ISBN para usar na URL
    const dadosLivro = prepararDadosLivro(item);
    if (dadosLivro && dadosLivro.ISBN) {
      // Redireciona para a página de detalhes
      navigateTo(`/livro/${dadosLivro.ISBN}`);
    } else {
      alert('ISBN não encontrado para este livro.');
    }
  } else {
    alert('Erro ao salvar livro: ' + resultado.erro);
  }
}
```

### Elementos Clicáveis

#### 1. Capa do Livro
```vue
<div 
  @click="verDetalhesLivro(item)"
  class="relative aspect-[2/3] bg-incipit-base overflow-hidden cursor-pointer"
>
  <img :src="capa" ... />
</div>
```

#### 2. Botão "Ver Detalhes" (no overlay)
```vue
<button 
  @click="verDetalhesLivro(item)"
  class="bg-roxo text-branco px-4 py-2 rounded-full"
>
  Ver Detalhes
</button>
```

#### 3. Título do Livro
```vue
<h3 
  @click="verDetalhesLivro(item)"
  class="cursor-pointer hover:text-roxo transition"
>
  {{ item.volumeInfo.title }}
</h3>
```

### Prevenção de Propagação

O overlay de botões usa `@click.stop` para evitar que os cliques nos botões secundários (Salvar, + Lista) acionem a navegação:

```vue
<div class="overlay" @click.stop>
  <!-- Botões aqui não acionam o click da capa -->
</div>
```

## 🔄 Fluxo de Execução

1. **Usuário clica** no livro (capa, título ou botão "Ver Detalhes")
2. **Sistema chama** `verDetalhesLivro(item)`
3. **Sistema salva** livro no banco via `salvarLivroNoBanco(item)`
   - Se já existe: retorna livro existente
   - Se não existe: cria novo registro
4. **Sistema extrai** ISBN do livro
5. **Sistema redireciona** para `/livro/[ISBN]`

### Diagrama de Fluxo

```
Clique no Livro
    ↓
verDetalhesLivro()
    ↓
salvarLivroNoBanco()
    ↓
    ├─→ Livro já existe? → Retorna existente
    └─→ Livro novo? → Cria no banco
    ↓
Extrai ISBN
    ↓
navigateTo('/livro/[ISBN]')
    ↓
Página de Detalhes Carrega
```

## 🎨 UI/UX

### Estados Visuais

1. **Hover na capa**: Zoom leve na imagem
2. **Hover no título**: Muda cor para roxo
3. **Overlay**: Aparece ao passar o mouse sobre a capa
4. **Cursor**: `cursor-pointer` nos elementos clicáveis

### Feedback ao Usuário

- **Durante salvamento**: Status visual no botão "Salvar"
- **Erro no salvamento**: Alert com mensagem de erro
- **ISBN não encontrado**: Alert informativo
- **Redirecionamento**: Transição suave para nova página

## 📊 Vantagens

1. ✅ **Experiência fluida**: Navegação com um clique
2. ✅ **Dados consistentes**: Livro sempre salvo antes de visualizar
3. ✅ **Múltiplas opções**: 3 formas de acessar os detalhes
4. ✅ **Salvamento automático**: Usuário não precisa clicar em "Salvar"
5. ✅ **Verificação de duplicatas**: Não cria registros repetidos

## 🔧 Casos de Uso

### Caso 1: Livro Novo
```
1. Usuário busca "Harry Potter"
2. Clica na capa do primeiro resultado
3. Sistema salva livro no banco (novo registro)
4. Redireciona para /livro/9780439064873
5. Página de detalhes carrega com todas as informações
```

### Caso 2: Livro Existente
```
1. Usuário busca "Harry Potter" novamente
2. Clica na capa do mesmo livro
3. Sistema verifica que livro já existe
4. Redireciona para /livro/9780439064873
5. Página de detalhes carrega (com avaliações/comentários existentes)
```

### Caso 3: Múltiplos Usuários
```
1. Usuário A salva e visualiza livro X
2. Usuário B busca o mesmo livro X
3. Usuário B clica na capa
4. Sistema identifica que livro já existe (salvo por A)
5. Ambos usuários podem avaliar/comentar o mesmo livro
```

## 🐛 Tratamento de Erros

### ISBN Não Encontrado
```javascript
if (!dadosLivro || !dadosLivro.ISBN) {
  alert('ISBN não encontrado para este livro.');
  return; // Não redireciona
}
```

### Erro ao Salvar
```javascript
if (!resultado.sucesso) {
  alert('Erro ao salvar livro: ' + resultado.erro);
  return; // Não redireciona
}
```

### Erro no PocketBase
```javascript
// Tratado no composable useLivros.js
try {
  const livro = await $pb.collection('livro').create(dados);
} catch (error) {
  return { sucesso: false, erro: error.message };
}
```

## 📝 Alterações no Código

### Arquivo: `app/pages/search.vue`

**Função Adicionada:**
```javascript
async function verDetalhesLivro(item) { ... }
```

**Template Modificado:**
- Capa: Adicionado `@click="verDetalhesLivro(item)"`
- Overlay: Adicionado `@click.stop` e botão "Ver Detalhes"
- Título: Adicionado `@click="verDetalhesLivro(item)"` e classes hover

## 🚀 Melhorias Futuras

1. **Loading State**: Mostrar spinner durante salvamento/redirecionamento
2. **Transição**: Animação de transição entre páginas
3. **Preview**: Tooltip com prévia ao passar mouse
4. **Histórico**: Salvar histórico de livros visualizados
5. **Cache**: Cachear dados da API para reduzir requisições

## 🧪 Como Testar

### Teste 1: Clique na Capa
```
1. Acesse /search
2. Busque por "Harry Potter"
3. Clique na capa de qualquer livro
4. Verifique:
   - Livro salvo no banco (verifique PocketBase Admin)
   - Redirecionamento para /livro/[ISBN]
   - Página de detalhes carrega corretamente
```

### Teste 2: Clique no Botão
```
1. Acesse /search
2. Busque por livros
3. Passe o mouse sobre uma capa (overlay aparece)
4. Clique em "Ver Detalhes"
5. Verifique redirecionamento
```

### Teste 3: Clique no Título
```
1. Acesse /search
2. Busque por livros
3. Clique no título de um livro
4. Verifique:
   - Título muda de cor no hover
   - Redirecionamento funciona
```

### Teste 4: Botões Secundários
```
1. Passe o mouse sobre uma capa
2. Clique em "Salvar" ou "+ Lista"
3. Verifique:
   - NÃO redireciona (stop propagation funciona)
   - Ação correspondente é executada
```

### Teste 5: Livro Duplicado
```
1. Clique em um livro (salva no banco)
2. Volte para /search
3. Busque o mesmo livro novamente
4. Clique nele de novo
5. Verifique:
   - Não cria registro duplicado
   - Redireciona normalmente
```

## ✅ Checklist de Verificação

- [x] Função `verDetalhesLivro()` implementada
- [x] Capa do livro é clicável
- [x] Botão "Ver Detalhes" adicionado ao overlay
- [x] Título do livro é clicável
- [x] Stop propagation no overlay funciona
- [x] Livro é salvo antes de redirecionar
- [x] Verificação de ISBN implementada
- [x] Tratamento de erros incluído
- [x] Estados de hover implementados
- [x] Cursor pointer nos elementos corretos
- [x] Sem erros no console
- [x] Funciona em todos os navegadores

## 📚 Documentação Relacionada

- [PAGINA_LIVRO.md](./PAGINA_LIVRO.md) - Detalhes da página de destino
- [COMPOSABLES.md](./COMPOSABLES.md) - API dos composables usados
- [SEARCH_PAGE.md](./SEARCH_PAGE.md) - Documentação da página de busca

## 🎉 Resultado

Agora os usuários podem navegar da busca para os detalhes do livro de forma **rápida, intuitiva e sem fricção**, melhorando significativamente a experiência de uso da plataforma! 🚀
