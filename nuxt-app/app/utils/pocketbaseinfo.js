// Estrutura das coleções PocketBase para o sistema de listas de livros
// Baseado no schema atual do banco de dados

/*
COLEÇÃO: users (auth collection)
ID: _pb_users_auth_
Campos:
- id (text, auto, 15 chars, primary key)
- password (password, hidden, min: 3)
- tokenKey (text, hidden, auto, 30-60 chars)
- email (email, required, unique)
- emailVisibility (bool, optional)
- verified (bool, optional)
- name (text, optional, max: 255)
- avatar (file, optional, webp only, max 1 file)
- NotasPK (relation to notas, multiple, optional)
- created (autodate)
- updated (autodate)

Regras de acesso:
- List rule: ""
- View rule: ""
- Create rule: ""
- Update rule: ""
- Delete rule: ""
- Auth rule: ""
- Auth token duration: 604800 (7 dias)
*/

/*
COLEÇÃO: listas
ID: pbc_4066227054
Campos:
- id (text, auto, 15 chars, primary key)
- nome (text, required)
- descricao (text, optional)
- publica (bool, optional, default: false)
- autor (relation to users, single, optional)
- livros (relation to livro, multiple, optional, max: 999)
- created (autodate)
- updated (autodate)

Regras de acesso:
- List rule: ""
- View rule: "publica = true || autor.id = @request.auth.id"
- Create rule: "@request.auth.id != '' && autor.id = @request.auth.id"
- Update rule: "autor.id = @request.auth.id"
- Delete rule: "autor.id = @request.auth.id"
*/

/*
COLEÇÃO: livro
ID: pbc_2280659052
Campos:
- id (text, auto, 15 chars, primary key)
- notafk (relation to notas, multiple, optional, max: 999)
- ISBN (text, required, unique)
- Nome (text, required)
- AvaliacaoMedia (number, optional, min: 0, max: 5) - DESCONTINUADO - não usar mais
- TotalAvaliacoes (number, optional, min: 0, max: 5) - DESCONTINUADO - não usar mais
- created (autodate)
- updated (autodate)

Índices:
- CREATE UNIQUE INDEX `idx_XOcvAaTKMd` ON `livro` (`ISBN`)

Regras de acesso:
- List rule: ""
- View rule: ""
- Create rule: ""
- Update rule: ""
- Delete rule: ""

Nota: 
- Autor e Capa são buscados dinamicamente da API do Google Books usando o ISBN
- Avaliações agora vêm do sistema interno (coleção notas) e não mais do Google Books
- Os campos AvaliacaoMedia e TotalAvaliacoes existem no banco mas não são mais utilizados
*/

/*
COLEÇÃO: notas
ID: pbc_2922503523
Campos:
- id (text, auto, 15 chars, primary key)
- conteudo (text, required)
- autor (relation to users, single, optional)
- livroPK (relation to livro, single, optional)
- avaliacao (number, min: 1, max: 5)
- created (autodate)
- updated (autodate)

Regras de acesso:
- List rule: ""
- View rule: ""
- Create rule: ""
- Update rule: ""
- Delete rule: ""
*/

/*
COLEÇÕES SISTEMA (geradas automaticamente pelo PocketBase):

_superusers (pbc_3142635823)
- Coleção de super usuários do sistema

_authOrigins (pbc_4275539003)
- Controle de origens de autenticação

_externalAuths (pbc_2281828961)
- Autenticações externas (OAuth, etc.)

_mfas (pbc_2279338944)
- Autenticação multifator

_otps (pbc_1638494021)
- Códigos de verificação temporários
*/

/*
RELACIONAMENTOS:

users.NotasPK -> notas (múltiplas)
listas.autor -> users (única)
listas.livros -> livro (múltiplas)
livro.notafk -> notas (múltiplas)
notas.autor -> users (única)
notas.livroPK -> livro (única)
*/

/*
CONFIGURAÇÕES ESPECIAIS:

users:
- Auth token duration: 7 dias (604800 segundos)
- Password auth habilitado
- Campos de identidade: ["email"]
- Avatar aceita apenas arquivos .webp

livro:
- ISBN tem índice único
- AvaliacaoMedia e TotalAvaliacoes vêm da API do Google Books
- Autor e Capa são buscados dinamicamente via API

listas:
- Suporta listas públicas e privadas
- Apenas o autor pode editar/deletar suas listas
- Pode visualizar listas públicas ou próprias

notas:
- Sistema de avaliação de 1 a 5 estrelas
- Vinculada a usuário e livro
- Pode ser usada para reviews/comentários
*/
