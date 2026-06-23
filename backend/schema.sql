-- ============================================================
-- Tem Negócios — Schema PostgreSQL (Supabase)
-- Execute este arquivo no SQL Editor do Supabase
--
-- AVISO: Este arquivo é referência para novos ambientes.
-- O banco de produção (Supabase) é a fonte de verdade.
-- Antes de qualquer ALTER TABLE, conferir com:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = '<tabela>';
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tenants (Franquias) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id                   SERIAL PRIMARY KEY,
  nome_fantasia        VARCHAR(200) NOT NULL,
  razao_social         VARCHAR(200),
  cnpj                 VARCHAR(20) UNIQUE,
  email                VARCHAR(200),
  telefone             VARCHAR(30),
  cep                  VARCHAR(10),
  endereco             VARCHAR(200),
  numero               VARCHAR(20),
  complemento          VARCHAR(100),
  bairro               VARCHAR(100),
  cidade               VARCHAR(100),
  estado               CHAR(2),
  responsavel_nome     VARCHAR(200),
  responsavel_email    VARCHAR(200),
  responsavel_telefone VARCHAR(30),
  status               VARCHAR(20) NOT NULL DEFAULT 'ativo',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Usuários ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome         VARCHAR(200) NOT NULL,
  email        VARCHAR(200) NOT NULL,
  senha_hash   VARCHAR(200) NOT NULL,
  role         VARCHAR(50)  NOT NULL DEFAULT 'corretor',
  telefone     VARCHAR(30),
  creci        VARCHAR(50),
  ativo        BOOLEAN NOT NULL DEFAULT true,
  ultimo_login TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_email_tenant ON usuarios(tenant_id, email);

-- ── Reset de senha ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token      VARCHAR(200) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Imóveis ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS imoveis (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  titulo           VARCHAR(300) NOT NULL,
  tipo             VARCHAR(50),
  finalidade       VARCHAR(50)  NOT NULL DEFAULT 'Venda',
  valor            NUMERIC(15,2),
  valor_negociacao NUMERIC(15,2),
  area_total       NUMERIC(10,2),
  area_util        NUMERIC(10,2),
  quartos          SMALLINT,
  banheiros        SMALLINT,
  vagas            SMALLINT,
  cep              VARCHAR(10),
  endereco         VARCHAR(200),
  numero           VARCHAR(20),
  complemento      VARCHAR(100),
  bairro           VARCHAR(100),
  cidade           VARCHAR(100),
  estado           CHAR(2),
  descricao        TEXT,
  status           VARCHAR(30) NOT NULL DEFAULT 'disponivel',
  destaque         BOOLEAN NOT NULL DEFAULT false,
  fotos            JSONB NOT NULL DEFAULT '[]',
  corretor_id      INTEGER REFERENCES usuarios(id),
  captador_id      INTEGER REFERENCES usuarios(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Financeiro (receitas e despesas) ─────────────────────────
CREATE TABLE IF NOT EXISTS financeiro (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo             VARCHAR(20) NOT NULL CHECK (tipo IN ('receita','despesa')),
  categoria        VARCHAR(50),
  descricao        VARCHAR(300) NOT NULL,
  valor            NUMERIC(15,2) NOT NULL,
  data_competencia DATE,
  data_vencimento  DATE,
  data_pagamento   DATE,
  status_pagamento VARCHAR(20) NOT NULL DEFAULT 'pendente',
  observacoes      TEXT,
  usuario_id       INTEGER REFERENCES usuarios(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Propostas ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS propostas (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  imovel_id        INTEGER REFERENCES imoveis(id),
  corretor_id      INTEGER REFERENCES usuarios(id),
  tipo             VARCHAR(20) NOT NULL DEFAULT 'venda',
  cliente_nome     VARCHAR(200) NOT NULL,
  cliente_email    VARCHAR(200),
  cliente_telefone VARCHAR(30),
  valor_ofertado   NUMERIC(15,2),
  valor_entrada    NUMERIC(15,2),
  condicoes        TEXT,
  status           VARCHAR(30) NOT NULL DEFAULT 'pendente',
  observacoes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Contratos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contratos (
  id                  SERIAL PRIMARY KEY,
  tenant_id           INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  imovel_id           INTEGER REFERENCES imoveis(id),
  proposta_id         INTEGER REFERENCES propostas(id),
  corretor_id         INTEGER REFERENCES usuarios(id),
  tipo                VARCHAR(30) NOT NULL DEFAULT 'aluguel',
  cliente_nome        VARCHAR(200) NOT NULL,
  cliente_cpf         VARCHAR(20),
  cliente_email       VARCHAR(200),
  cliente_telefone    VARCHAR(30),
  valor_mensal        NUMERIC(15,2),
  valor_total         NUMERIC(15,2),
  comissao_percentual NUMERIC(5,2),
  data_inicio         DATE,
  data_fim            DATE,
  data_assinatura     DATE,
  status              VARCHAR(30) NOT NULL DEFAULT 'ativo',
  observacoes         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Agenda ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agenda (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  usuario_id       INTEGER REFERENCES usuarios(id),
  imovel_id        INTEGER REFERENCES imoveis(id),
  titulo           VARCHAR(300) NOT NULL,
  tipo             VARCHAR(30) NOT NULL DEFAULT 'visita',
  data_hora        TIMESTAMPTZ NOT NULL,
  duracao_min      INTEGER NOT NULL DEFAULT 60,
  cliente_nome     VARCHAR(200),
  cliente_telefone VARCHAR(30),
  status           VARCHAR(30) NOT NULL DEFAULT 'agendado',
  observacoes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tarefas ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tarefas (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  criador_id     INTEGER REFERENCES usuarios(id),
  responsavel_id INTEGER REFERENCES usuarios(id),
  titulo         VARCHAR(300) NOT NULL,
  descricao      TEXT,
  prioridade     VARCHAR(20) NOT NULL DEFAULT 'media',
  status         VARCHAR(30) NOT NULL DEFAULT 'pendente',
  data_prazo     DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Comissões ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comissoes (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  corretor_id      INTEGER REFERENCES usuarios(id),
  imovel_id        INTEGER REFERENCES imoveis(id),
  contrato_id      INTEGER REFERENCES contratos(id),
  tipo             VARCHAR(30) NOT NULL DEFAULT 'venda',
  valor_negocio    NUMERIC(15,2),
  percentual       NUMERIC(5,2),
  valor_comissao   NUMERIC(15,2),
  data_competencia DATE,
  data_pagamento   DATE,
  status           VARCHAR(20) NOT NULL DEFAULT 'pendente',
  observacoes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Vistorias ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vistorias (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  imovel_id      INTEGER REFERENCES imoveis(id),
  contrato_id    INTEGER REFERENCES contratos(id),
  responsavel_id INTEGER REFERENCES usuarios(id),
  tipo           VARCHAR(30) NOT NULL DEFAULT 'entrada',
  data_vistoria  DATE,
  status         VARCHAR(20) NOT NULL DEFAULT 'agendada',
  laudo          TEXT,
  observacoes    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Temporadas ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS temporadas (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  imovel_id        INTEGER REFERENCES imoveis(id),
  hospede_nome     VARCHAR(200) NOT NULL,
  hospede_email    VARCHAR(200),
  hospede_telefone VARCHAR(30),
  hospede_cpf      VARCHAR(20),
  data_inicio      DATE,
  data_fim         DATE,
  valor_diaria     NUMERIC(15,2),
  valor_total      NUMERIC(15,2),
  taxa_limpeza     NUMERIC(15,2) NOT NULL DEFAULT 0,
  num_hospedes     INTEGER NOT NULL DEFAULT 1,
  status           VARCHAR(30) NOT NULL DEFAULT 'reservado',
  plataforma       VARCHAR(50),
  observacoes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Clientes ─────────────────────────────────────────────────
-- CPF é armazenado criptografado (AES-256-GCM via utils/cripto.js).
-- Busca por CPF usa match exato no ciphertext determinístico.
CREATE TABLE IF NOT EXISTS clientes (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome         VARCHAR(200) NOT NULL,
  cpf          VARCHAR(255),
  email        VARCHAR(200),
  telefone     VARCHAR(30),
  tipo         VARCHAR(30)  NOT NULL DEFAULT 'comprador',
  cep          VARCHAR(10),
  endereco     VARCHAR(300),
  cidade       VARCHAR(100),
  estado       CHAR(2),
  observacoes  TEXT,
  status       VARCHAR(20)  NOT NULL DEFAULT 'ativo',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Notificações ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificacoes (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo       VARCHAR(30) NOT NULL DEFAULT 'sistema',
  titulo     VARCHAR(300) NOT NULL,
  mensagem   TEXT,
  link       VARCHAR(200),
  lida       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Documentos ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documentos (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  usuario_id  INTEGER REFERENCES usuarios(id),
  imovel_id   INTEGER REFERENCES imoveis(id),
  contrato_id INTEGER REFERENCES contratos(id),
  nome        VARCHAR(300) NOT NULL,
  tipo        VARCHAR(50) NOT NULL DEFAULT 'outro',
  url         TEXT NOT NULL,
  tamanho     INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tenant padrão + admin ────────────────────────────────────
-- Senha: Admin@123  (bcrypt hash)
INSERT INTO tenants (nome_fantasia, razao_social, cidade, estado, status)
VALUES ('Matriz', 'Tem Negócios Matriz Ltda', 'São Paulo', 'SP', 'ativo')
ON CONFLICT DO NOTHING;

INSERT INTO usuarios (tenant_id, nome, email, senha_hash, role)
VALUES (
  1,
  'Administrador',
  'admin@temnegocios.com.br',
  '$2a$10$GoifXw5mdiIF2V6d0hJKC.PIuGk0X5U26hRoh6MkUBovoJQ5rfLZq',
  'administrador_matriz'
) ON CONFLICT DO NOTHING;
