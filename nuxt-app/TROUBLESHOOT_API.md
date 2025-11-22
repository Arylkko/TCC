# 🚨 GUIA RÁPIDO - ERRO DE API KEY

## ❌ Problema
Se você ver erro como: `"API key not valid"` ou busca de livros não funciona

## ✅ Solução Rápida

### 1️⃣ Verifique se o arquivo `.env` existe
```bash
# No PowerShell, na pasta nuxt-app:
ls .env
```

### 2️⃣ Verifique o conteúdo do `.env`
Deve ter esta linha:
```
NUXT_PUBLIC_GOOGLE_BOOKS_API_KEY=AIzaSyD8Cqi7wSLaFh3SVV2bBY5QbuxjdB73Br4
```

### 3️⃣ Reinicie o servidor
```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente:
npm run dev
```

### 4️⃣ Teste a API Key
Abra o console do navegador (F12) e digite:
```javascript
useRuntimeConfig().public.googleBooksApiKey
```
Deve retornar sua chave.

## 🔧 Se ainda não funcionar

1. **Limpe o cache do Nuxt:**
   ```bash
   rm -r .nuxt
   npm run dev
   ```

2. **Verifique se a API Key é válida:**
   - Acesse: https://console.cloud.google.com/apis/credentials
   - Veja se a chave está ativa
   - Verifique se a Google Books API está habilitada no projeto

3. **Teste a API manualmente:**
   ```bash
   # Abra no navegador:
   https://www.googleapis.com/books/v1/volumes?q=harry+potter&key=SUA_CHAVE_AQUI
   ```

## 📞 Onde a API é Usada

- `app/pages/searchteste.vue` - Busca de livros
- `app/composables/useLivros.js` - Busca por ISBN

## ⚡ Comandos Úteis

```bash
# Ver variáveis de ambiente
cat .env

# Copiar do exemplo
cp .env.example .env

# Reiniciar servidor
npm run dev
```
