export function maskCPF(v) {
  v = v.replace(/\D/g, '').slice(0, 11)
  v = v.replace(/(\d{3})(\d)/, '$1.$2')
  v = v.replace(/(\d{3})(\d)/, '$1.$2')
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  return v
}

export function maskCNPJ(v) {
  v = v.replace(/\D/g, '').slice(0, 14)
  v = v.replace(/^(\d{2})(\d)/, '$1.$2')
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  v = v.replace(/\.(\d{3})(\d)/, '.$1/$2')
  v = v.replace(/(\d{4})(\d)/, '$1-$2')
  return v
}

export function maskTelefone(v) {
  v = v.replace(/\D/g, '').slice(0, 11)
  if (v.length <= 10) {
    v = v.replace(/(\d{2})(\d)/, '($1) $2')
    v = v.replace(/(\d{4})(\d)/, '$1-$2')
  } else {
    v = v.replace(/(\d{2})(\d)/, '($1) $2')
    v = v.replace(/(\d{5})(\d)/, '$1-$2')
  }
  return v
}

export function maskCEP(v) {
  v = v.replace(/\D/g, '').slice(0, 8)
  v = v.replace(/(\d{5})(\d)/, '$1-$2')
  return v
}
