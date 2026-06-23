# CLAUDE.md — Backend Tem Negócios

## Banco de dados — regras obrigatórias

### Conexão
- Módulo único: `src/config/db.js` — TODOS os arquivos importam daqui.
- NUNCA criar `new Pool()` ou `new Client()` fora de `src/config/db.js`.
- NUNCA chamar `db.end()` em controllers, middleware ou services — apenas em scripts standalone (`scripts/`).

### Por que os erros de conexão eram intermitentes
O Supabase usa PgBouncer (Session Pooler na porta 5432). O PgBouncer encerra conexões idle
no servidor após ~5 minutos. Sem `keepAlive: true` e sem `idleTimeoutMillis` adequado, o pool
mantinha referências "zumbis" — conexões que o pool julgava vivas mas o servidor já havia encerrado.
A próxima query nessa conexão recebia `connection terminated unexpectedly`. Como a escolha da conexão
no pool é aleatória, o erro era intermitente.

Sem `connectionTimeoutMillis`, requisições ficavam travadas indefinidamente quando o pool estava
esgotado (o `dashboard.controller.js` usa `Promise.all` com 7 queries simultâneas).

### Porta 5432 vs 6543
- **5432** = Session Pooler → suporta prepared statements → usar com `pg.Pool` ✅
- **6543** = Transaction Pooler → NÃO suporta prepared statements → incompatível com `pg.Pool` ❌
- Connection string atual usa **5432** — não mudar sem revisar todo o uso de prepared statements.

---

## Stack

- Node.js + Express, porta 3001
- PostgreSQL via `pg` driver (`$1, $2, ...` — NÃO MySQL)
- Supabase PostgreSQL (projeto `quaapdqlxzxksnsxjlbf`)
- JWT (8h) com campo `role` mapeado de `usuarios.perfil`
- Multer para uploads locais em `public/uploads/`

## Colunas críticas (não confundir)

| Tabela | Coluna real | Alias no JWT/API |
|--------|-------------|------------------|
| `usuarios` | `perfil` | `role` |
| `usuarios` | `status` ('ativo'/'inativo') | `ativo` (boolean convertido) |
| `tenants` | `status` ('ativa'/'bloqueada'/'suspensa'/'cancelada') | — |

## schema.sql — AVISO CRÍTICO

- `backend/schema.sql` **pode estar desatualizado** em relação ao banco real.
- **Nunca** basear ALTER TABLE ou migrações no schema.sql.
- Antes de qualquer mudança estrutural, sempre verificar o banco real:
  ```sql
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = '<tabela>'
  ORDER BY ordinal_position;
  ```
- Exemplos de divergências já encontradas:
  - `clientes` no schema.sql tinha 8 colunas; banco real tinha colunas extras e nomes diferentes
  - `imoveis` tinha `proprietario_id NOT NULL` no banco real, ausente no schema.sql
  - `imoveis.finalidade` tem CHECK constraint `('venda','locacao')` não documentada no schema.sql

## Criptografia de CPF

- `clientes.cpf` é armazenado criptografado com AES-256-GCM (via `src/utils/cripto.js`).
- CPF é normalizado antes de criptografar: somente dígitos (sem máscara).
- Busca por CPF usa match exato no ciphertext determinístico — não ILIKE.
- `ENCRYPTION_KEY` (64 chars hex) deve estar no `.env` — sem ela, qualquer operação de cliente falha.
- CPFs legados em texto puro continuam funcionando: `descriptografar` retorna o valor como-está se não começa com `enc:`.
- Tamanho da coluna: `VARCHAR(255)` — o ciphertext tem ~100 chars.

## CORS em produção

- `server.js` lê `process.env.FRONTEND_URL` para definir a origem permitida pelo CORS.
- Sem `FRONTEND_URL` definido no ambiente de produção, o valor cai para `http://localhost:5173`
  e o frontend hospedado receberá erro `CORS policy: No 'Access-Control-Allow-Origin'`.
- **Regra**: ao fazer deploy, sempre definir `FRONTEND_URL=https://<dominio-do-frontend>` (sem barra final).
- Ver `.env.example` para documentação da variável.

---

## Admin padrão
- Email: `admin@temnegocios.com.br` / Senha: `admin@123`
- Segundo acesso: `felipedelyra@gmail.com` / Senha: `admin@123`
- Tenant id=1 "Tem Negócios - Tupã" (status=`'ativa'`)
