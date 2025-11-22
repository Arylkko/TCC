# 🔄 Infinite Scroll - Documentação

## 📋 Implementação na Página de Busca

O infinite scroll foi implementado na página `search.vue` para melhorar a performance e experiência do usuário ao buscar livros.

## ✨ Funcionalidades

### Carregamento Paginado
- **Primeira busca**: Carrega 20 livros
- **Scroll automático**: Carrega mais 20 livros ao chegar a 80% da página
- **Performance**: Evita carregar todos os resultados de uma vez

### Variáveis de Controle
```javascript
const startIndex = ref(0);          // Índice inicial para próxima busca
const maxResults = ref(20);         // Quantidade de livros por página
const totalItems = ref(0);          // Total de resultados disponíveis
const loadingMore = ref(false);     // Status do carregamento adicional
const hasMore = ref(true);          // Se há mais resultados para carregar
```

## 🎯 Comportamento

### 1. Nova Busca
- Reseta todos os parâmetros
- Carrega primeiros 20 livros
- Verifica total de resultados disponíveis

### 2. Scroll Infinito
- Detecta quando usuário chega a 80% da página
- Carrega automaticamente mais 20 livros
- Adiciona novos livros aos resultados existentes

### 3. Indicadores Visuais
- **Loading inicial**: Spinner grande no centro
- **Loading de mais resultados**: Spinner pequeno no final da lista
- **Fim dos resultados**: Mensagem "Todos os resultados foram carregados"

## 📊 Contador de Resultados

Mostra informação detalhada:
```
15 de 150 resultados para
```
- **15**: Livros carregados atualmente
- **150**: Total de livros disponíveis na busca

## 🔧 Funções Principais

### `searchBooks()`
- Realiza busca inicial
- Usa parâmetros `startIndex` e `maxResults` da API do Google Books
- Reseta estado para nova busca

### `loadMoreBooks()`
- Carrega próxima página de resultados
- Adiciona aos resultados existentes
- Atualiza índice para próxima busca

### `handleScroll()`
- Detecta posição do scroll
- Trigger automático quando chega a 80% da página
- Previne múltiplas requisições simultâneas

## 🎨 Estados Visuais

1. **Loading inicial**: Spinner + "Buscando livros..."
2. **Resultados carregados**: Grid de livros
3. **Loading mais**: Spinner pequeno + "Carregando mais livros..."
4. **Fim**: Ícone de check + "Todos os resultados foram carregados"

## 🚀 Melhorias de Performance

- ✅ Carrega apenas 20 livros por vez
- ✅ Reduz uso de memória
- ✅ Melhora tempo de resposta inicial
- ✅ Experiência fluida sem paginação manual
- ✅ Listener de scroll removido ao desmontar componente

## 📱 Compatibilidade

- Desktop: Scroll com mouse wheel ou barra
- Mobile: Scroll touch nativo
- Tablets: Funciona em ambos os modos

## 🔄 Lifecycle

```javascript
onMounted(() => {
  // Adiciona listener de scroll
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  // Remove listener para evitar memory leaks
  window.removeEventListener('scroll', handleScroll);
});
```

## 💡 Dicas de Uso

1. **Primeira busca sempre fresca**: Cada nova pesquisa reseta os resultados
2. **Scroll suave**: Não precisa chegar ao final exato, 80% já carrega mais
3. **Sem spam**: Sistema previne múltiplas requisições ao mesmo tempo
4. **Feedback visual**: Usuário sempre sabe o que está acontecendo
