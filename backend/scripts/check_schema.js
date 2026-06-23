require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const db = require('../src/config/db')

async function main() {
  const tables = ['tenants','usuarios','imoveis','clientes','financeiro','agenda']
  for (const t of tables) {
    try {
      const { rows } = await db.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_name=$1 ORDER BY ordinal_position`, [t]
      )
      console.log(`\n=== ${t.toUpperCase()} ===`)
      if (rows.length === 0) console.log('  (tabela não existe)')
      else rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}) ${r.is_nullable === 'NO' ? 'NOT NULL' : ''}${r.column_default ? ' DEFAULT ' + r.column_default : ''}`))
    } catch (e) { console.log(`\n=== ${t.toUpperCase()} === ERRO: ${e.message}`) }
  }
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
