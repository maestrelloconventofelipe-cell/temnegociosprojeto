const router = require('express').Router()
const ctrl   = require('../controllers/notificacoes.controller')
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')

router.use(verificarJWT, verificarTenant)

router.get('/',               ctrl.listar)
router.get('/nao-lidas',      ctrl.contarNaoLidas)
router.post('/',              ctrl.criar)
router.put('/todas-lidas',    ctrl.marcarTodasLidas)
router.put('/:id/lida',       ctrl.marcarLida)
router.delete('/:id',         ctrl.remover)

module.exports = router
