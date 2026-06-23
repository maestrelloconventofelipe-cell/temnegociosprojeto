require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const db = require('../src/config/db')

async function main() {
  console.log('=== Migration: tornar proprietario_id nullable em imoveis ===\n')

  // Verificar constraint atual
  const { rows } = await db.query(`
    SELECT is_nullable FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'imoveis' AND column_name = 'proprietario_id'
  `)

  if (!rows.length) {
    console.log('⚠ Coluna proprietario_id não existe em imoveis — nada a fazer.')
    await db.end?.(); process.exit(0)
  }

  if (rows[0].is_nullable === 'YES') {
    console.log('✓ proprietario_id já é nullable — nada a fazer.')
    await db.end?.(); process.exit(0)
  }

  await db.query(`ALTER TABLE imoveis ALTER COLUMN proprietario_id DROP NOT NULL`)
  console.log('✅ proprietario_id agora é nullable.')
  console.log('   (Campo legado não utilizado pelo controller; sem perda de dados.)')

  await db.end?.()
  process.exit(0)
}

main().catch(err => { console.error('ERRO:', err.message); process.exit(1) })
