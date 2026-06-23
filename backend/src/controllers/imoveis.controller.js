const db = require('../config/db')
const { notificar } = require('../services/notificacoes.service')

async function listar(req, res) {
  const tenantId = req.tenant.id
  const { role, user_id } = req.user
  const { tipo, finalidade, status } = req.query

  let sql = `
    SELECT i.*, u.nome AS corretor_nome
    FROM imoveis i
    LEFT JOIN usuarios u ON i.corretor_id = u.id
    WHERE i.tenant_id = $1
  `
  const p = [tenantId]

  if (role === 'corretor') { sql += ` AND i.corretor_id = $${p.length+1}`; p.push(user_id) }
  if (tipo)       { sql += ` AND i.tipo = $${p.length+1}`;       p.push(tipo) }
  if (finalidade) { sql += ` AND i.finalidade = $${p.length+1}`; p.push(finalidade) }
  if (status)     { sql += ` AND i.status = $${p.length+1}`;     p.push(status) }

  sql += ' ORDER BY i.created_at DESC'

  try {
    const { rows } = await db.query(sql, p)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar imóveis.', ...(process.env.NODE_ENV !== 'production' && { detalhe: err.message, codigo: err.code }) })
  }
}

async function buscar(req, res) {
  const tenantId = req.tenant.id
  try {
    const { rows } = await db.query(
      `SELECT i.*, u.nome AS corretor_nome
       FROM imoveis i LEFT JOIN usuarios u ON i.corretor_id = u.id
       WHERE i.id=$1 AND i.tenant_id=$2`,
      [req.params.id, tenantId]
    )
    if (!rows.length) return res.status(404).json({ erro: 'Imóvel não encontrado.' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao buscar imóvel.', ...(process.env.NODE_ENV !== 'production' && { detalhe: err.message, codigo: err.code }) })
  }
}

async function criar(req, res) {
  const tenantId = req.tenant.id
  const { role, user_id } = req.user
  const {
    titulo, tipo, finalidade, valor, valor_negociacao,
    area_total, area_util, quartos, banheiros, vagas,
    cep, endereco, logradouro, numero, complemento, bairro, cidade, estado, uf,
    descricao, status, destaque, corretor_id, captador_id,
  } = req.body

  if (!titulo) return res.status(400).json({ erro: 'Título é obrigatório.' })
  const corrFinal = role === 'corretor' ? user_id : (corretor_id || null)
  const endFinal  = endereco || logradouro || null
  const estFinal  = estado   || uf         || null

  try {
    const { rows } = await db.query(
      `INSERT INTO imoveis
        (tenant_id, titulo, tipo, finalidade, valor, valor_negociacao,
         area_total, area_util, quartos, banheiros, vagas,
         cep, endereco, numero, complemento, bairro, cidade, estado,
         descricao, status, destaque, corretor_id, captador_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING id`,
      [
        tenantId, titulo, tipo||null, finalidade||'Venda',
        valor||null, valor_negociacao||null,
        area_total||null, area_util||null,
        quartos||null, banheiros||null, vagas||null,
        cep||null, endFinal, numero||null, complemento||null,
        bairro||null, cidade||null, estFinal,
        descricao||null, status||'disponivel', destaque||false,
        corrFinal, captador_id||null,
      ]
    )
    const id = rows[0].id
    notificar({
      tenant_id: tenantId,
      usuario_id: null,
      tipo: 'sistema',
      titulo: `Novo imóvel cadastrado: ${titulo}`,
      mensagem: cidade ? `${cidade}${estFinal ? `/${estFinal}` : ''}` : null,
      link: '/imoveis',
    })
    res.status(201).json({ id, titulo })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar imóvel.', ...(process.env.NODE_ENV !== 'production' && { detalhe: err.message, codigo: err.code }) })
  }
}

async function atualizar(req, res) {
  const tenantId = req.tenant.id
  const { role, user_id } = req.user
  const {
    titulo, tipo, finalidade, valor, valor_negociacao,
    area_total, area_util, quartos, banheiros, vagas,
    cep, endereco, logradouro, numero, complemento, bairro, cidade, estado, uf,
    descricao, status, destaque, corretor_id, captador_id,
  } = req.body

  try {
    const { rows: check } = await db.query(
      'SELECT corretor_id FROM imoveis WHERE id=$1 AND tenant_id=$2',
      [req.params.id, tenantId]
    )
    if (!check.length) return res.status(404).json({ erro: 'Imóvel não encontrado.' })
    if (role === 'corretor' && check[0].corretor_id !== user_id) {
      return res.status(403).json({ erro: 'Acesso negado.' })
    }

    const corrFinal = role === 'corretor' ? user_id : (corretor_id !== undefined ? corretor_id : check[0].corretor_id)
    const endFinal  = endereco || logradouro || null
    const estFinal  = estado   || uf         || null

    const result = await db.query(
      `UPDATE imoveis SET
        titulo=$1, tipo=$2, finalidade=$3, valor=$4, valor_negociacao=$5,
        area_total=$6, area_util=$7, quartos=$8, banheiros=$9, vagas=$10,
        cep=$11, endereco=$12, numero=$13, complemento=$14, bairro=$15,
        cidade=$16, estado=$17, descricao=$18, status=$19, destaque=$20,
        corretor_id=$21, captador_id=$22, updated_at=NOW()
       WHERE id=$23 AND tenant_id=$24`,
      [
        titulo, tipo||null, finalidade||'Venda',
        valor||null, valor_negociacao||null,
        area_total||null, area_util||null,
        quartos||null, banheiros||null, vagas||null,
        cep||null, endFinal, numero||null, complemento||null, bairro||null,
        cidade||null, estFinal, descricao||null,
        status||'disponivel', destaque||false,
        corrFinal, captador_id||null,
        req.params.id, tenantId,
      ]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Imóvel não encontrado.' })
    res.json({ mensagem: 'Imóvel atualizado.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao atualizar imóvel.', ...(process.env.NODE_ENV !== 'production' && { detalhe: err.message, codigo: err.code }) })
  }
}

async function atualizarFotos(req, res) {
  const tenantId = req.tenant.id
  const { fotos } = req.body
  if (!Array.isArray(fotos)) return res.status(400).json({ erro: 'fotos deve ser um array.' })
  try {
    const result = await db.query(
      'UPDATE imoveis SET fotos=$1, updated_at=NOW() WHERE id=$2 AND tenant_id=$3',
      [JSON.stringify(fotos), req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Imóvel não encontrado.' })
    res.json({ mensagem: 'Fotos atualizadas.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao atualizar fotos.', ...(process.env.NODE_ENV !== 'production' && { detalhe: err.message, codigo: err.code }) })
  }
}

async function remover(req, res) {
  const tenantId = req.tenant.id
  const { role, user_id } = req.user
  try {
    const { rows } = await db.query(
      'SELECT corretor_id FROM imoveis WHERE id=$1 AND tenant_id=$2',
      [req.params.id, tenantId]
    )
    if (!rows.length) return res.status(404).json({ erro: 'Imóvel não encontrado.' })
    if (role === 'corretor' && rows[0].corretor_id !== user_id) {
      return res.status(403).json({ erro: 'Acesso negado.' })
    }
    await db.query('DELETE FROM imoveis WHERE id=$1 AND tenant_id=$2', [req.params.id, tenantId])
    res.json({ mensagem: 'Imóvel removido.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao remover imóvel.', ...(process.env.NODE_ENV !== 'production' && { detalhe: err.message, codigo: err.code }) })
  }
}

module.exports = { listar, buscar, criar, atualizar, atualizarFotos, remover }
