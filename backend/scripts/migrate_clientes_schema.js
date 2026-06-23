require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const db = require('../src/config/db')

async function main() {
  console.log('=== Migration: ajustar tabela clientes para bater com o controller ===\n')

  // Verifica estado atual
  const { rows: cols } = await db.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clientes'
    ORDER BY ordinal_position
  `)
  console.log('Colunas atuais:', cols.map(c => c.column_name).join(', '))

  // Adiciona colunas que o controller espera mas que não existem no banco
  const alterations = [
    `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cpf        VARCHAR(20)`,
    `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo       VARCHAR(30)  DEFAULT 'comprador'`,
    `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cep        VARCHAR(10)`,
    `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS endereco   VARCHAR(300)`,
    `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cidade     VARCHAR(100)`,
    `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS estado     VARCHAR(2)`,
    `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS observacoes TEXT`,
    `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS status     VARCHAR(20)  DEFAULT 'ativo'`,
    `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ  DEFAULT NOW()`,
  ]

  for (const sql of alterations) {
    await db.query(sql)
    const col = sql.match(/ADD COLUMN IF NOT EXISTS (\w+)/)[1]
    console.log(`  ✓ ADD COLUMN IF NOT EXISTS ${col}`)
  }

  // Copia dados legados: documento → cpf, perfil_principal → tipo
  const { rowCount: r1 } = await db.query(`
    UPDATE clientes SET cpf = documento
    WHERE cpf IS NULL AND documento IS NOT NULL AND documento <> ''
  `)
  console.log(`\n  Copiado documento→cpf em ${r1} linha(s)`)

  const { rowCount: r2 } = await db.query(`
    UPDATE clientes SET tipo = perfil_principal
    WHERE tipo IS NULL AND perfil_principal IS NOT NULL AND perfil_principal <> ''
  `)
  console.log(`  Copiado perfil_principal→tipo em ${r2} linha(s)`)

  // Confirma resultado final
  const { rows: final } = await db.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clientes'
    ORDER BY ordinal_position
  `)
  console.log('\nColunas finais:', final.map(c => c.column_name).join(', '))
  console.log('\n✅ Migration clientes concluída.')

  await db.end?.()
  process.exit(0)
}

main().catch(err => { console.error('ERRO:', err.message); process.exit(1) })
