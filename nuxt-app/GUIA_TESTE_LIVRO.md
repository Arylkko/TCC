# Guia de Teste - Página de Detalhes do Livro

## 🧪 Como Testar a Nova Funcionalidade

### Pré-requisitos

1. ✅ Servidor PocketBase rodando em http://127.0.0.1:8090
2. ✅ Banco de dados com schema importado
3. ✅ Usuário cadastrado no sistema
4. ✅ Pelo menos um livro no banco de dados
5. ✅ Servidor Nuxt rodando (`npm run dev`)

### Passo 1: Preparar Ambiente

```bash
# Terminal 1: Iniciar PocketBase
cd path/to/pocketbase
./pocketbase serve

# Terminal 2: Iniciar Nuxt
cd e:\TCC\nuxt-app
npm run dev
```

### Passo 2: Criar/Verificar Livro no Banco

Você pode adicionar um livro de duas formas:

#### Opção A: Via página de busca
1. Acesse http://localhost:3000/search
2. Busque por um livro (ex: "Harry Potter")
3. Clique em "Adicionar à Lista" ou "Salvar"
4. O livro será salvo no banco com ISBN

#### Opção B: Via PocketBase Admin
1. Acesse http://127.0.0.1:8090/_/
2. Entre na coleção "livro"
3. Crie um registro manualmente:
   - ISBN: `9788535932775` (exemplo)
   - Nome: `Nome do livro`

### Passo 3: Acessar Página de Detalhes

Acesse a URL com o ISBN do livro:
```
http://localhost:3000/livro/9788535932775
```

## 🔍 Cenários de Teste

### 1. Visualização de Informações (Sem Login)

**O que testar:**
- [ ] Capa do livro é exibida
- [ ] Título aparece corretamente
- [ ] Autor está visível
- [ ] ISBN está correto
- [ ] Rating médio mostra 0.0 (sem avaliações)
- [ ] Sinopse é exibida (se disponível na API)

**Como testar:**
1. Acesse a página SEM estar logado
2. Verifique se todas as informações aparecem
3. Confirme que NÃO aparecem:
   - Formulário de avaliação
   - Campo de comentário
   - Dropdown de status
   - Botão de adicionar tags

### 2. Sistema de Avaliações (Com Login)

**O que testar:**
- [ ] Formulário de avaliação aparece quando logado
- [ ] Estrelas são clicáveis (1-5)
- [ ] Textarea aceita texto
- [ ] Botão fica habilitado após selecionar estrelas
- [ ] Avaliação é salva com sucesso
- [ ] Média é atualizada automaticamente
- [ ] Avaliação aparece na lista

**Como testar:**

#### Criar primeira avaliação:
```javascript
1. Faça login no sistema
2. Acesse /livro/[isbn]
3. Clique em 5 estrelas
4. Digite: "Excelente livro! Recomendo muito."
5. Clique em "Publicar Avaliação"
6. Verifique:
   - Mensagem de sucesso
   - Rating médio agora é 5.0
   - Total de avaliações é 1
   - Sua avaliação aparece na lista
```

#### Editar avaliação existente:
```javascript
1. Acesse a página novamente
2. Formulário deve mostrar sua avaliação
3. Mude para 4 estrelas
4. Altere o texto
5. Clique em "Atualizar Avaliação"
6. Verifique:
   - Média atualizada para 4.0
   - Texto atualizado na lista
```

#### Criar segunda avaliação (outro usuário):
```javascript
1. Faça logout
2. Cadastre/entre com outro usuário
3. Acesse a mesma página
4. Avalie com 3 estrelas
5. Verifique:
   - Média agora é 3.5 ((4+3)/2)
   - Total de avaliações é 2
   - Ambas avaliações aparecem
```

### 3. Sistema de Comentários

**O que testar:**
- [ ] Campo de comentário aparece quando logado
- [ ] Comentário é publicado com sucesso
- [ ] Aparece na lista com nome do autor
- [ ] Botão "Responder" funciona
- [ ] Respostas aparecem aninhadas

**Como testar:**

#### Criar comentário:
```javascript
1. Faça login
2. Na seção "Comentários", digite: "Alguém já leu este livro?"
3. Clique em "Publicar Comentário"
4. Verifique:
   - Comentário aparece imediatamente
   - Seu nome/username aparece
   - Data está correta
```

#### Responder comentário:
```javascript
1. Clique em "Responder" no comentário
2. Formulário inline aparece
3. Digite: "Sim! É muito bom!"
4. Clique em "Enviar"
5. Verifique:
   - Resposta aparece indentada
   - Está conectada ao comentário pai
```

#### Múltiplas respostas:
```javascript
1. Faça logout e entre com outro usuário
2. Responda ao mesmo comentário
3. Verifique que ambas respostas aparecem
```

### 4. Status de Leitura

**O que testar:**
- [ ] Dropdown aparece quando logado
- [ ] Tem 4 opções + opção vazia
- [ ] Status é salvo ao selecionar
- [ ] Status persiste ao recarregar página

**Como testar:**

#### Definir status:
```javascript
1. Faça login
2. No dropdown "Meu Status", selecione "Lendo"
3. Status é salvo automaticamente
4. Recarregue a página
5. Verifique:
   - Dropdown mostra "Lendo" selecionado
```

#### Alterar status:
```javascript
1. Mude para "Lido"
2. Recarregue
3. Confirme que mostra "Lido"
```

### 5. Tags/Gêneros

**O que testar:**
- [ ] Tags do livro são exibidas
- [ ] Botão "+" aparece quando logado
- [ ] Input aparece ao clicar no "+"
- [ ] Tag é criada e adicionada
- [ ] Previne duplicatas
- [ ] Botão "X" remove tag

**Como testar:**

#### Adicionar tag:
```javascript
1. Faça login
2. Clique no botão "+" nas tags
3. Digite: "Ficção Científica"
4. Pressione Enter
5. Verifique:
   - Tag aparece imediatamente
   - Botão "X" aparece na tag
```

#### Adicionar tag duplicada:
```javascript
1. Tente adicionar "ficção científica" novamente
2. Verifique:
   - Não cria duplicata
   - Usa a tag existente
```

#### Remover tag:
```javascript
1. Clique no "X" de uma tag
2. Confirme na modal
3. Verifique:
   - Tag é removida
```

### 6. Componente Header

**O que testar:**
- [ ] Logo aparece e linka para home
- [ ] Barra de busca funciona (se showSearch=true)
- [ ] Menu de usuário aparece quando logado
- [ ] Links de login aparecem quando deslogado
- [ ] Dropdown menu abre/fecha
- [ ] Logout funciona

**Como testar:**

#### Visitante:
```javascript
1. Acesse sem login
2. Verifique:
   - Links "Entrar" e "Cadastrar" aparecem
   - Sem ícone de perfil
   - Sem menu
```

#### Logado:
```javascript
1. Faça login
2. Verifique:
   - Ícone de perfil aparece
   - Ícone de notificações aparece
   - Ícone de menu aparece
3. Clique no menu
4. Verifique:
   - Dropdown abre
   - Opções aparecem
5. Clique em "Sair"
6. Verifique:
   - Logout realizado
   - Redirecionado para login
```

## 🐛 Testes de Casos Extremos

### 1. Livro Não Encontrado

```javascript
URL: /livro/isbn-invalido

Esperado:
- Mensagem de erro
- Botão "Voltar à Busca"
```

### 2. API Google Books Indisponível

```javascript
Desconecte da internet ou desabilite a API

Esperado:
- Livro carrega do banco
- Dados da API não aparecem
- Sem crash
```

### 3. Textarea Vazio

```javascript
1. Tente publicar avaliação sem selecionar estrelas
Esperado: Botão desabilitado

2. Tente publicar comentário vazio
Esperado: Botão desabilitado
```

### 4. Usuário Não Autenticado

```javascript
1. Faça logout
2. Tente acessar página do livro

Esperado:
- Sem formulários de interação
- Apenas visualização
```

### 5. Muitas Avaliações/Comentários

```javascript
1. Crie 10+ avaliações e comentários
2. Verifique performance
3. Scroll funciona normalmente
```

## 📊 Checklist de Teste Completo

### Funcionalidades Básicas
- [ ] Página carrega sem erros
- [ ] Loading state aparece
- [ ] Informações do livro exibidas
- [ ] Rating médio calculado corretamente
- [ ] Sinopse formatada corretamente

### Avaliações
- [ ] Criar avaliação (primeira vez)
- [ ] Editar avaliação existente
- [ ] Média atualizada automaticamente
- [ ] Lista de avaliações exibida
- [ ] Múltiplos usuários podem avaliar

### Comentários
- [ ] Criar comentário principal
- [ ] Responder comentário
- [ ] Múltiplas respostas
- [ ] Hierarquia visual (indentação)
- [ ] Autor e data exibidos

### Status
- [ ] Selecionar status
- [ ] Status persiste
- [ ] Alterar status
- [ ] Status carrega ao abrir página

### Tags
- [ ] Adicionar nova tag
- [ ] Tag aparece imediatamente
- [ ] Previne duplicatas
- [ ] Remover tag
- [ ] Confirmação de remoção

### Header
- [ ] Logo funciona
- [ ] Busca funciona (se habilitada)
- [ ] Menu de usuário funciona
- [ ] Logout funciona
- [ ] Responsivo

### Responsividade
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Landscape mobile (667x375)

### Performance
- [ ] Carrega em < 2s
- [ ] Sem lag ao interagir
- [ ] Scroll suave
- [ ] Sem memory leaks

### Acessibilidade
- [ ] Botões têm títulos
- [ ] Formulários têm labels
- [ ] Contraste adequado
- [ ] Navegação por teclado

## 🔧 Debugging

### Console Errors

Se houver erros no console:

```javascript
// Verificar PocketBase
console.log($pb.baseUrl); // http://127.0.0.1:8090

// Verificar autenticação
console.log($pb.authStore.isValid); // true/false

// Verificar dados
console.log(livro.value);
console.log(notas.value);
```

### Network Tab

Verifique as requisições no DevTools:

```
GET /api/collections/livro/records?filter=...
POST /api/collections/notas/records
GET /api/collections/comentario/records?expand=...
```

### PocketBase Admin

Verifique os dados salvos:

```
1. Acesse http://127.0.0.1:8090/_/
2. Entre nas coleções
3. Verifique registros criados
```

## 📝 Relatório de Bugs

Se encontrar bugs, documente:

```markdown
**Bug**: Descrição curta

**Passos para reproduzir**:
1. ...
2. ...

**Resultado esperado**:
...

**Resultado obtido**:
...

**Console errors**:
```
...
```

**Screenshots**:
[anexar se possível]

**Ambiente**:
- Browser: Chrome 120
- OS: Windows 11
- Node: v20.10.0
```

## ✅ Teste de Aceitação Final

Execute este teste completo do início ao fim:

```javascript
// 1. Setup
[x] PocketBase rodando
[x] Nuxt rodando
[x] Usuário criado
[x] Livro no banco

// 2. Visualização (sem login)
[x] Acessar /livro/[isbn]
[x] Ver informações
[x] Ver que não há formulários

// 3. Avaliação (com login)
[x] Fazer login
[x] Avaliar com 5 estrelas + texto
[x] Ver avaliação na lista
[x] Verificar média 5.0

// 4. Comentário
[x] Comentar "Teste de comentário"
[x] Ver comentário na lista

// 5. Status
[x] Selecionar "Lendo"
[x] Recarregar e verificar persistência

// 6. Tag
[x] Adicionar tag "Aventura"
[x] Ver tag na lista

// 7. Interação múltipla
[x] Logout
[x] Login com outro usuário
[x] Avaliar com 3 estrelas
[x] Responder comentário anterior
[x] Verificar hierarquia

// 8. Verificação final
[x] Média é 4.0 ((5+3)/2)
[x] 2 avaliações na lista
[x] 1 comentário com 1 resposta
[x] 1 tag presente
```

Se todos os itens passarem, a implementação está funcionando corretamente! ✨

## 🎉 Conclusão

Após executar todos os testes, você deverá ter:

- ✅ Página totalmente funcional
- ✅ Todas as interações funcionando
- ✅ Dados persistindo no banco
- ✅ UI responsiva
- ✅ Sem erros no console

**Pronto para produção!** 🚀
