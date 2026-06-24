const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const crypto = require('crypto')
const db     = require('../config/db')
const { enviarResetSenha } = require('../services/email.service')

async function login(req, res) {
  const { tenant_id, email, senha } = req.body
  if (!tenant_id || !email || !senha) {
    return res.status(400).json({ erro: 'Franquia, email e senha são obrigatórios.' })
  }
  try {
    const { rows: tenants } = await db.query(
      'SELECT id, nome_fantasia, status FROM tenants WHERE id = $1',
      [tenant_id]
    )
    if (!tenants.length || tenants[0].status !== 'ativa') {
      return res.status(403).json({ erro: 'Franquia inativa ou não encontrada.' })
    }

    const { rows: users } = await db.query(
      `SELECT * FROM usuarios WHERE tenant_id = $1 AND email = $2 AND status = 'ativo'`,
      [tenant_id, email]
    )
    if (!users.length) return res.status(401).json({ erro: 'Credenciais inválidas.' })

    const user = users[0]
    if (!user.senha_hash) return res.status(401).json({ erro: 'Credenciais inválidas.' })
    const ok = await bcrypt.compare(senha, user.senha_hash)
    if (!ok) return res.status(401).json({ erro: 'Credenciais inválidas.' })

    await db.query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1', [user.id]).catch(() => {})

    const payload = {
      user_id:     user.id,
      tenant_id:   user.tenant_id,
      role:        user.perfil,
      nome:        user.nome,
      tenant_nome: tenants[0].nome_fantasia,
    }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' })

    res.json({
      token,
      user: {
        id:          user.id,
        nome:        user.nome,
        email:       user.email,
        role:        user.perfil,
        tenant_id:   user.tenant_id,
        tenant_nome: tenants[0].nome_fantasia,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro interno no servidor.' })
  }
}

async function me(req, res) {
  res.json({ user: req.user, tenant: req.tenant })
}

async function esquecerSenha(req, res) {
  const { email, tenant_id } = req.body
  if (!email || !tenant_id) return res.status(400).json({ erro: 'E-mail e franquia são obrigatórios.' })

  const MSG = { mensagem: 'Se o e-mail existir, você receberá as instruções em breve.' }
  try {
    const { rows } = await db.query(
      'SELECT id, nome, email FROM usuarios WHERE email = $1 AND tenant_id = $2 AND ativo = true',
      [email, Number(tenant_id)]
    )
    if (!rows.length) return res.json(MSG)

    const user  = rows[0]
    const token = crypto.randomBytes(32).toString('hex')
    const expira = new Date(Date.now() + 3600000)

    await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id])
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)',
      [user.id, token, expira]
    )
    await enviarResetSenha(user.email, user.nome, token)
    res.json(MSG)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao processar solicitação.' })
  }
}

async function resetarSenha(req, res) {
  const { token, nova_senha } = req.body
  if (!token || !nova_senha) return res.status(400).json({ erro: 'Token e nova senha são obrigatórios.' })
  // Mínimo 12 chars com maiúscula, minúscula e número
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/.test(nova_senha)) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 12 caracteres, incluindo maiúsculas, minúsculas e números.' })
  }

  try {
    const { rows } = await db.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
      [token]
    )
    if (!rows.length) return res.status(400).json({ erro: 'Link inválido ou expirado.' })

    const reg  = rows[0]
    const hash = await bcrypt.hash(nova_senha, 10)

    await db.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [hash, reg.user_id])
    await db.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [reg.id])

    res.json({ mensagem: 'Senha redefinida com sucesso.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao redefinir senha.' })
  }
}

module.exports = { login, me, esquecerSenha, resetarSenha }
