const router = require('express').Router()
const ctrl   = require('../controllers/agenda.controller')
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')

router.use(verificarJWT, verificarTenant)

router.get('/',              ctrl.listar)
router.get('/:id',           ctrl.buscar)
router.post('/',             ctrl.criar)
router.put('/:id',           ctrl.atualizar)
router.patch('/:id/status',  ctrl.atualizarStatus)
router.delete('/:id',        ctrl.remover)

module.exports = router
