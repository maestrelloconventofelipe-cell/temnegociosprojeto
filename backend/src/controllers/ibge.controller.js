const https = require('https')

const IBGE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados'

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Accept: 'application/json' } }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch (e) { reject(e) } })
    }).on('error', reject)
  })
}

async function listarEstados(req, res) {
  try {
    const estados = await fetchJson(IBGE_URL)
    const lista = estados
      .map(e => ({ id: e.id, sigla: e.sigla, nome: e.nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome))
    res.json(lista)
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar estados do IBGE.' })
  }
}

async function listarMunicipios(req, res) {
  const { uf } = req.params
  try {
    const municipios = await fetchJson(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
    )
    const lista = municipios
      .map(m => ({ id: m.id, nome: m.nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome))
    res.json(lista)
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar municípios do IBGE.' })
  }
}

module.exports = { listarEstados, listarMunicipios }
