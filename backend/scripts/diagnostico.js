require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const db = require('../src/config/db')

async function main() {
  // Auth users
  const authUsers = await db.query('SELECT id, email, created_at FROM auth.users ORDER BY created_at')
  console.log('\nAUTH.USERS (' + authUsers.rowCount + '):')
  authUsers.rows.forEach(u => console.log(' -', u.id, u.email))

  // Disable RLS separately
  await db.query('SET row_security = off')

  // Public usuarios
  const pubUsers = await db.query('SELECT id, email, nome, perfil, status, tenant_id FROM usuarios ORDER BY created_at')
  console.log('\nPUBLIC.USUARIOS (' + pubUsers.rowCount + '):')
  pubUsers.rows.forEach(u => console.log(' -', u.id, u.email, u.nome, u.perfil, u.status, 'tenant='+u.tenant_id))

  // Constraints
  const constraints = await db.query(`
    SELECT conname, contype, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = 'usuarios'::regclass
    ORDER BY contype
  `)
  console.log('\nCONSTRAINTS DE USUARIOS:')
  constraints.rows.forEach(c => console.log(' -', c.conname, '|', c.def))

  // Imoveis count
  const imov = await db.query('SELECT COUNT(*) FROM imoveis')
  console.log('\nIMOVEIS (sem RLS):', imov.rows[0].count)

  await db.end?.()
  process.exit(0)
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1) })
