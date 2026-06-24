require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const db     = require('../src/config/db')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

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
  const EMAIL_ADMIN = process.env.ADMIN_EMAIL || 'admin@temnegociosimob.com.br'

  const { rows: admins } = await db.query(
    "SELECT id, email, perfil AS role FROM usuarios WHERE perfil = 'administrador_matriz' LIMIT 5"
  )
  console.log('Admins existentes:', admins)

  if (admins.length === 0) {
    // Gera senha aleatória segura — exibida UMA vez no console
    const senha = (process.env.ADMIN_SEED_PASSWORD || (
      crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) + 'Aa1!'
    ))
    const hash = await bcrypt.hash(senha, 10)
    const { rows } = await db.query(`
      INSERT INTO usuarios (tenant_id, nome, email, senha_hash, perfil, status)
      VALUES (1, 'Administrador Matriz', $1, $2, 'administrador_matriz', 'ativo')
      ON CONFLICT (email, tenant_id) DO UPDATE
        SET senha_hash=$2, status='ativo', perfil='administrador_matriz'
      RETURNING id, email
    `, [EMAIL_ADMIN, hash])
    console.log('Admin criado:', rows[0])
    console.log('\n╔══════════════════════════════════════════════╗')
    console.log(`║  📧 Login : ${EMAIL_ADMIN}`)
    console.log(`║  🔑 Senha : ${senha}`)
    console.log('║  ⚠️  Guarde esta senha — não será exibida novamente!')
    console.log('╚══════════════════════════════════════════════╝\n')
  } else {
    console.log(`ℹ️  Admin "${admins[0].email}" já existe. Senha não alterada.`)
    console.log('   Para redefinir a senha, use a funcionalidade de reset no sistema.')
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

  const { rows: users } = await db.query('SELECT id, email, perfil, tenant_id, status FROM usuarios ORDER BY id')
  console.log('\n=== USUÁRIOS ===')
  console.table(users)

  console.log('\n✅ Seed concluído!')
  console.log('🏙️  Franquia: Tem Negócios - Tupã')

  await db.end?.()
  process.exit(0)
}

main().catch(err => { console.error('ERRO:', err); process.exit(1) })
