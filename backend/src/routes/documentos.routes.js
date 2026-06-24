const router  = require('express').Router()
const multer  = require('multer')
const path    = require('path')
const fs      = require('fs')
const ctrl    = require('../controllers/documentos.controller')
const db      = require('../config/db')
const { verificarJWT }    = require('../middleware/auth')
const { verificarTenant } = require('../middleware/tenant')
const { permitir }        = require('../middleware/roles')

// Documentos ficam fora de public/ — não acessíveis diretamente pela web
const DOCS_DIR = path.join(__dirname, '../../../private/uploads/documentos')

const ALLOWED_MIMES = new Set([
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
])

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.odt', '.jpg', '.jpeg', '.png', '.webp', '.txt'])

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
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_MIMES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use PDF, DOC, XLS, JPG ou PNG.'))
    }
  },
})

const VER    = ['administrador_matriz','diretor_regional','franqueado','corretor','captador','financeiro','juridico','funcionario_administrativo','auditor_rede']
const EDITAR = ['administrador_matriz','diretor_regional','franqueado','corretor','captador','juridico','financeiro']

router.use(verificarJWT, verificarTenant)

router.post('/upload', permitir(...EDITAR), upload.single('arquivo'), (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' })
  res.json({
    url:      `/api/v1/documentos/arquivo/${req.file.filename}`,
    tamanho:  req.file.size,
    filename: req.file.filename,
  })
})

// Serve arquivos apenas para o tenant dono do documento
router.get('/arquivo/:filename', async (req, res) => {
  try {
    const filename = path.basename(req.params.filename)
    const url = `/api/v1/documentos/arquivo/${filename}`
    const { rows } = await db.query(
      'SELECT id FROM documentos WHERE url = $1 AND tenant_id = $2',
      [url, req.tenant.id]
    )
    if (!rows.length) return res.status(404).json({ erro: 'Arquivo não encontrado.' })
    const filepath = path.join(DOCS_DIR, filename)
    res.sendFile(filepath, err => {
      if (err && !res.headersSent) res.status(500).json({ erro: 'Erro ao servir arquivo.' })
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro interno.' })
  }
})

// Erros do multer (tipo/tamanho inválido) → 400; outros → 500
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message === 'Tipo de arquivo não permitido. Use PDF, DOC, XLS, JPG ou PNG.') {
    return res.status(400).json({ erro: err.message })
  }
  console.error('[documentos upload]', err)
  res.status(500).json({ erro: 'Erro no upload.' })
})

router.get('/',       permitir(...VER),    ctrl.listar)
router.post('/',      permitir(...EDITAR), ctrl.criar)
router.delete('/:id', permitir(...EDITAR), ctrl.remover)

module.exports = router
