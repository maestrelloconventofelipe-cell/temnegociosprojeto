require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const db     = require('../src/config/db')
const bcrypt = require('bcryptjs')

async function main() {
  console.log('Conectando ao banco...')

  // ──────────────────────────────────────────────────────────────
  // 1. Limpar tenants duplicados / incorretos e garantir Tupã
  // ──────────────────────────────────────────────────────────────
  const { rows: existentes } = await db.query('SELECT id, nome_fantasia, cidade FROM tenants ORDER BY id')
  console.log('Tenants atuais:', existentes)

  // Migrar status legado 'ativo' para 'ativa'
  await db.query(`UPDATE tenants SET status = 'ativa' WHERE status = 'ativo'`)

  // Atualizar id=1 → Matriz Tupã
  await db.query(`
    UPDATE tenants SET
      nome_fantasia = 'Tem Negócios - Tupã',
      razao_social  = 'Tem Negócios Imobiliários Ltda',
      email         = 'matriz@temnegociosimob.com.br',
      cidade        = 'Tupã',
      estado        = 'SP',
      status        = 'ativa',
      updated_at    = NOW()
    WHERE id = 1
  `)
  console.log('Tenant 1 atualizado → Tupã/SP')

  // Remover duplicatas (id > 1) se existirem e não tiverem usuários
  for (const t of existentes.filter(t => t.id > 1)) {
    const { rows: usersCheck } = await db.query('SELECT COUNT(*) AS n FROM usuarios WHERE tenant_id=$1', [t.id])
    if (Number(usersCheck[0].n) === 0) {
      await db.query('DELETE FROM tenants WHERE id=$1', [t.id])
      console.log(`Tenant ${t.id} ("${t.nome_fantasia}") removido (sem usuários).`)
    } else {
      console.log(`Tenant ${t.id} ("${t.nome_fantasia}") mantido (tem ${usersCheck[0].n} usuário(s)).`)
    }
  }

  // ──────────────────────────────────────────────────────────────
  // 2. Verificar / criar usuário administrador_matriz
  // ──────────────────────────────────────────────────────────────
  const EMAIL_ADMIN = 'admin@temnegociosimob.com.br'
  const SENHA_ADMIN = 'Admin@2025'

  const { rows: admins } = await db.query(
    "SELECT id, email, role FROM usuarios WHERE role = 'administrador_matriz' LIMIT 5"
  )
  console.log('Admins existentes:', admins)

  if (admins.length === 0) {
    const hash = await bcrypt.hash(SENHA_ADMIN, 10)
    const { rows } = await db.query(`
      INSERT INTO usuarios (tenant_id, nome, email, senha_hash, role, ativo)
      VALUES (1, 'Administrador Matriz', $1, $2, 'administrador_matriz', true)
      ON CONFLICT (email, tenant_id) DO UPDATE
        SET senha_hash=$2, ativo=true, role='administrador_matriz'
      RETURNING id, email
    `, [EMAIL_ADMIN, hash])
    console.log('Admin criado:', rows[0])
  } else {
    // Atualizar senha do primeiro admin encontrado para garantir acesso
    const hash = await bcrypt.hash(SENHA_ADMIN, 10)
    await db.query(
      'UPDATE usuarios SET senha_hash=$1, ativo=true WHERE id=$2',
      [hash, admins[0].id]
    )
    console.log(`Senha do admin "${admins[0].email}" redefinida para: ${SENHA_ADMIN}`)
  }

  // ──────────────────────────────────────────────────────────────
  // 3. Verificar tabela clientes (criar se não existir)
  // ──────────────────────────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id           SERIAL PRIMARY KEY,
      tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      nome         VARCHAR(200) NOT NULL,
      cpf          VARCHAR(20),
      email        VARCHAR(200),
      telefone     VARCHAR(30),
      tipo         VARCHAR(30) DEFAULT 'comprador',
      cep          VARCHAR(10),
      endereco     VARCHAR(300),
      cidade       VARCHAR(100),
      estado       VARCHAR(2),
      observacoes  TEXT,
      status       VARCHAR(20) DEFAULT 'ativo',
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  console.log('Tabela clientes OK.')

  // ──────────────────────────────────────────────────────────────
  // 5. Resumo
  // ──────────────────────────────────────────────────────────────
  const { rows: tenantsFinal } = await db.query('SELECT id, nome_fantasia, cidade, estado, status FROM tenants ORDER BY id')
  console.log('\n=== TENANTS FINAIS ===')
  console.table(tenantsFinal)

  const { rows: users } = await db.query('SELECT id, email, role, tenant_id, ativo FROM usuarios ORDER BY id')
  console.log('\n=== USUÁRIOS ===')
  console.table(users)

  console.log('\n✅ Seed concluído!')
  console.log(`📧 Login: ${EMAIL_ADMIN}`)
  console.log(`🔑 Senha: ${SENHA_ADMIN}`)
  console.log('🏙️  Franquia: Tem Negócios - Tupã')

  await db.end?.()
  process.exit(0)
}

main().catch(err => { console.error('ERRO:', err); process.exit(1) })
