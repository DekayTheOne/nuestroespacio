import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

// Genera un código corto y legible, ej: "AMOR-4F2K"
function generarCodigo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let codigo = ''
  for (let i = 0; i < 5; i++) codigo += letras[Math.floor(Math.random() * letras.length)]
  return `AMOR-${codigo}`
}

export default function Emparejar() {
  const { usuario, perfil, setPerfil, setPareja } = useAuth()
  const [codigoIngresado, setCodigoIngresado] = useState('')
  const [miCodigo, setMiCodigo] = useState(perfil?.codigo_invitacion || null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function generarMiCodigo() {
    setCargando(true)
    const codigo = generarCodigo()

    const { error: errUpdate } = await supabase
      .from('usuarios')
      .update({ codigo_invitacion: codigo })
      .eq('id', usuario.id)

    if (!errUpdate) {
      setMiCodigo(codigo)
      setPerfil((p) => ({ ...p, codigo_invitacion: codigo }))
    } else {
      setError(errUpdate.message)
    }
    setCargando(false)
  }

  async function unirseConCodigo(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      // Busca al usuario dueño del código
      const { data: otroUsuario, error: errBuscar } = await supabase
        .from('usuarios')
        .select('*')
        .eq('codigo_invitacion', codigoIngresado.trim().toUpperCase())
        .single()

      if (errBuscar || !otroUsuario) throw new Error('No encontramos ese código. Revísalo con tu pareja.')
      if (otroUsuario.id === usuario.id) throw new Error('Ese es tu propio código 💛')

      // Crea la fila de pareja compartida
      const { data: nuevaPareja, error: errPareja } = await supabase
        .from('parejas')
        .insert({ usuario1_id: otroUsuario.id, usuario2_id: usuario.id })
        .select()
        .single()

      if (errPareja) throw errPareja

      // Vincula a ambos usuarios con el mismo pareja_id
      await supabase.from('usuarios').update({ pareja_id: nuevaPareja.id }).eq('id', usuario.id)
      await supabase.from('usuarios').update({ pareja_id: nuevaPareja.id }).eq('id', otroUsuario.id)

      setPareja(nuevaPareja)
      setPerfil((p) => ({ ...p, pareja_id: nuevaPareja.id }))
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--color-bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl p-8 shadow-sm text-center"
        style={{ background: 'var(--color-bg-elevated)' }}
      >
        <div className="text-4xl mb-3" style={{ color: 'var(--color-primary)' }}>♥</div>
        <h1 className="font-display text-2xl mb-2">Emparecemos sus cuentas</h1>
        <p className="text-ink-soft text-sm mb-6">
          Comparte tu código con tu pareja, o ingresa el que ella te dio.
        </p>

        <div className="mb-6 p-4 rounded-2xl" style={{ background: 'var(--color-primary-light)' }}>
          <p className="text-xs text-ink-soft mb-2">Tu código</p>
          {miCodigo ? (
            <p className="font-display text-2xl tracking-wide">{miCodigo}</p>
          ) : (
            <button
              onClick={generarMiCodigo}
              disabled={cargando}
              className="text-sm font-medium underline"
              style={{ color: 'var(--color-primary)' }}
            >
              Generar mi código
            </button>
          )}
        </div>

        <div className="text-xs text-ink-soft mb-3">— o ingresa el código de tu pareja —</div>

        <form onSubmit={unirseConCodigo} className="flex flex-col gap-3">
          <input
            type="text"
            value={codigoIngresado}
            onChange={(e) => setCodigoIngresado(e.target.value)}
            placeholder="AMOR-XXXXX"
            className="w-full text-center rounded-xl px-4 py-2.5 border outline-none focus:ring-2 uppercase"
            style={{ borderColor: 'var(--color-primary-light)' }}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={cargando || !codigoIngresado}
            className="w-full py-3 rounded-xl text-white font-medium disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}
          >
            Vincular cuentas
          </button>
        </form>
      </motion.div>
    </div>
  )
}
