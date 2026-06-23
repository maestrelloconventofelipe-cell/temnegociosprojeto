const router = require('express').Router()
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')
const { permitir }        = require('../middleware/roles')
const ctrl = require('../controllers/relatorios.controller')

const TODOS    = ['administrador_matriz','diretor_regional','franqueado','corretor','captador','financeiro','juridico','funcionario_administrativo','auditor_rede']
const GESTORES = ['administrador_matriz','diretor_regional','franqueado','financeiro']

router.use(verificarJWT, verificarTenant)

router.get('/financeiro', permitir(...GESTORES), ctrl.financeiro)
router.get('/comissoes',  permitir(...GESTORES), ctrl.comissoes)
router.get('/contratos',  permitir(...TODOS),    ctrl.contratos)
router.get('/imoveis',    permitir(...TODOS),    ctrl.imoveis)

module.exports = router
