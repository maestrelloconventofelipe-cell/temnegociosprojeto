require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const db = require('../src/config/db')

async function main() {
  console.log('=== Migration: ampliar clientes.cpf para VARCHAR(255) ===\n')

  const { rows } = await db.query(`
    SELECT character_maximum_length FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'cpf'
  `)

  if (!rows.length) {
    console.log('⚠ Coluna cpf não existe em clientes.')
    await db.end?.(); process.exit(0)
  }

  const atual = rows[0].character_maximum_length
  console.log(`Tamanho atual de clientes.cpf: VARCHAR(${atual})`)

  if (atual >= 255) {
    console.log('✓ Já está com tamanho suficiente — nada a fazer.')
    await db.end?.(); process.exit(0)
  }

  await db.query(`ALTER TABLE clientes ALTER COLUMN cpf TYPE VARCHAR(255)`)
  console.log('✅ clientes.cpf agora é VARCHAR(255) — suporta CPF criptografado (AES-256-GCM).')

  await db.end?.()
  process.exit(0)
}

main().catch(err => { console.error('ERRO:', err.message); process.exit(1) })
