import { useState } from 'react'
import EncabezadoPestana from '../components/EncabezadoPestana'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabaseClient'

export default function Configuracion() {
  const { perfil, setPerfil, cerrarSesion, usuario, pareja } = useAuth()
  const { tema, setTema } = useTheme()

  const [nombre, setNombre] = useState(perfil?.nombre || '')
  const [subiendo, setSubiendo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  async function subirFoto(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setSubiendo(true)

    const ruta = `${usuario.id}/${Date.now()}-${archivo.name}`
    const { error: errSubida } = await supabase.storage.from('fotos-perfil').upload(ruta, archivo, {
      upsert: true,
    })

    if (!errSubida) {
      const { data } = supabase.storage.from('fotos-perfil').getPublicUrl(ruta)
      await supabase.from('usuarios').update({ foto_url: data.publicUrl }).eq('id', usuario.id)
      setPerfil((p) => ({ ...p, foto_url: data.publicUrl }))
    }
    setSubiendo(false)
  }

  async function guardarNombre() {
    setGuardando(true)
    const { error } = await supabase.from('usuarios').update({ nombre }).eq('id', usuario.id)
    if (!error) {
      setPerfil((p) => ({ ...p, nombre }))
      setMensaje('Guardado ✓')
      setTimeout(() => setMensaje(''), 2000)
    }
    setGuardando(false)
  }

  const nombrePareja =
    pareja?.usuario1?.id === usuario?.id ? pareja?.usuario2?.nombre : pareja?.usuario1?.nombre

  return (
    <div className="max-w-lg">
      <EncabezadoPestana icono="⚙️" titulo="Configuración" subtitulo="Tu perfil y tu cuenta." />

      <div className="rounded-3xl p-6 mb-6" style={{ background: 'var(--color-bg-elevated)' }}>
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-20 h-20 rounded-full bg-cover bg-center border-2"
            style={{
              borderColor: 'var(--color-primary)',
              backgroundImage: perfil?.foto_url ? `url(${perfil.foto_url})` : undefined,
              backgroundColor: 'var(--color-primary-light)',
            }}
          />
          <label
            className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer border"
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
          >
            {subiendo ? 'Subiendo...' : 'Cambiar foto'}
            <input type="file" accept="image/*" hidden onChange={subirFoto} disabled={subiendo} />
          </label>
        </div>

        <label className="text-sm font-medium block mb-1">Tu nombre</label>
        <div className="flex gap-2 mb-1">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="flex-1 rounded-xl px-4 py-2.5 border outline-none focus:ring-2"
            style={{ borderColor: 'var(--color-primary-light)' }}
          />
          <button
            onClick={guardarNombre}
            disabled={guardando || !nombre.trim()}
            className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}
          >
            Guardar
          </button>
        </div>
        {mensaje && <p className="text-xs text-green-600">{mensaje}</p>}
      </div>

      <div className="rounded-3xl p-6 mb-6" style={{ background: 'var(--color-bg-elevated)' }}>
        <p className="text-sm font-medium mb-3">Tema de color</p>
        <div className="flex gap-3">
          <button
            onClick={() => setTema('naranja')}
            className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium ${
              tema === 'naranja' ? 'border-current' : 'border-transparent'
            }`}
            style={{ background: '#FFE4D6', color: '#FF7A59' }}
          >
            🧡 Atardecer
          </button>
          <button
            onClick={() => setTema('rosa')}
            className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium ${
              tema === 'rosa' ? 'border-current' : 'border-transparent'
            }`}
            style={{ background: '#FFE0EB', color: '#FF6B9D' }}
          >
            💗 Flor
          </button>
        </div>
      </div>

      <div className="rounded-3xl p-6 mb-6" style={{ background: 'var(--color-bg-elevated)' }}>
        <p className="text-sm font-medium mb-1">Cuenta</p>
        <p className="text-sm text-ink-soft mb-1">Correo: {usuario?.email}</p>
        {nombrePareja && <p className="text-sm text-ink-soft">Emparejado con: {nombrePareja}</p>}
      </div>

      <button
        onClick={cerrarSesion}
        className="px-5 py-2.5 rounded-xl text-white font-medium"
        style={{ background: 'var(--color-primary)' }}
      >
        Cerrar sesión
      </button>
    </div>
  )
}
