require('dotenv').config()
const { Pool } = require('pg')

async function testar(label, url) {
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 6000 })
  try {
    const r = await pool.query('SELECT current_database() AS db, current_user AS usr')
    console.log(label + ': CONECTOU! db=' + r.rows[0].db + ' user=' + r.rows[0].usr)
  } catch(e) {
    console.log(label + ': ERRO - ' + e.message.split('\n')[0])
  }
  await pool.end().catch(() => {})
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL nao definida.')
  process.exit(1)
}

testar('Supabase DATABASE_URL', process.env.DATABASE_URL).then(() => process.exit(0))
