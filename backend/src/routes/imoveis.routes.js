const router  = require('express').Router()
const ctrl    = require('../controllers/imoveis.controller')
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')
const { permitir }        = require('../middleware/roles')
const multer  = require('multer')
const path    = require('path')
const fs      = require('fs')
const db      = require('../config/db')

const VER    = ['administrador_matriz','diretor_regional','franqueado','corretor','captador','financeiro','juridico','funcionario_administrativo','auditor_rede']
const EDITAR = ['administrador_matriz','diretor_regional','franqueado','corretor','captador']

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '../../../public/uploads/imoveis')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/image\/(jpeg|jpg|png|webp)/i.test(file.mimetype)) cb(null, true)
    else cb(new Error('Apenas imagens JPG, PNG ou WEBP são permitidas.'))
  },
})

router.use(verificarJWT, verificarTenant)

router.get('/',    permitir(...VER),    ctrl.listar)
router.get('/:id', permitir(...VER),    ctrl.buscar)
router.post('/',   permitir(...EDITAR), ctrl.criar)
router.put('/:id', permitir(...EDITAR), ctrl.atualizar)

// Upload de fotos (local, via multer)
router.post('/:id/fotos', permitir(...EDITAR), upload.array('fotos', 10), async (req, res) => {
  const tenantId = req.tenant.id
  const { id }   = req.params
  try {
    const { rows } = await db.query(
      'SELECT fotos FROM imoveis WHERE id=$1 AND tenant_id=$2',
      [id, tenantId]
    )
    if (!rows.length) return res.status(404).json({ erro: 'Imóvel não encontrado.' })

    const existentes = Array.isArray(rows[0].fotos) ? rows[0].fotos : []
    const novas      = req.files.map(f => `/uploads/imoveis/${f.filename}`)
    const todas      = [...existentes, ...novas]

    await db.query(
      'UPDATE imoveis SET fotos=$1, updated_at=NOW() WHERE id=$2 AND tenant_id=$3',
      [JSON.stringify(todas), id, tenantId]
    )
    res.json({ urls: novas, fotos: todas })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao fazer upload das fotos.' })
  }
})

// Atualiza array de fotos diretamente (PATCH)
router.patch('/:id/fotos', permitir(...EDITAR), ctrl.atualizarFotos)

router.delete('/:id', permitir(...EDITAR), ctrl.remover)

module.exports = router
