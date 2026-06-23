const db = require('../config/db')
const { notificar } = require('../services/notificacoes.service')

async function listar(req, res) {
  const tenantId = req.tenant.id
  const { busca, tipo, status } = req.query
  let sql = 'SELECT * FROM clientes WHERE tenant_id=$1'
  const p = [tenantId]

  if (tipo)   { sql += ` AND tipo=$${p.length+1}`;   p.push(tipo) }
  if (status) { sql += ` AND status=$${p.length+1}`; p.push(status) }
  if (busca)  {
    sql += ` AND (nome ILIKE $${p.length+1} OR email ILIKE $${p.length+1} OR cpf ILIKE $${p.length+1})`
    p.push(`%${busca}%`)
  }

  sql += ' ORDER BY nome ASC'
  try {
    const { rows } = await db.query(sql, p)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar clientes.', ...(process.env.NODE_ENV !== 'production' && { detalhe: err.message, codigo: err.code }) })
  }
}

async function buscar(req, res) {
  const tenantId = req.tenant.id
  try {
    const { rows } = await db.query(
      'SELECT * FROM clientes WHERE id=$1 AND tenant_id=$2',
      [req.params.id, tenantId]
    )
    if (!rows.length) return res.status(404).json({ erro: 'Cliente não encontrado.' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao buscar cliente.', ...(process.env.NODE_ENV !== 'production' && { detalhe: err.message, codigo: err.code }) })
  }
}

async function criar(req, res) {
  const tenantId = req.tenant.id
  const { nome, cpf, email, telefone, tipo, cep, endereco, cidade, estado, observacoes, status } = req.body
  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório.' })

  try {
    const { rows } = await db.query(
      `INSERT INTO clientes
         (tenant_id, nome, cpf, email, telefone, tipo, cep, endereco, cidade, estado, observacoes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        tenantId, nome, cpf||null, email||null, telefone||null,
        tipo||'comprador', cep||null, endereco||null, cidade||null,
        estado||null, observacoes||null, status||'ativo',
      ]
    )
    const id = rows[0].id
    notificar({
      tenant_id: tenantId,
      usuario_id: null,
      tipo: 'sistema',
      titulo: `Novo cliente cadastrado: ${nome}`,
      mensagem: tipo ? `Tipo: ${tipo}` : null,
      link: '/clientes',
    })
    res.status(201).json({ id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao cadastrar cliente.', ...(process.env.NODE_ENV !== 'production' && { detalhe: err.message, codigo: err.code }) })
  }
}

async function atualizar(req, res) {
  const tenantId = req.tenant.id
  const { nome, cpf, email, telefone, tipo, cep, endereco, cidade, estado, observacoes, status } = req.body
  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório.' })

  try {
    const result = await db.query(
      `UPDATE clientes SET
         nome=$1, cpf=$2, email=$3, telefone=$4, tipo=$5,
         cep=$6, endereco=$7, cidade=$8, estado=$9,
         observacoes=$10, status=$11, updated_at=NOW()
       WHERE id=$12 AND tenant_id=$13`,
      [
        nome, cpf||null, email||null, telefone||null, tipo||'comprador',
        cep||null, endereco||null, cidade||null, estado||null,
        observacoes||null, status||'ativo',
        req.params.id, tenantId,
      ]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Cliente não encontrado.' })
    res.json({ mensagem: 'Cliente atualizado.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao atualizar cliente.', ...(process.env.NODE_ENV !== 'production' && { detalhe: err.message, codigo: err.code }) })
  }
}

async function remover(req, res) {
  const tenantId = req.tenant.id
  try {
    const result = await db.query(
      'DELETE FROM clientes WHERE id=$1 AND tenant_id=$2',
      [req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Cliente não encontrado.' })
    res.json({ mensagem: 'Cliente removido.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao remover cliente.', ...(process.env.NODE_ENV !== 'production' && { detalhe: err.message, codigo: err.code }) })
  }
}

module.exports = { listar, buscar, criar, atualizar, remover }
