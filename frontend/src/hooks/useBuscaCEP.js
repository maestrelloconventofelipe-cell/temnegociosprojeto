import { useState } from 'react'

export function useBuscaCEP(onPreenchido) {
  const [buscando, setBuscando] = useState(false)

  async function buscar(cepMascarado) {
    const limpo = cepMascarado.replace(/\D/g, '')
    if (limpo.length !== 8) return
    setBuscando(true)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${limpo}/json/`)
      const d = await r.json()
      if (!d.erro) {
        onPreenchido({
          logradouro: d.logradouro || '',
          bairro:     d.bairro    || '',
          cidade:     d.localidade || '',
          estado:     d.uf        || '',
        })
      }
    } catch {}
    finally { setBuscando(false) }
  }

  return { buscar, buscando }
}
