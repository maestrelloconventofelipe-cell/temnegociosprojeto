const router  = require('express').Router()
const multer  = require('multer')
const path    = require('path')
const fs      = require('fs')
const ctrl    = require('../controllers/documentos.controller')
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '../../../public/uploads/documentos')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase()
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_').slice(0, 40)
    cb(null, `${Date.now()}-${base}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } })

router.use(verificarJWT, verificarTenant)

router.post('/upload', upload.single('arquivo'), (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' })
  res.json({
    url:      `/uploads/documentos/${req.file.filename}`,
    tamanho:  req.file.size,
    filename: req.file.filename,
  })
})

router.get('/',       ctrl.listar)
router.post('/',      ctrl.criar)
router.delete('/:id', ctrl.remover)

module.exports = router
