const router = require('express').Router()
const ctrl   = require('../controllers/temporadas.controller')
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')

const OPERACAO = ['administrador_matriz','diretor_regional','franqueado','corretor','captador']
const VER      = [...OPERACAO, 'juridico', 'financeiro', 'auditor_rede']
function podeOperar(req, res, next) {
  if (!OPERACAO.includes(req.user?.role)) return res.status(403).json({ erro: 'Sem permissão.' })
  next()
}
function podeVer(req, res, next) {
  if (!VER.includes(req.user?.role)) return res.status(403).json({ erro: 'Sem permissão.' })
  next()
}

router.use(verificarJWT, verificarTenant)

router.get('/',         podeVer, ctrl.listar)
router.get('/resumo',   podeVer, ctrl.resumo)
router.get('/:id',      podeVer, ctrl.buscar)
router.post('/',      podeOperar, ctrl.criar)
router.put('/:id',    podeOperar, ctrl.atualizar)
router.delete('/:id', podeOperar, ctrl.remover)

module.exports = router
