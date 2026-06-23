const router = require('express').Router()
const ctrl   = require('../controllers/arquivos.controller')
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')

router.use(verificarJWT, verificarTenant)
router.get('/', ctrl.listar)

module.exports = router
