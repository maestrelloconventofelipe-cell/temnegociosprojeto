const router = require('express').Router()
const ctrl   = require('../controllers/notificacoes.controller')
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')
const { permitir }        = require('../middleware/roles')

const GESTORES = ['administrador_matriz', 'diretor_regional', 'franqueado']

router.use(verificarJWT, verificarTenant)

router.get('/',               ctrl.listar)
router.get('/nao-lidas',      ctrl.contarNaoLidas)
router.post('/',              permitir(...GESTORES), ctrl.criar)
router.put('/todas-lidas',    ctrl.marcarTodasLidas)
router.put('/:id/lida',       ctrl.marcarLida)
router.delete('/:id',         ctrl.remover)

module.exports = router
