const router  = require('express').Router()
const multer  = require('multer')
const path    = require('path')
const fs      = require('fs')
const ctrl    = require('../controllers/documentos.controller')
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')

// Documentos ficam fora de public/ — não acessíveis diretamente pela web
const DOCS_DIR = path.join(__dirname, '../../../private/uploads/documentos')

const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.text',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
]

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(DOCS_DIR, { recursive: true })
    cb(null, DOCS_DIR)
  },
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase()
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_').slice(0, 40)
    cb(null, `${Date.now()}-${base}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use PDF, DOC, XLS, JPG ou PNG.'))
    }
  },
})

router.use(verificarJWT, verificarTenant)

router.post('/upload', upload.single('arquivo'), (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' })
  res.json({
    url:      `/api/v1/documentos/arquivo/${req.file.filename}`,
    tamanho:  req.file.size,
    filename: req.file.filename,
  })
})

// Serve arquivos de documentos apenas para usuários autenticados do mesmo tenant
router.get('/arquivo/:filename', (req, res) => {
  const filename = path.basename(req.params.filename) // sanitiza path traversal
  const filepath = path.join(DOCS_DIR, filename)
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ erro: 'Arquivo não encontrado.' })
  }
  res.sendFile(filepath)
})

// Tratamento de erro do multer (tipo inválido, arquivo muito grande)
router.use((err, _req, res, _next) => {
  if (err.message) return res.status(400).json({ erro: err.message })
  res.status(500).json({ erro: 'Erro no upload.' })
})

router.get('/',       ctrl.listar)
router.post('/',      ctrl.criar)
router.delete('/:id', ctrl.remover)

module.exports = router
