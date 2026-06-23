const router = require('express').Router()
const ctrl = require('../controllers/propostas.controller')
const { verificarJWT } = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')
const { permitir } = require('../middleware/roles')

const VER    = ['administrador_matriz','diretor_regional','franqueado','corretor','captador','financeiro','juridico','funcionario_administrativo','auditor_rede']
const EDITAR = ['administrador_matriz','diretor_regional','franqueado','corretor','captador']

router.use(verificarJWT, verificarTenant)

router.get('/',              permitir(...VER),    ctrl.listar)
router.get('/:id',           permitir(...VER),    ctrl.buscar)
router.post('/',             permitir(...EDITAR), ctrl.criar)
router.patch('/:id/status',  permitir(...EDITAR), ctrl.atualizarStatus)
router.delete('/:id',        permitir(...EDITAR), ctrl.remover)

module.exports = router
