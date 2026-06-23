const router = require('express').Router()
const ctrl = require('../controllers/corretores.controller')
const { verificarJWT } = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')
const { permitir } = require('../middleware/roles')

router.use(verificarJWT, verificarTenant)
router.get('/', permitir('administrador_matriz','diretor_regional','franqueado','corretor','captador'), ctrl.listar)

module.exports = router
