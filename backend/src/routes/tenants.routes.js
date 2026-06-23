const router = require('express').Router()
const ctrl   = require('../controllers/tenants.controller')
const { verificarJWT } = require('../middleware/auth')

function apenasSuperAdmin(req, res, next) {
  if (req.user?.role !== 'administrador_matriz') {
    return res.status(403).json({ erro: 'Acesso restrito à Matriz.' })
  }
  next()
}

// Rota pública: usada pelo login para popular o seletor de franquias
router.get('/public', ctrl.listarPublico)

// Rotas protegidas: apenas administrador_matriz
router.use(verificarJWT, apenasSuperAdmin)

router.get('/resumo',       ctrl.resumo)
router.get('/',             ctrl.listar)
router.get('/:id',          ctrl.buscar)
router.get('/:id/metricas', ctrl.metricas)
router.post('/',            ctrl.criar)
router.put('/:id',          ctrl.atualizar)
router.patch('/:id/status', ctrl.alterarStatus)
router.delete('/:id',       ctrl.remover)

module.exports = router
