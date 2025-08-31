// Estrutura das coleções PocketBase para o sistema de listas de livros
// Baseado no schema atual do banco de dados - Atualizado em 31/08/2025

/*
COLEÇÃO: users (auth collection)
ID: _pb_users_auth_
Campos:
- id (text, auto, 15 chars, primary key, pattern: ^[a-z0-9]+$)
- password (password, hidden, min: 3, required)
- tokenKey (text, hidden, auto, 30-60 chars, pattern: [a-zA-Z0-9]{50})
- email (email, required, unique)
- emailVisibility (bool, optional)
- verified (bool, optional)
- name (text, optional, max: 255)
- avatar (file, optional, webp only, max 1 file)
- NotasPK (relation to notas collection pbc_2922503523, multiple, max: 999)
- created (autodate, onCreate: true, onUpdate: false)
- updated (autodate, onCreate: true, onUpdate: true)

Índices:
- CREATE UNIQUE INDEX `idx_tokenKey__pb_users_auth_` ON `users` (`tokenKey`)
- CREATE UNIQUE INDEX `idx_email__pb_users_auth_` ON `users` (`email`) WHERE `email` != ''

Regras de acesso:
- List rule: ""
- View rule: ""
- Create rule: ""
- Update rule: ""
- Delete rule: ""
- Auth rule: ""
- Auth token duration: 604800 (7 dias)

Configurações de autenticação:
- Password auth habilitado
- Campos de identidade: ["email"]
- OAuth2 desabilitado
- MFA desabilitado
- OTP desabilitado
- Auth alert desabilitado
*/

/*
COLEÇÃO: listas
ID: pbc_4066227054
Campos:
- id (text, auto, 15 chars, primary key, pattern: ^[a-z0-9]+$)
- nome (text, required)
- descricao (text, optional)
- publica (bool, optional)
- autor (relation to users, single, optional)
- livros (relation to livro collection pbc_2280659052, multiple, max: 999)
- created (autodate, onCreate: true, onUpdate: false)
- updated (autodate, onCreate: true, onUpdate: true)

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
- id (text, auto, 15 chars, primary key, pattern: ^[a-z0-9]+$)
- notafk (relation to notas collection pbc_2922503523, multiple, max: 999)
- ISBN (text, required, unique)
- Nome (text, required)
- AvaliacaoMedia (number, optional) - Campo legado, use dados das notas
- TotalAvaliacoes (number, optional) - Campo legado, use dados das notas
- created (autodate, onCreate: true, onUpdate: false)
- updated (autodate, onCreate: true, onUpdate: true)

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
- Avaliações calculadas dinamicamente a partir da coleção notas
*/

/*
COLEÇÃO: notas
ID: pbc_2922503523
Campos:
- id (text, auto, 15 chars, primary key, pattern: ^[a-z0-9]+$)
- conteudo (text, required)
- autor (relation to users, single, optional)
- livroPK (relation to livro collection pbc_2280659052, single, optional)
- avaliacao (number, min: 1, max: 5)
- created (autodate, onCreate: true, onUpdate: false)
- updated (autodate, onCreate: true, onUpdate: true)

Índices:
- CREATE INDEX `idx_ZU7zNqEyN0` ON `notas` (`livro`, `autor`)

Regras de acesso:
- List rule: ""
- View rule: ""
- Create rule: ""
- Update rule: ""
- Delete rule: ""
*/

/*
COLEÇÃO: comentario
ID: pbc_3038893970
Campos:
- id (text, auto, 15 chars, primary key)
- conteudo (editor, rich text)
- autor (relation, single)
- livro (relation, single)
- lista (relation, single)
- nota (relation, single)
- anexos (file, multiple)
- created (autodate)
- updated (autodate)

Regras de acesso: Todas null (sem regras definidas)
*/

/*
COLEÇÃO: comunidade
ID: pbc_910844455
Campos:
- id (text, auto, 15 chars, primary key)
- nome (text)
- administrador (relation, single)
- membros (relation, multiple)
- listas (relation, multiple)
- avatar (file, single)
- descricao (text)
- codigo_convite (text)
- created (autodate)
- updated (autodate)

Regras de acesso: Todas null (sem regras definidas)
*/

/*
COLEÇÃO: conquistas
ID: pbc_2065431590
Campos:
- id (text, auto, 15 chars, primary key)
- nome (text)
- descricao (text)
- icone (file, single)
- created (autodate)
- updated (autodate)

Regras de acesso: Todas null (sem regras definidas)
*/

/*
COLEÇÃO: status
ID: pbc_1276319826
Campos:
- id (text, auto, 15 chars, primary key)
- nome (text)
- usuario (relation, single)
- livro (relation, single)
- created (autodate)
- updated (autodate)

Índices:
- CREATE INDEX `idx_lFOy4zq2ER` ON `status` (`livro`, `nome`)

Regras de acesso: Todas null (sem regras definidas)
*/

/*
COLEÇÃO: tags
ID: pbc_1219621782
Campos:
- id (text, auto, 15 chars, primary key)
- nome (text, unique)
- created (autodate)
- updated (autodate)

Índices:
- CREATE UNIQUE INDEX `idx_0LLx5zwfBo` ON `tags` (`nome`)

Regras de acesso: Todas null (sem regras definidas)
*/

/*
COLEÇÃO: usuario_conquista
ID: pbc_3579964420
Campos:
- id (text, auto, 15 chars, primary key)
- usuario (relation, single)
- conquista (relation, single)
- created (autodate)
- updated (autodate)

Regras de acesso: Todas null (sem regras definidas)
*/

/*
COLEÇÕES SISTEMA (geradas automaticamente pelo PocketBase):

_superusers (pbc_3142635823)
- Coleção de super usuários do sistema
- Auth token duration: 86400 (1 dia)
- Password min: 8 caracteres
- Auth alert habilitado

_authOrigins (pbc_4275539003)
- Controle de origens de autenticação
- Regras: usuário só pode ver/deletar suas próprias origens

_externalAuths (pbc_2281828961)
- Autenticações externas (OAuth, etc.)
- Regras: usuário só pode ver/deletar suas próprias auth externas

_mfas (pbc_2279338944)
- Autenticação multifator
- Regras: usuário só pode ver suas próprias configurações MFA

_otps (pbc_1638494021)
- Códigos de verificação temporários
- Regras: usuário só pode ver seus próprios OTPs
*/

/*
RELACIONAMENTOS PRINCIPAIS:

users.NotasPK -> notas (múltiplas)
listas.autor -> users (única)
listas.livros -> livro (múltiplas)
livro.notafk -> notas (múltiplas)
notas.autor -> users (única)
notas.livroPK -> livro (única)
comentario.autor -> users (única)
comentario.livro -> livro (única)
comentario.lista -> listas (única)
comentario.nota -> notas (única)
comunidade.administrador -> users (única)
comunidade.membros -> users (múltiplas)
comunidade.listas -> listas (múltiplas)
status.usuario -> users (única)
status.livro -> livro (única)
usuario_conquista.usuario -> users (única)
usuario_conquista.conquista -> conquistas (única)
*/

/*
CONFIGURAÇÕES ESPECIAIS:

users:
- Auth token duration: 7 dias (604800 segundos)
- Password auth habilitado
- Campos de identidade: ["email"]
- Avatar aceita apenas arquivos .webp
- OAuth2 mapeamento configurado mas desabilitado

livro:
- ISBN tem índice único
- Integração com API do Google Books para dados externos
- Avaliações calculadas a partir da coleção notas

listas:
- Sistema de visibilidade público/privado
- Apenas o autor pode editar/deletar suas listas
- Suporte a múltiplos livros por lista

notas:
- Sistema de avaliação de 1 a 5 estrelas
- Vinculada a usuário e livro
- Índice composto para otimizar consultas

tags:
- Nome único garantido por índice
- Sistema de categorização extensível

status:
- Controle de status de leitura por usuário/livro
- Índice otimizado para consultas

Sistema de conquistas:
- conquistas: definição das conquistas disponíveis
- usuario_conquista: associação usuário-conquista com data

Sistema de comunidades:
- Suporte a administrador e múltiplos membros
- Código de convite para entrada
- Listas compartilhadas na comunidade
*/
