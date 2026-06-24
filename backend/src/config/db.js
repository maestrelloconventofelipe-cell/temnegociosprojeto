require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // rejectUnauthorized: true em produção — valida o certificado TLS do Supabase.
  // Em dev pode ficar false se o CA não estiver configurado localmente.
  ssl: { rejectUnauthorized: process.env.NODE_ENV === 'production' },

  // Supabase Session Pooler (porta 5432) tem ~5 min de idle timeout server-side.
  // keepAlive + idleTimeoutMillis curto evitam "conexões zumbi" que causam erros intermitentes.
  max:                          10,
  min:                           1,      // mantém 1 conexão warm
  idleTimeoutMillis:        30_000,      // libera idle após 30s (abaixo dos ~5min do PgBouncer)
  connectionTimeoutMillis:  10_000,      // falha rápido em vez de travar indefinidamente
  keepAlive:                  true,
  keepAliveInitialDelayMillis: 10_000,
})

pool.on('error', (err) => console.error('pg pool error:', err.message))

module.exports = pool
