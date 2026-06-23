require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const db     = require('../src/config/db')
const bcrypt = require('bcryptjs')

// Situação atual:
// auth.users:
//   4ac6c3bd → admin@temnegocios.com.br  (sem registro em public.usuarios)
//   49ab60ce → felipedelyra@gmail.com    (tem registro mas com email trocado)
//
// public.usuarios:
//   49ab60ce → email = admin@temnegocios.com.br  (email errado: foi trocado pela migração anterior)
//
// FIX:
//   1. Corrigir UUID 49ab60ce para ter email = felipedelyra@gmail.com (correto)
//   2. Criar registro para UUID 4ac6c3bd com email = admin@temnegocios.com.br

async function main() {
  const SENHA = 'admin@123'
  const hash  = await bcrypt.hash(SENHA, 10)

  // 1. Corrigir email do Felipe (UUID 49ab60ce → felipedelyra@gmail.com)
  const r1 = await db.query(
    `UPDATE usuarios SET email = 'felipedelyra@gmail.com', nome = 'Felipe'
     WHERE id = '49ab60ce-7afa-462d-b61d-d0c6267c2745'`,
  )
  console.log('Email Felipe restaurado:', r1.rowCount, 'linha(s)')

  // 2. Criar conta admin@temnegocios.com.br com UUID correto do Supabase Auth
  const r2 = await db.query(
    `INSERT INTO usuarios (id, tenant_id, nome, email, senha_hash, perfil, status)
     VALUES ('4ac6c3bd-14fd-4920-8da9-4df187b3ef67', 1, 'Administrador Matriz',
             'admin@temnegocios.com.br', $1, 'administrador_matriz', 'ativo')
     ON CONFLICT (id) DO UPDATE
       SET nome = 'Administrador Matriz', email = 'admin@temnegocios.com.br',
           senha_hash = $1, perfil = 'administrador_matriz', status = 'ativo'`,
    [hash]
  )
  console.log('Conta admin criada/atualizada:', r2.rowCount, 'linha(s)')

  // 3. Garantir senha de Felipe também = admin@123
  const r3 = await db.query(
    `UPDATE usuarios SET senha_hash = $1 WHERE id = '49ab60ce-7afa-462d-b61d-d0c6267c2745'`,
    [hash]
  )
  console.log('Senha de Felipe atualizada:', r3.rowCount, 'linha(s)')

  // Verificar resultado final
  const { rows } = await db.query('SELECT id, email, nome, perfil, status FROM usuarios ORDER BY email')
  console.log('\nUSUÁRIOS APÓS FIX:')
  rows.forEach(u => console.log(' -', u.email, '|', u.nome, '|', u.perfil, '|', u.status, '|', u.id))

  console.log('\n✅ Contas restauradas. Senha de ambas: admin@123')

  await db.end?.()
  process.exit(0)
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1) })
