# 🎨 Styles - Organização de Estilos do Projeto

## 📁 Estrutura

```
styles/
├── README.md           # Este arquivo
├── theme.ts           # Configuração de tema UnoCSS
└── pages/             # Estilos específicos de páginas
    ├── search.css     # Página de busca
    ├── login.css      # Página de login
    └── cadastro.css   # Página de cadastro
```

## 📋 Propósito

Esta pasta contém todos os estilos CSS do projeto, organizados de forma modular e escalável.

## 🎯 Convenções

### Arquivos de Página
- Um arquivo CSS por página em `pages/`
- Nome do arquivo corresponde ao nome da página
- Importados com `<style src="~/styles/pages/nome.css"></style>`

### Nomenclatura
- Classes em kebab-case: `.auth-card`, `.book-grid`
- Prefixos por contexto: `.auth-*`, `.book-*`, `.modal-*`
- Estados: `.is-loading`, `.is-active`, `.has-error`

### Organização do CSS
1. Comentários de seção
2. Seletores base
3. Estados e modificadores
4. Media queries
5. Animações (@keyframes)

## 📖 Mais Informações

Consulte `ORGANIZACAO_CSS.md` na raiz do projeto para documentação completa.

## 🚀 Como Usar

```vue
<!-- Em qualquer página .vue -->
<style src="~/styles/pages/minha-pagina.css"></style>
```
