import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'

export default function Landing() {
  const [modo, setModo] = useState('login') // 'login' | 'registro'
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  async function manejarEnvio(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      if (modo === 'registro') {
        const { data, error: errRegistro } = await supabase.auth.signUp({ email, password })
        if (errRegistro) throw errRegistro

        if (data.user) {
          const { error: errPerfil } = await supabase.from('usuarios').insert({
            id: data.user.id,
            nombre,
          })
          if (errPerfil) throw errPerfil
        }
      } else {
        const { error: errLogin } = await supabase.auth.signInWithPassword({ email, password })
        if (errLogin) throw errLogin
      }

      navigate('/app/calendario')
    } catch (err) {
      setError(err.message || 'Ocurrió un error, intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Panel izquierdo — identidad */}
      <div className="md:w-1/2 flex flex-col justify-center px-8 md:px-16 py-14 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="text-3xl" style={{ color: 'var(--color-primary)' }}>♥</span>
            <span className="font-display text-xl">Nuestro Espacio</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-tight mb-5">
            Un lugar solo<br />para nosotros amorcito, te amo mi Melicita.
          </h1>
          <p className="text-ink-soft text-lg max-w-md leading-relaxed">
            Un lugarcito en el que ambos podremos guardar nustros recuerdos juntos y tambien demostrar nuestro amorcito dia tras dia:3
          </p>
        </motion.div>

        <div className="absolute -bottom-10 -right-10 text-[220px] opacity-10 pointer-events-none select-none"
             style={{ color: 'var(--color-primary)' }}>
          ♥
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="md:w-1/2 flex items-center justify-center px-6 py-14">
        <motion.form
          onSubmit={manejarEnvio}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full max-w-sm rounded-3xl p-8 shadow-sm"
          style={{ background: 'var(--color-bg-elevated)' }}
        >
          <div className="flex mb-6 rounded-full p-1" style={{ background: 'var(--color-primary-light)' }}>
            <button
              type="button"
              onClick={() => setModo('login')}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
                modo === 'login' ? 'text-white' : 'text-ink-soft'
              }`}
              style={{ background: modo === 'login' ? 'var(--color-primary)' : 'transparent' }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setModo('registro')}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
                modo === 'registro' ? 'text-white' : 'text-ink-soft'
              }`}
              style={{ background: modo === 'registro' ? 'var(--color-primary)' : 'transparent' }}
            >
              Crear cuenta
            </button>
          </div>

          {modo === 'registro' && (
            <div className="mb-4">
              <label className="text-sm font-medium block mb-1">Tu nombre</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 border outline-none focus:ring-2"
                style={{ borderColor: 'var(--color-primary-light)' }}
                placeholder="Como quieres que te llamen"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="text-sm font-medium block mb-1">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 border outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-primary-light)' }}
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium block mb-1">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 border outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-primary-light)' }}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 rounded-xl text-white font-medium transition-transform hover:scale-[1.02] disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}
          >
            {cargando ? 'Un momento...' : modo === 'login' ? 'Entrar' : 'Crear mi cuenta'}
          </button>
        </motion.form>
      </div>
    </div>
  )
}
