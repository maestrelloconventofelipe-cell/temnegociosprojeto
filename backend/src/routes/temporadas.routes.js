const router = require('express').Router()
const ctrl   = require('../controllers/temporadas.controller')
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')

const OPERACAO = ['administrador_matriz','diretor_regional','franqueado','corretor','captador']
function podeOperar(req, res, next) {
  if (!OPERACAO.includes(req.user?.role)) return res.status(403).json({ erro: 'Sem permissão.' })
  next()
}

router.use(verificarJWT, verificarTenant)

router.get('/',       ctrl.listar)
router.get('/:id',    ctrl.buscar)
router.post('/',      podeOperar, ctrl.criar)
router.put('/:id',    podeOperar, ctrl.atualizar)
router.delete('/:id', podeOperar, ctrl.remover)

module.exports = router
