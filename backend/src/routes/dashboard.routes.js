const router = require('express').Router()
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')
const ctrl = require('../controllers/dashboard.controller')

router.use(verificarJWT, verificarTenant)
router.get('/',        ctrl.resumo)
router.get('/graficos', ctrl.graficos)

module.exports = router
