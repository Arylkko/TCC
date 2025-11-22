# 🐛 Correção: Campo username vs name

## 🎯 Problema Encontrado

Mesmo após aplicar as permissões corretas no PocketBase, os nomes dos usuários continuavam aparecendo como "Usuário" nos comentários, notas e respostas.

## 🔍 Causa Raiz

O código estava tentando acessar o campo **`username`**, que **NÃO EXISTE** na coleção `users` do PocketBase.

### Estrutura Real da Coleção `users`:

```javascript
users (auth collection):
- id
- email (obrigatório)
- password (hidden)
- name (opcional) ← Campo correto!
- avatar
- emailVisibility
- verified
- created
- updated
```

**Nota:** O PocketBase **não** cria um campo `username` por padrão na coleção `users`. Os campos de identidade são `email` e `name`.

---

## ✅ Correções Aplicadas

### 1. **Notas/Avaliações** (linha 204)

**Antes:**
```vue
{{ nota.expand?.autor?.username || 'Usuário' }}
```

**Depois:**
```vue
{{ nota.expand?.autor?.name || nota.expand?.autor?.email || 'Usuário' }}
```

### 2. **Comentários** (linha 266)

**Antes:**
```vue
{{ comentario.expand?.autor?.username || 'Usuário' }}
```

**Depois:**
```vue
{{ comentario.expand?.autor?.name || comentario.expand?.autor?.email || 'Usuário' }}
```

### 3. **Respostas aos Comentários** (linha 320)

**Antes:**
```vue
{{ resposta.expand?.autor?.username || 'Usuário' }}
```

**Depois:**
```vue
{{ resposta.expand?.autor?.name || resposta.expand?.autor?.email || 'Usuário' }}
```

---

## 🎨 Lógica de Fallback

A nova implementação usa uma **cadeia de fallback**:

1. **Tenta `name`**: Se o usuário preencheu o nome, mostra o nome
2. **Tenta `email`**: Se não tem nome, mostra o email (sempre existe)
3. **Fallback final**: Se tudo falhar, mostra "Usuário"

```vue
{{ autor?.name || autor?.email || 'Usuário' }}
```

---

## 🧪 Como Testar

### Teste 1: Usuário com Nome Preenchido
1. Acesse http://localhost:3000/livro/[isbn]
2. Faça login com um usuário que **tem nome cadastrado**
3. Crie um comentário
4. **Resultado esperado**: Deve aparecer o **nome do usuário**

### Teste 2: Usuário sem Nome
1. Acesse http://localhost:3000/livro/[isbn]
2. Faça login com um usuário que **não tem nome cadastrado**
3. Crie um comentário
4. **Resultado esperado**: Deve aparecer o **email do usuário**

### Teste 3: Comentários Antigos
1. Acesse http://localhost:3000/livro/[isbn]
2. Veja comentários de outros usuários
3. **Resultado esperado**: Deve aparecer o **nome ou email** de cada autor

---

## 🔧 Se Ainda Não Funcionar

### Problema: Ainda aparece "Usuário"

**Possíveis causas:**

1. **Permissões do PocketBase não foram aplicadas**
   - Verifique: http://127.0.0.1:8090/_/
   - Coleção `users` → API Rules
   - **List Rule** deve ser: `@request.auth.id != ""`
   - **View Rule** deve ser: `@request.auth.id != ""`

2. **Cache do navegador**
   - Limpe o cache: `Ctrl + Shift + R`
   - Ou abra uma aba anônima

3. **Usuário não está autenticado**
   - Faça logout e login novamente
   - As permissões exigem que o usuário esteja autenticado

4. **Expand não está funcionando**
   - Abra o console do navegador (F12)
   - Verifique se há erros de permissão
   - Execute no console:
   ```javascript
   console.log('Comentários:', comentarios.value)
   console.log('Primeiro comentário:', comentarios.value[0])
   console.log('Autor expandido:', comentarios.value[0]?.expand?.autor)
   ```

---

## 📊 Debug: Como Verificar os Dados

### No Console do Navegador (F12):

```javascript
// Ver estrutura completa de um comentário
console.log(comentarios.value[0])

// Deve retornar algo como:
{
  id: "abc123",
  conteudo: "Ótimo livro!",
  autor: "xyz456",
  expand: {
    autor: {
      id: "xyz456",
      email: "usuario@email.com",
      name: "João Silva",  // ← Este campo agora deve aparecer!
      avatar: ""
    }
  }
}
```

---

## ⚡ Reinicie o Servidor de Desenvolvimento

Após as correções, reinicie o Nuxt:

```bash
# Pare o servidor (Ctrl + C)

# Inicie novamente
npm run dev
```

---

## 🎉 Resultado Final

Após as correções:

### Antes (❌)
```
👤 Usuário
Ótimo livro! Recomendo muito.
28 de out. de 2025
```

### Depois (✅)
```
👤 João Silva
Ótimo livro! Recomendo muito.
28 de out. de 2025
```

Ou se o usuário não tem nome:

```
👤 joao@email.com
Ótimo livro! Recomendo muito.
28 de out. de 2025
```

---

## 📝 Resumo das Mudanças

| Componente | Campo Antigo | Campo Novo | Fallback |
|------------|--------------|------------|----------|
| Notas | `username` | `name` | `email` → `'Usuário'` |
| Comentários | `username` | `name` | `email` → `'Usuário'` |
| Respostas | `username` | `name` | `email` → `'Usuário'` |

---

## 🔍 Arquivos Modificados

- ✅ `app/pages/livro/[isbn].vue` (3 locais corrigidos)
  - Linha 204: Notas
  - Linha 266: Comentários
  - Linha 320: Respostas

---

## 📚 Documentação Relacionada

- **POCKETBASE_PERMISSIONS_GUIDE.md** - Guia completo de permissões
- **APLICAR_PERMISSOES_AGORA.md** - Guia rápido de aplicação de regras
- **utils/pocketbaseinfo.js** - Estrutura das coleções

---

**Data da Correção**: 28 de Outubro, 2025  
**Status**: ✅ Corrigido  
**Impacto**: Alto - Resolve completamente o problema dos nomes  
**Teste**: Pendente - Usuário precisa testar
