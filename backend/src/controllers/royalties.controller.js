// Royalties not implemented in current schema — stub endpoints to avoid 500 errors
async function listar(_req, res) { res.json([]) }
async function resumo(_req, res) { res.json({}) }
async function gerar(_req, res)  { res.status(501).json({ erro: 'Funcionalidade não implementada.' }) }
async function baixar(_req, res) { res.status(501).json({ erro: 'Funcionalidade não implementada.' }) }

module.exports = { listar, resumo, gerar, baixar }
