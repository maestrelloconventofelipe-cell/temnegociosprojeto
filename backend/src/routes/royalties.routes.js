const router = require('express').Router()
const { listar, resumo, gerar, baixar } = require('../controllers/royalties.controller')
const { verificarJWT } = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')

function apenasSuperAdmin(req, res, next) {
  if (req.user?.role !== 'administrador_matriz') {
    return res.status(403).json({ erro: 'Acesso restrito à Matriz.' })
  }
  next()
}

router.get('/',           verificarJWT, verificarTenant, apenasSuperAdmin, listar)
router.get('/resumo',     verificarJWT, verificarTenant, apenasSuperAdmin, resumo)
router.post('/gerar',     verificarJWT, verificarTenant, apenasSuperAdmin, gerar)
router.put('/:id/baixar', verificarJWT, verificarTenant, apenasSuperAdmin, baixar)

module.exports = router
