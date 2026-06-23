const router = require('express').Router()
const ctrl   = require('../controllers/comissoes.controller')
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')
const { permitir }        = require('../middleware/roles')

const TODOS    = ['administrador_matriz','diretor_regional','franqueado','corretor','captador','financeiro','juridico','funcionario_administrativo','auditor_rede']
const GESTORES = ['administrador_matriz','diretor_regional','franqueado','financeiro']

router.use(verificarJWT, verificarTenant)

router.get('/',             permitir(...TODOS),    ctrl.listar)
router.get('/:id',          permitir(...TODOS),    ctrl.buscar)
router.post('/',            permitir(...GESTORES), ctrl.criar)
router.put('/:id',          permitir(...GESTORES), ctrl.atualizar)
router.patch('/:id/pagar',  permitir(...GESTORES), ctrl.pagar)
router.delete('/:id',       permitir(...GESTORES), ctrl.remover)

module.exports = router
