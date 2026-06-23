const router = require('express').Router()
const ctrl   = require('../controllers/ibge.controller')

router.get('/estados',           ctrl.listarEstados)
router.get('/municipios/:uf',    ctrl.listarMunicipios)

module.exports = router
