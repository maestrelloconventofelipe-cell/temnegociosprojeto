const bcrypt = require('bcryptjs')
const db = require('../config/db')

async function listar(req, res) {
  const tenantId = req.tenant.id
  const { role, status } = req.query
  let sql = `
    SELECT id, nome, email, perfil AS role, telefone, creci,
           (status = 'ativo') AS ativo, ultimo_login, created_at
    FROM usuarios WHERE tenant_id = $1
  `
  const p = [tenantId]
  if (role)   { sql += ` AND perfil = $${p.length+1}`;  p.push(role) }
  if (status) { sql += ` AND status = $${p.length+1}`;  p.push(status) }
  sql += ' ORDER BY nome ASC'
  try {
    const { rows } = await db.query(sql, p)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar usuários.' })
  }
}

async function buscar(req, res) {
  const tenantId = req.tenant.id
  try {
    const { rows } = await db.query(
      `SELECT id, nome, email, perfil AS role, telefone, creci, (status = 'ativo') AS ativo
       FROM usuarios WHERE id=$1 AND tenant_id=$2`,
      [req.params.id, tenantId]
    )
    if (!rows.length) return res.status(404).json({ erro: 'Usuário não encontrado.' })
    res.json(rows[0])
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar usuário.' })
  }
}

async function criar(req, res) {
  const tenantId = req.tenant.id
  const { nome, email, senha, role, telefone, creci, ativo = true } = req.body
  if (!nome || !email || !senha || !role) {
    return res.status(400).json({ erro: 'Nome, email, senha e função são obrigatórios.' })
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/.test(senha)) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 12 caracteres, incluindo maiúsculas, minúsculas e números.' })
  }
  try {
    const { rows: dup } = await db.query(
      'SELECT id FROM usuarios WHERE tenant_id=$1 AND email=$2', [tenantId, email]
    )
    if (dup.length) return res.status(409).json({ erro: 'E-mail já cadastrado nesta franquia.' })

    const hash   = await bcrypt.hash(senha, 10)
    const statusV = ativo ? 'ativo' : 'inativo'
    const { rows } = await db.query(
      `INSERT INTO usuarios (tenant_id, nome, email, senha_hash, perfil, telefone, creci, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [tenantId, nome, email, hash, role, telefone||null, creci||null, statusV]
    )
    res.status(201).json({ id: rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar usuário.' })
  }
}

async function atualizar(req, res) {
  const tenantId = req.tenant.id
  const meId    = req.user.user_id
  const alvoId  = req.params.id          // UUID string
  const { nome, email, senha, role, telefone, creci, ativo } = req.body

  if (ativo === false && alvoId === meId) {
    return res.status(400).json({ erro: 'Você não pode desativar sua própria conta.' })
  }

  try {
    const { rows } = await db.query(
      'SELECT id FROM usuarios WHERE id=$1 AND tenant_id=$2', [alvoId, tenantId]
    )
    if (!rows.length) return res.status(404).json({ erro: 'Usuário não encontrado.' })

    if (email) {
      const { rows: dup } = await db.query(
        'SELECT id FROM usuarios WHERE tenant_id=$1 AND email=$2 AND id!=$3', [tenantId, email, alvoId]
      )
      if (dup.length) return res.status(409).json({ erro: 'E-mail já utilizado por outro usuário.' })
    }

    const sets = []; const p = []
    if (nome     !== undefined) { sets.push(`nome=$${p.length+1}`);     p.push(nome) }
    if (email    !== undefined) { sets.push(`email=$${p.length+1}`);    p.push(email) }
    if (role     !== undefined) { sets.push(`perfil=$${p.length+1}`);   p.push(role) }
    if (telefone !== undefined) { sets.push(`telefone=$${p.length+1}`); p.push(telefone||null) }
    if (creci    !== undefined) { sets.push(`creci=$${p.length+1}`);    p.push(creci||null) }
    if (ativo    !== undefined) { sets.push(`status=$${p.length+1}`);   p.push(ativo ? 'ativo' : 'inativo') }
    if (senha) {
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/.test(senha)) {
        return res.status(400).json({ erro: 'A senha deve ter pelo menos 12 caracteres, incluindo maiúsculas, minúsculas e números.' })
      }
      const hash = await bcrypt.hash(senha, 10)
      sets.push(`senha_hash=$${p.length+1}`)
      p.push(hash)
    }
    if (!sets.length) return res.status(400).json({ erro: 'Nenhum campo para atualizar.' })
    p.push(alvoId, tenantId)

    await db.query(
      `UPDATE usuarios SET ${sets.join(', ')} WHERE id=$${p.length-1} AND tenant_id=$${p.length}`,
      p
    )
    res.json({ mensagem: 'Usuário atualizado.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao atualizar usuário.' })
  }
}

async function remover(req, res) {
  const tenantId = req.tenant.id
  const meId    = req.user.user_id
  const alvoId  = req.params.id          // UUID string
  if (alvoId === meId) return res.status(400).json({ erro: 'Você não pode remover sua própria conta.' })
  try {
    const result = await db.query(
      'DELETE FROM usuarios WHERE id=$1 AND tenant_id=$2', [alvoId, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' })
    res.json({ mensagem: 'Usuário removido.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao remover usuário.' })
  }
}

async function atualizarPerfil(req, res) {
  const { user_id } = req.user
  const { nome, telefone } = req.body
  try {
    const { rows } = await db.query(
      'UPDATE usuarios SET nome=$1, telefone=$2 WHERE id=$3 RETURNING nome, telefone',
      [nome, telefone||null, user_id]
    )
    res.json(rows[0])
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar perfil.' })
  }
}

async function alterarSenha(req, res) {
  const { user_id } = req.user
  const { senha_atual, nova_senha } = req.body
  if (!senha_atual || !nova_senha) return res.status(400).json({ erro: 'Campos obrigatórios.' })
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/.test(nova_senha)) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 12 caracteres, incluindo maiúsculas, minúsculas e números.' })
  }
  try {
    const { rows } = await db.query('SELECT senha_hash FROM usuarios WHERE id=$1', [user_id])
    if (!rows.length) return res.status(404).json({ erro: 'Usuário não encontrado.' })
    const ok = await bcrypt.compare(senha_atual, rows[0].senha_hash)
    if (!ok) return res.status(401).json({ erro: 'Senha atual incorreta.' })
    const hash = await bcrypt.hash(nova_senha, 10)
    await db.query('UPDATE usuarios SET senha_hash=$1 WHERE id=$2', [hash, user_id])
    res.json({ mensagem: 'Senha alterada com sucesso.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao alterar senha.' })
  }
}

async function atividade(req, res) {
  const tenantId = req.tenant.id
  try {
    const { rows } = await db.query(
      `SELECT id, nome, email, perfil AS role, creci, ultimo_login, created_at
       FROM usuarios
       WHERE tenant_id = $1
       ORDER BY ultimo_login DESC NULLS LAST, nome ASC`,
      [tenantId]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar atividade dos usuários.' })
  }
}

module.exports = { listar, buscar, criar, atualizar, remover, atualizarPerfil, alterarSenha, atividade }
