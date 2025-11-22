# 🔐 Guia de Permissões PocketBase - Sistema Incipit

## 🎯 Problema Identificado

Atualmente, muitas coleções têm regras de acesso **null** ou vazias (`""`), o que impede que usuários normais (não superadmin) acessem os dados necessários, como **nomes de autores em comentários**.

---

## 📋 Regras de Acesso Recomendadas

### 1. **Coleção: users** (Autenticação)

**Status Atual:** Todas as regras vazias (`""`)

**Regras Recomendadas:**

```javascript
// List Rule (listar usuários)
"@request.auth.id != ''"
// Permite que qualquer usuário autenticado veja a lista de usuários

// View Rule (ver detalhes de usuário)
"@request.auth.id != ''"
// Permite que qualquer usuário autenticado veja detalhes de outros usuários
// (necessário para mostrar nomes/avatares em comentários)

// Create Rule (criar usuário)
""
// Permanece vazio para permitir cadastro público

// Update Rule (atualizar usuário)
"id = @request.auth.id"
// Usuário só pode atualizar seus próprios dados

// Delete Rule (deletar usuário)
"id = @request.auth.id"
// Usuário só pode deletar sua própria conta
```

---

### 2. **Coleção: livro**

**Status Atual:** Todas as regras vazias (`""`)

**Regras Recomendadas:**

```javascript
// List Rule
""
// Permite que qualquer um (mesmo não autenticado) veja livros

// View Rule
""
// Permite que qualquer um veja detalhes dos livros

// Create Rule
"@request.auth.id != ''"
// Apenas usuários autenticados podem adicionar livros

// Update Rule
"@request.auth.id != ''"
// Qualquer usuário autenticado pode atualizar livros
// (ou restrinja mais se preferir)

// Delete Rule
"@request.auth.id != ''"
// Apenas usuários autenticados podem deletar livros
// (ou restrinja para admin apenas)
```

---

### 3. **Coleção: notas**

**Status Atual:** Todas as regras vazias (`""`)

**Regras Recomendadas:**

```javascript
// List Rule
""
// Permite que qualquer um veja as notas/avaliações

// View Rule
""
// Permite que qualquer um veja detalhes das notas

// Create Rule
"@request.auth.id != '' && autor.id = @request.auth.id"
// Apenas usuários autenticados podem criar notas
// E o autor da nota deve ser o usuário logado

// Update Rule
"autor.id = @request.auth.id"
// Usuário só pode editar suas próprias notas

// Delete Rule
"autor.id = @request.auth.id"
// Usuário só pode deletar suas próprias notas
```

---

### 4. **Coleção: listas**

**Status Atual:** Já tem regras, mas vamos verificar

**Regras Recomendadas:**

```javascript
// List Rule
""
// Permite que qualquer um veja listas públicas

// View Rule
"publica = true || autor.id = @request.auth.id"
// ✅ JÁ ESTÁ CORRETO

// Create Rule
"@request.auth.id != '' && autor.id = @request.auth.id"
// ✅ JÁ ESTÁ CORRETO

// Update Rule
"autor.id = @request.auth.id"
// ✅ JÁ ESTÁ CORRETO

// Delete Rule
"autor.id = @request.auth.id"
// ✅ JÁ ESTÁ CORRETO
```

---

### 5. **Coleção: comentario**

**Status Atual:** Todas as regras null ❌

**Regras Recomendadas:**

```javascript
// List Rule
""
// Permite que qualquer um veja comentários

// View Rule
""
// Permite que qualquer um veja detalhes dos comentários

// Create Rule
"@request.auth.id != ''"
// Apenas usuários autenticados podem comentar
// A validação do autor será feita no backend/composable

// Update Rule
"autor.id = @request.auth.id"
// Usuário só pode editar seus próprios comentários

// Delete Rule
"autor.id = @request.auth.id"
// Usuário só pode deletar seus próprios comentários
```

---

### 6. **Coleção: status**

**Status Atual:** Todas as regras null ❌

**Regras Recomendadas:**

```javascript
// List Rule
"usuario.id = @request.auth.id"
// Usuário só vê seus próprios status de leitura

// View Rule
"usuario.id = @request.auth.id"
// Usuário só vê detalhes dos seus próprios status

// Create Rule
"@request.auth.id != '' && usuario.id = @request.auth.id"
// Usuário só pode criar status para si mesmo

// Update Rule
"usuario.id = @request.auth.id"
// Usuário só pode atualizar seus próprios status

// Delete Rule
"usuario.id = @request.auth.id"
// Usuário só pode deletar seus próprios status
```

---

### 7. **Coleção: tags**

**Status Atual:** Todas as regras null ❌

**Regras Recomendadas:**

```javascript
// List Rule
""
// Qualquer um pode ver tags

// View Rule
""
// Qualquer um pode ver detalhes das tags

// Create Rule
"@request.auth.id != ''"
// Apenas usuários autenticados podem criar tags

// Update Rule
"@request.auth.id != ''"
// Apenas usuários autenticados podem editar tags

// Delete Rule
"@request.auth.id != ''"
// Apenas usuários autenticados podem deletar tags
```

---

### 8. **Coleção: comunidade**

**Status Atual:** Todas as regras null ❌

**Regras Recomendadas:**

```javascript
// List Rule
""
// Qualquer um pode ver comunidades públicas

// View Rule
"@request.auth.id != '' && (administrador.id = @request.auth.id || membros.id ?= @request.auth.id)"
// Apenas administrador ou membros podem ver detalhes

// Create Rule
"@request.auth.id != '' && administrador.id = @request.auth.id"
// Apenas usuários autenticados podem criar
// E devem ser o administrador

// Update Rule
"administrador.id = @request.auth.id"
// Apenas o administrador pode editar a comunidade

// Delete Rule
"administrador.id = @request.auth.id"
// Apenas o administrador pode deletar a comunidade
```

---

### 9. **Coleção: conquistas**

**Status Atual:** Todas as regras null ❌

**Regras Recomendadas:**

```javascript
// List Rule
""
// Qualquer um pode ver conquistas disponíveis

// View Rule
""
// Qualquer um pode ver detalhes das conquistas

// Create Rule
null
// Apenas admin pode criar conquistas (via painel)

// Update Rule
null
// Apenas admin pode editar conquistas

// Delete Rule
null
// Apenas admin pode deletar conquistas
```

---

### 10. **Coleção: usuario_conquista**

**Status Atual:** Todas as regras null ❌

**Regras Recomendadas:**

```javascript
// List Rule
"usuario.id = @request.auth.id"
// Usuário só vê suas próprias conquistas

// View Rule
"usuario.id = @request.auth.id"
// Usuário só vê detalhes das suas conquistas

// Create Rule
"@request.auth.id != ''"
// Sistema pode atribuir conquistas a usuários autenticados

// Update Rule
null
// Conquistas não devem ser editadas

// Delete Rule
null
// Conquistas não devem ser deletadas
```

---

## 🚀 Como Aplicar as Regras

### Método 1: Via Interface Web do PocketBase

1. **Acesse o painel admin:**
   ```
   http://127.0.0.1:8090/_/
   ```

2. **Para cada coleção:**
   - Clique na coleção (ex: "users")
   - Vá em **"API Rules"** (ícone de cadeado)
   - Insira as regras nos campos correspondentes
   - Clique em **"Save changes"**

---

### Método 2: Via Script (Backup e Restauração)

Crie um arquivo `update-rules.js`:

```javascript
// Script para atualizar regras via API do PocketBase
const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');

async function updateRules() {
  // Login como admin
  await pb.admins.authWithPassword('seu-email@admin.com', 'sua-senha');

  // Exemplo: Atualizar regras da coleção users
  const collection = await pb.collections.getOne('users');
  
  await pb.collections.update(collection.id, {
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    updateRule: 'id = @request.auth.id',
    deleteRule: 'id = @request.auth.id',
  });

  console.log('Regras atualizadas com sucesso!');
}

updateRules();
```

---

## 🔍 Testando as Permissões

### 1. **Teste de Leitura de Usuários**

```javascript
// No seu código Nuxt
const { $pb } = useNuxtApp();

// Deve funcionar agora
const usuarios = await $pb.collection('users').getList(1, 50);
console.log('Usuários:', usuarios);
```

### 2. **Teste de Comentários com Autor**

```javascript
// Buscar comentários com expansão do autor
const comentarios = await $pb.collection('comentario').getList(1, 50, {
  expand: 'autor'
});

// Agora deve mostrar o nome
comentarios.items.forEach(comentario => {
  console.log('Autor:', comentario.expand?.autor?.name);
});
```

### 3. **Teste de Criação de Nota**

```javascript
// Criar nota (deve funcionar se estiver autenticado)
const nota = await $pb.collection('notas').create({
  conteudo: 'Ótimo livro!',
  avaliacao: 5,
  autor: $pb.authStore.model.id,
  livroPK: 'id-do-livro'
});
```

---

## ⚠️ Regras Importantes

### **Operador `?=` (any match)**
```javascript
// Verifica se o usuário está na lista de membros
"membros.id ?= @request.auth.id"
```

### **Operador `!=` (not equals)**
```javascript
// Verifica se está autenticado
"@request.auth.id != ''"
```

### **Acesso a dados da requisição**
```javascript
// Validar dados enviados
"@request.data.autor = @request.auth.id"
```

### **Expansão de relações**
```javascript
// Acessar dados de relação
"autor.id = @request.auth.id"
```

---

## 📊 Resumo das Permissões por Coleção

| Coleção | List | View | Create | Update | Delete |
|---------|------|------|--------|--------|--------|
| **users** | Autenticado | Autenticado | Público | Próprio | Próprio |
| **livro** | Público | Público | Autenticado | Autenticado | Autenticado |
| **notas** | Público | Público | Próprio | Próprio | Próprio |
| **listas** | Público | Público/Próprio | Próprio | Próprio | Próprio |
| **comentario** | Público | Público | Próprio | Próprio | Próprio |
| **status** | Próprio | Próprio | Próprio | Próprio | Próprio |
| **tags** | Público | Público | Autenticado | Autenticado | Autenticado |
| **comunidade** | Público | Membro | Admin | Admin | Admin |
| **conquistas** | Público | Público | Admin | Admin | Admin |
| **usuario_conquista** | Próprio | Próprio | Sistema | Bloqueado | Bloqueado |

**Legenda:**
- **Público**: Qualquer um (mesmo não autenticado)
- **Autenticado**: Qualquer usuário logado
- **Próprio**: Apenas o dono do registro
- **Admin**: Apenas via painel admin
- **Sistema**: Criado por lógica do sistema
- **Membro**: Apenas membros/administrador

---

## 🔧 Correção Específica para Comentários

Para resolver o problema de **não mostrar o nome do usuário nos comentários**:

### 1. **Atualizar regras da coleção `users`:**

```javascript
List Rule: "@request.auth.id != ''"
View Rule: "@request.auth.id != ''"
```

### 2. **Atualizar regras da coleção `comentario`:**

```javascript
List Rule: ""
View Rule: ""
Create Rule: "@request.auth.id != '' && @request.data.autor = @request.auth.id"
Update Rule: "autor.id = @request.auth.id"
Delete Rule: "autor.id = @request.auth.id"
```

### 3. **No código, buscar com expansão:**

```vue
<script setup>
const { $pb } = useNuxtApp();

// Buscar comentários COM expansão do autor
const comentarios = await $pb.collection('comentario').getList(1, 50, {
  expand: 'autor',
  sort: '-created'
});
</script>

<template>
  <div v-for="comentario in comentarios.items" :key="comentario.id">
    <!-- Agora vai funcionar -->
    <p>{{ comentario.expand?.autor?.name }}</p>
    <p>{{ comentario.conteudo }}</p>
  </div>
</template>
```

---

## 🎯 Checklist de Implementação

- [ ] Atualizar regras da coleção `users` (List e View para autenticados)
- [ ] Atualizar regras da coleção `comentario` (todas)
- [ ] Atualizar regras da coleção `notas` (todas)
- [ ] Atualizar regras da coleção `status` (todas)
- [ ] Atualizar regras da coleção `tags` (todas)
- [ ] Atualizar regras da coleção `comunidade` (todas)
- [ ] Atualizar regras da coleção `conquistas` (List e View públicos)
- [ ] Atualizar regras da coleção `usuario_conquista` (todas)
- [ ] Testar busca de usuários
- [ ] Testar comentários com nomes de autores
- [ ] Testar criação de notas
- [ ] Testar sistema de listas

---

## 📝 Exemplo Completo de Fetch com Expansão

```javascript
// useComentarios.js ou similar
export const useComentarios = () => {
  const { $pb } = useNuxtApp();

  const buscarComentarios = async (livroId) => {
    try {
      const comentarios = await $pb.collection('comentario').getList(1, 50, {
        filter: `livro = "${livroId}"`,
        expand: 'autor,livro',
        sort: '-created'
      });

      return {
        sucesso: true,
        dados: comentarios.items
      };
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      return {
        sucesso: false,
        erro: error.message
      };
    }
  };

  return { buscarComentarios };
};
```

---

## 🚨 Avisos Importantes

1. **Não deixe regras null em produção**: Isso bloqueia completamente o acesso
2. **Sempre use validação nas regras de Create**: Evita usuários criarem dados em nome de outros
3. **Teste com usuários reais**: Não teste apenas como superadmin
4. **Use expand sempre que precisar de dados relacionados**: `expand: 'autor,livro,lista'`
5. **Cuidado com regras muito permissivas**: Avalie o que realmente precisa ser público

---

## 🎉 Resultado Esperado

Após aplicar essas regras:

✅ Usuários normais podem ver nomes de outros usuários  
✅ Comentários mostram o nome do autor  
✅ Notas e avaliações funcionam corretamente  
✅ Sistema de listas funciona perfeitamente  
✅ Status de leitura funciona  
✅ Tags são visíveis e gerenciáveis  
✅ Comunidades funcionam com controle de acesso  
✅ Sistema de conquistas operacional  

---

**Data de Criação**: 28 de Outubro, 2025  
**Versão**: 1.0  
**Status**: Pronto para Implementação ✅
