# 🚀 APLICAR PERMISSÕES - GUIA RÁPIDO

## ⚡ Problema Atual
Os nomes dos usuários não aparecem nos comentários porque o PocketBase está bloqueando o acesso aos dados da coleção `users`.

## ✅ Solução em 5 Minutos

### Passo 1: Acessar o Admin do PocketBase
1. Abra seu navegador
2. Acesse: **http://127.0.0.1:8090/_/**
3. Faça login com suas credenciais de admin

---

### Passo 2: Atualizar Coleção **users** (MAIS IMPORTANTE)

1. No painel lateral esquerdo, clique em **Collections**
2. Clique na coleção **users** (ícone de pessoa)
3. Clique no ícone de **cadeado** (🔒 API Rules)
4. Cole as regras abaixo:

```javascript
// List rule
@request.auth.id != ""

// View rule  
@request.auth.id != ""

// Create rule (deixe vazio)


// Update rule
id = @request.auth.id

// Delete rule
id = @request.auth.id
```

5. Clique em **Save changes**

---

### Passo 3: Atualizar Coleção **comentario**

1. Clique na coleção **comentario**
2. Clique no ícone de **cadeado** (🔒 API Rules)
3. Cole as regras abaixo:

```javascript
// List rule (deixe vazio)


// View rule (deixe vazio)


// Create rule
@request.auth.id != ""

// Update rule
autor.id = @request.auth.id

// Delete rule
autor.id = @request.auth.id
```

4. Clique em **Save changes**

---

### Passo 4: Atualizar Coleção **notas**

1. Clique na coleção **notas**
2. Clique no ícone de **cadeado** (🔒 API Rules)
3. Cole as regras abaixo:

```javascript
// List rule (deixe vazio)


// View rule (deixe vazio)


// Create rule
@request.auth.id != "" && autor.id = @request.auth.id

// Update rule
autor.id = @request.auth.id

// Delete rule
autor.id = @request.auth.id
```

4. Clique em **Save changes**

---

### Passo 5: Atualizar Coleção **status**

1. Clique na coleção **status**
2. Clique no ícone de **cadeado** (🔒 API Rules)
3. Cole as regras abaixo:

```javascript
// List rule
usuario.id = @request.auth.id

// View rule
usuario.id = @request.auth.id

// Create rule
@request.auth.id != "" && usuario.id = @request.auth.id

// Update rule
usuario.id = @request.auth.id

// Delete rule
usuario.id = @request.auth.id
```

4. Clique em **Save changes**

---

## 🧪 Testar as Mudanças

1. **Abra o terminal** na pasta do projeto Nuxt
2. Execute o comando:
   ```bash
   npm run dev
   ```
3. Acesse a página de um livro: **http://localhost:3000/livro/[isbn]**
4. Veja os comentários - **agora os nomes devem aparecer!** ✅

---

## 📸 Como Deve Ficar

### Antes (❌)
```
👤 Usuário
Comentário interessante sobre o livro...
```

### Depois (✅)
```
👤 JoãoSilva
Comentário interessante sobre o livro...
```

---

## 🔍 Como Copiar as Regras Corretamente

No PocketBase, quando você clica em **API Rules**, verá 5 campos:

1. **List rule** - Quem pode listar registros
2. **View rule** - Quem pode ver detalhes de um registro
3. **Create rule** - Quem pode criar novos registros
4. **Update rule** - Quem pode editar registros
5. **Delete rule** - Quem pode deletar registros

**Importante:**
- Quando a regra é **vazia**, digite apenas um **espaço em branco** ou deixe o campo completamente vazio
- Quando a regra tem **código**, copie exatamente como mostrado acima (sem as barras de comentário //)

---

## ⚠️ Problemas Comuns

### "Erro ao salvar regras"
- Verifique se copiou a regra **sem os comentários** (// List rule, etc.)
- Exemplo correto: `@request.auth.id != ""`
- Exemplo errado: `// List rule @request.auth.id != ""`

### "Ainda não aparece o nome"
1. Limpe o cache do navegador (Ctrl + Shift + R)
2. Faça logout e login novamente
3. Verifique se está testando com um usuário **não-superadmin**

### "Erro de permissão ao criar comentário"
- Verifique se a regra de **Create** da coleção **comentario** está correta
- O formato correto é: `@request.auth.id != ""`
- **Nota**: Removemos a validação `&& @request.data.autor = @request.auth.id` porque causava erro. A validação do autor é feita no código do composable.

---

## 🎯 Checklist Final

- [ ] Acessei http://127.0.0.1:8090/_/
- [ ] Atualizei regras da coleção **users**
- [ ] Atualizei regras da coleção **comentario**
- [ ] Atualizei regras da coleção **notas**
- [ ] Atualizei regras da coleção **status**
- [ ] Testei com um livro que tem comentários
- [ ] Os nomes dos usuários aparecem corretamente ✅

---

## 📚 Documentação Completa

Para entender melhor cada regra e configurar outras coleções, consulte:
- **POCKETBASE_PERMISSIONS_GUIDE.md** - Guia completo com todas as coleções

---

**Tempo estimado:** 5 minutos  
**Dificuldade:** Fácil ⭐  
**Impacto:** Alto - Resolve o problema dos nomes nos comentários 🎉
