require('dotenv').config()
const db = require('../config/db')

async function run() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS notificacoes (
      id          SERIAL PRIMARY KEY,
      tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      usuario_id  INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      tipo        VARCHAR(50)  NOT NULL DEFAULT 'sistema',
      titulo      VARCHAR(200) NOT NULL,
      mensagem    TEXT,
      link        VARCHAR(200),
      lida        BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_notif_tenant   ON notificacoes(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_notif_usuario  ON notificacoes(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_notif_lida     ON notificacoes(lida);
  `)
  console.log('Tabela notificacoes criada/verificada com sucesso.')
  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
