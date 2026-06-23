const router = require('express').Router()
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')
const { permitir }        = require('../middleware/roles')
const ctrl = require('../controllers/configuracoes.controller')

const VER    = ['administrador_matriz','diretor_regional','franqueado']
const EDITAR = ['administrador_matriz','diretor_regional','franqueado']

router.use(verificarJWT, verificarTenant)
router.get('/', permitir(...VER),    ctrl.buscar)
router.put('/', permitir(...EDITAR), ctrl.atualizar)

module.exports = router
