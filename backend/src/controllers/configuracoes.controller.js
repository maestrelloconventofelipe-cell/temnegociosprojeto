const db = require('../config/db')

async function buscar(req, res) {
  const tenantId = req.tenant.id
  try {
    const { rows } = await db.query(
      `SELECT id, nome_fantasia, razao_social, cnpj, cidade, estado,
              endereco, numero, complemento, bairro, cep,
              responsavel_nome, responsavel_email, responsavel_telefone,
              status, created_at
       FROM tenants WHERE id=$1`,
      [tenantId]
    )
    if (!rows.length) return res.status(404).json({ erro: 'Franquia não encontrada.' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao carregar configurações.' })
  }
}

async function atualizar(req, res) {
  const tenantId = req.tenant.id
  const campos = [
    'nome_fantasia','razao_social','cnpj','cidade','estado',
    'endereco','numero','complemento','bairro','cep',
    'responsavel_nome','responsavel_email','responsavel_telefone',
  ]
  const sets = []
  const values = []
  for (const col of campos) {
    if (req.body[col] !== undefined) {
      values.push(req.body[col])
      sets.push(`${col}=$${values.length}`)
    }
  }
  if (!sets.length) return res.status(400).json({ erro: 'Nenhum campo para atualizar.' })
  values.push(tenantId)
  try {
    await db.query(`UPDATE tenants SET ${sets.join(',')} WHERE id=$${values.length}`, values)
    res.json({ mensagem: 'Configurações salvas.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao salvar configurações.' })
  }
}

module.exports = { buscar, atualizar }
