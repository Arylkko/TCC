# 🔐 Configuração de Variáveis de Ambiente

## 📋 Setup Inicial

1. **Copie o arquivo de exemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Preencha as variáveis necessárias no arquivo `.env`**

## 🔑 Variáveis Disponíveis

### `NUXT_PUBLIC_GOOGLE_BOOKS_API_KEY`
**Obrigatória** para funcionalidade de busca de livros

**Como obter:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google Books API**
4. Vá em **Credenciais** → **Criar Credenciais** → **Chave de API**
5. Copie a chave gerada

### `NUXT_PUBLIC_POCKETBASE_URL`
URL do servidor PocketBase

**Padrão:** `http://127.0.0.1:8090`

**Para produção:** Altere para a URL do seu servidor PocketBase hospedado

## 🚀 Como Usar no Código

### Em componentes Vue:
```vue
<script setup>
const config = useRuntimeConfig();
const apiKey = config.public.googleBooksApiKey;
</script>
```

### Em composables:
```javascript
export const useSeuComposable = () => {
  const config = useRuntimeConfig();
  const apiKey = config.public.googleBooksApiKey;
  
  // Use apiKey nas suas requisições
}
```

## ⚠️ Importante

- **NUNCA** commite o arquivo `.env` no Git
- O arquivo `.env.example` deve ser commitado como referência
- Variáveis com prefixo `NUXT_PUBLIC_` são expostas no cliente
- Variáveis sem prefixo são apenas server-side

## 🔄 Restart Necessário

Após alterar o `.env`, você precisa **reiniciar o servidor de desenvolvimento**:
```bash
# Ctrl+C para parar
npm run dev
```

## 📚 Referências

- [Nuxt Runtime Config](https://nuxt.com/docs/guide/going-further/runtime-config)
- [Google Books API](https://developers.google.com/books/docs/v1/using)
- [PocketBase](https://pocketbase.io/docs/)
