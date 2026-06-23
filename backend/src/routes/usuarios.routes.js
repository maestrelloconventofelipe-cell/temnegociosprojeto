const router = require('express').Router()
const ctrl   = require('../controllers/usuarios.controller')
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')
const { permitir }        = require('../middleware/roles')

const GESTORES = ['administrador_matriz','diretor_regional','franqueado']

router.use(verificarJWT, verificarTenant)

// Rotas do próprio usuário logado (qualquer role)
router.put('/perfil', ctrl.atualizarPerfil)
router.put('/senha',  ctrl.alterarSenha)

// Rotas administrativas
router.get('/atividade', permitir('administrador_matriz'), ctrl.atividade)
router.get('/',          permitir(...GESTORES), ctrl.listar)
router.get('/:id',       permitir(...GESTORES), ctrl.buscar)
router.post('/',      permitir(...GESTORES), ctrl.criar)
router.put('/:id',    permitir(...GESTORES), ctrl.atualizar)
router.delete('/:id', permitir('administrador_matriz','diretor_regional'), ctrl.remover)

module.exports = router
