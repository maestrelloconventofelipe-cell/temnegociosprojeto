const router = require('express').Router()
const ctrl   = require('../controllers/agenda.controller')
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')
const { permitir }        = require('../middleware/roles')

const OPERAR = ['administrador_matriz', 'diretor_regional', 'franqueado', 'corretor', 'captador']

router.use(verificarJWT, verificarTenant)

router.get('/',              ctrl.listar)
router.get('/:id',           ctrl.buscar)
router.post('/',             permitir(...OPERAR), ctrl.criar)
router.put('/:id',           permitir(...OPERAR), ctrl.atualizar)
router.patch('/:id/status',  permitir(...OPERAR), ctrl.atualizarStatus)
router.delete('/:id',        permitir(...OPERAR), ctrl.remover)

module.exports = router
