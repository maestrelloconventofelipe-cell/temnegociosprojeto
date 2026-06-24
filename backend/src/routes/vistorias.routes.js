const router = require('express').Router()
const ctrl   = require('../controllers/vistorias.controller')
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')

const OPERACAO = ['administrador_matriz','diretor_regional','franqueado','corretor','captador','juridico']
const VER      = [...OPERACAO, 'auditor_rede', 'funcionario_administrativo']
function podeOperar(req, res, next) {
  if (!OPERACAO.includes(req.user?.role)) return res.status(403).json({ erro: 'Acesso negado.' })
  next()
}
function podeVer(req, res, next) {
  if (!VER.includes(req.user?.role)) return res.status(403).json({ erro: 'Acesso negado.' })
  next()
}

router.use(verificarJWT, verificarTenant)

router.get('/',       podeVer,     ctrl.listar)
router.get('/:id',    podeVer,     ctrl.buscar)
router.post('/',      podeOperar, ctrl.criar)
router.put('/:id',    podeOperar, ctrl.atualizar)
router.delete('/:id', podeOperar, ctrl.remover)

module.exports = router
