const db = require('../config/db')

async function listar(req, res) {
  try {
    const { status, tipo_franquia } = req.query
    let sql = 'SELECT *, nome_fantasia AS nome FROM tenants WHERE 1=1'
    const p = []
    if (status)        { sql += ` AND status = $${p.length+1}`; p.push(status) }
    if (tipo_franquia) { sql += ` AND tipo_franquia = $${p.length+1}`; p.push(tipo_franquia) }
    sql += ' ORDER BY nome_fantasia'
    const { rows } = await db.query(sql, p)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar franquias.' })
  }
}

async function listarPublico(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT id, nome_fantasia AS nome, cidade, estado
       FROM tenants WHERE status NOT IN ('bloqueada','cancelada','suspensa') ORDER BY nome_fantasia`
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar franquias.' })
  }
}

async function buscar(req, res) {
  try {
    const { rows } = await db.query('SELECT * FROM tenants WHERE id = $1', [req.params.id])
    if (!rows.length) return res.status(404).json({ erro: 'Franquia não encontrada.' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar franquia.' })
  }
}

async function criar(req, res) {
  const {
    nome_fantasia, razao_social, cnpj, email, telefone,
    cep, endereco, logradouro, numero, complemento, bairro, cidade, estado, uf, status,
  } = req.body
  if (!nome_fantasia) return res.status(400).json({ erro: 'Nome fantasia é obrigatório.' })

  const endFinal = endereco || logradouro || null
  const estFinal = estado   || uf         || null

  try {
    const { rows } = await db.query(
      `INSERT INTO tenants
        (nome_fantasia, razao_social, cnpj, email, telefone,
         cep, endereco, numero, complemento, bairro, cidade, estado, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [
        nome_fantasia, razao_social||null, cnpj||null, email||null, telefone||null,
        cep||null, endFinal, numero||null, complemento||null,
        bairro||null, cidade||null, estFinal, status||'ativa',
      ]
    )
    res.status(201).json({ id: rows[0].id })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ erro: 'CNPJ já cadastrado.' })
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar franquia.' })
  }
}

async function atualizar(req, res) {
  const {
    nome_fantasia, razao_social, cnpj, email, telefone,
    cep, endereco, logradouro, numero, complemento, bairro, cidade, estado, uf, status,
  } = req.body

  const cols = {
    nome_fantasia, razao_social, cnpj, email, telefone, cep, numero, complemento, bairro, cidade, status,
    endereco: endereco || logradouro || undefined,
    estado:   estado   || uf         || undefined,
  }
  const sets = []; const p = []
  for (const [k, v] of Object.entries(cols)) {
    if (v !== undefined) { sets.push(`${k} = $${p.length+1}`); p.push(v) }
  }
  if (!sets.length) return res.json({ mensagem: 'Nada para atualizar.' })
  sets.push(`updated_at = NOW()`)
  p.push(req.params.id)

  try {
    const result = await db.query(
      `UPDATE tenants SET ${sets.join(', ')} WHERE id = $${p.length}`,
      p
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Franquia não encontrada.' })
    res.json({ mensagem: 'Franquia atualizada.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao atualizar franquia.' })
  }
}

async function alterarStatus(req, res) {
  const { status } = req.body
  try {
    const result = await db.query(
      'UPDATE tenants SET status=$1, updated_at=NOW() WHERE id=$2',
      [status, req.params.id]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Franquia não encontrada.' })
    res.json({ mensagem: 'Status atualizado.' })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar status.' })
  }
}

async function remover(req, res) {
  try {
    const result = await db.query('DELETE FROM tenants WHERE id=$1', [req.params.id])
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Franquia não encontrada.' })
    res.json({ mensagem: 'Franquia removida.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao remover franquia.' })
  }
}

async function resumo(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='ativa' THEN 1 ELSE 0 END) AS ativas,
        SUM(CASE WHEN status='bloqueada' THEN 1 ELSE 0 END) AS bloqueadas,
        SUM(CASE WHEN status='cancelada' THEN 1 ELSE 0 END) AS canceladas,
        SUM(CASE WHEN status='suspensa' THEN 1 ELSE 0 END) AS suspensas,
        0 AS royalties_pendentes
      FROM tenants
    `)
    res.json(rows[0])
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar resumo.' })
  }
}

async function metricas(req, res) {
  const { id } = req.params
  try {
    const { rows: im } = await db.query('SELECT COUNT(*) AS total FROM imoveis WHERE tenant_id=$1', [id])
    const { rows: us } = await db.query('SELECT COUNT(*) AS total FROM usuarios WHERE tenant_id=$1', [id])
    res.json({ total_imoveis: Number(im[0].total), total_usuarios: Number(us[0].total) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao buscar métricas.' })
  }
}

module.exports = { listar, listarPublico, buscar, criar, atualizar, alterarStatus, remover, resumo, metricas }
