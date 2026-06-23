const crypto = require('crypto')

let _key = null

function getKey() {
  if (_key) return _key
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY ausente ou inválida — deve ser 64 caracteres hex (32 bytes)')
  }
  _key = Buffer.from(hex, 'hex')
  return _key
}

// AES-256-GCM determinístico: mesmo plaintext → mesmo ciphertext (permite busca por igualdade)
// IV = HMAC-SHA256(key, plaintext)[0:12] — determinístico mas não previsível sem a chave
function criptografar(valor) {
  if (valor == null || valor === '') return valor
  const k = getKey()
  const texto = String(valor)
  const iv = crypto.createHmac('sha256', k).update(texto).digest().slice(0, 12)
  const cipher = crypto.createCipheriv('aes-256-gcm', k, iv)
  const enc = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

function descriptografar(valor) {
  if (!valor || !String(valor).startsWith('enc:')) return valor // dado antigo em texto puro
  try {
    const partes = String(valor).split(':')
    if (partes.length !== 4) return valor
    const [, ivHex, tagHex, encHex] = partes
    const k       = getKey()
    const iv      = Buffer.from(ivHex,  'hex')
    const tag     = Buffer.from(tagHex, 'hex')
    const encBuf  = Buffer.from(encHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-gcm', k, iv)
    decipher.setAuthTag(tag)
    return decipher.update(encBuf).toString('utf8') + decipher.final('utf8')
  } catch {
    return valor
  }
}

// Campos sensíveis por tabela
const CAMPOS_SENSIVEIS = {
  clientes:    ['cpf'],
  compradores: ['doc', 'banco', 'agencia', 'conta', 'pix'],
  locatarios:  ['doc', 'banco', 'agencia', 'conta', 'pix'],
  funcionarios:['cpf', 'banco', 'agencia', 'conta', 'pix'],
  usuarios:    ['cpf'],
}

function encriptarRegistro(tabela, obj) {
  const campos = CAMPOS_SENSIVEIS[tabela]
  if (!campos || !obj) return obj
  const result = { ...obj }
  campos.forEach(campo => {
    if (result[campo] != null) result[campo] = criptografar(result[campo])
  })
  return result
}

function decriptarRegistro(tabela, obj) {
  const campos = CAMPOS_SENSIVEIS[tabela]
  if (!campos || !obj) return obj
  const result = { ...obj }
  campos.forEach(campo => {
    if (result[campo] != null) result[campo] = descriptografar(result[campo])
  })
  return result
}

function decriptarLista(tabela, lista) {
  return lista.map(item => decriptarRegistro(tabela, item))
}

module.exports = { criptografar, descriptografar, encriptarRegistro, decriptarRegistro, decriptarLista }
