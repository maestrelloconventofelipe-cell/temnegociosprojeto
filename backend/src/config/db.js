require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },

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
