require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const https = require('https')
const db = require('../src/config/db')

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Accept: 'application/json' } }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch (e) { reject(e) } })
    }).on('error', reject)
  })
}

function getEstadoId(m) {
  // tenta via microrregiao, cai para os 2 primeiros dígitos do código IBGE
  return m.microrregiao?.mesorregiao?.UF?.id ?? parseInt(String(m.id).substring(0, 2), 10)
}

async function run() {
  const client = await db.connect()
  try {
    console.log('Buscando estados do IBGE...')
    const estados = await fetchJson('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
    estados.sort((a, b) => a.nome.localeCompare(b.nome))

    console.log('Buscando municípios do IBGE...')
    const municipios = await fetchJson('https://servicodados.ibge.gov.br/api/v1/localidades/municipios')
    console.log(`Total: ${estados.length} estados, ${municipios.length} municípios`)

    await client.query('BEGIN')
    await client.query('TRUNCATE public.municipios_brasil, public.estados_brasil RESTART IDENTITY CASCADE')

    // Inserir estados
    for (const e of estados) {
      await client.query(
        'INSERT INTO public.estados_brasil (id, nome, sigla) VALUES ($1, $2, $3)',
        [e.id, e.nome, e.sigla]
      )
    }
    console.log(`✓ ${estados.length} estados inseridos`)

    // Inserir municípios em lotes de 200
    const BATCH = 200
    let count = 0
    for (let i = 0; i < municipios.length; i += BATCH) {
      const lote = municipios.slice(i, i + BATCH)
      const values = []
      const params = []
      let p = 1
      for (const m of lote) {
        values.push(`($${p++}, $${p++}, $${p++}, $${p++})`)
        params.push(m.id, getEstadoId(m), m.nome, String(m.id))
      }
      await client.query(
        `INSERT INTO public.municipios_brasil (id, estado_id, nome, codigo_ibge) VALUES ${values.join(', ')}`,
        params
      )
      count += lote.length
      console.log(`  ${count}/${municipios.length}...`)
    }

    await client.query('COMMIT')
    console.log(`✓ ${count} municípios inseridos`)
    console.log('Seed IBGE concluído com sucesso!')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Erro no seed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await db.end()
  }
}

run()
