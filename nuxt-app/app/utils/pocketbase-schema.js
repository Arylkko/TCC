// Estrutura das coleções PocketBase para o sistema de listas de livros

/*
COLEÇÃO: livro
Campos:
- id (auto)
- Nome (text, required)
- ISBN (text, required, unique)
- AvaliacaoMedia (number, optional, default: 0)
- TotalAvaliacoes (number, optional, default: 0)
- created (datetime, auto)
- updated (datetime, auto)

Regras de acesso:
- View rule: ""  (público)
- Create rule: "@request.auth.id != ''"  (apenas usuários autenticados)
- Update rule: "@request.auth.id != ''"  (apenas usuários autenticados)
- Delete rule: "@request.auth.id != ''"  (apenas usuários autenticados)
*/

/*
COLEÇÃO: listas
Campos:
- id (auto)
- nome (text, required)
- descricao (text, optional)
- publica (bool, default: false)
- autor (relation to users, required)
- livros (relation to livro, multiple: true, optional)
- created (datetime, auto)
- updated (datetime, auto)

Regras de acesso:
- View rule: "publica = true || autor.id = @request.auth.id"  
- Create rule: "@request.auth.id != '' && autor.id = @request.auth.id"  
- Update rule: "autor.id = @request.auth.id" 
- Delete rule: "autor.id = @request.auth.id" 
*/

/*
COLEÇÃO: users (já existe por padrão)
Campos padrão:
- id (auto)
- username (text, required, unique)
- email (text, required, unique)
- name (text, optional)
- verified (bool)
- created (datetime, auto)
- updated (datetime, auto)

Campos adicionais que podem ser úteis:
- avatar (file, optional)
- bio (text, optional)
*/
