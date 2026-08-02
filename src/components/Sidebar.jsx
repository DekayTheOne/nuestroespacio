import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const ITEMS = [
  { to: '/app/calendario', icono: '🗓️', etiqueta: 'Calendario' },
  { to: '/app/diario', icono: '📔', etiqueta: 'Diario' },
  { to: '/app/banco-emocional', icono: '💌', etiqueta: 'Banco Emocional' },
  { to: '/app/mapa', icono: '📍', etiqueta: 'Mapa' },
  { to: '/app/estado', icono: '💗', etiqueta: 'Estado' },
  { to: '/app/configuracion', icono: '⚙️', etiqueta: 'Configuración' },
]

export default function Sidebar() {
  const { tema, alternarTema } = useTheme()
  const { perfil } = useAuth()
  const [abiertoMovil, setAbiertoMovil] = useState(false)

  const contenido = (
    <div className="flex flex-col h-full py-6 px-4">
      <div className="flex items-center gap-2 px-2 mb-8">
        <span className="text-2xl" style={{ color: 'var(--color-primary)' }}>
          
        </span>
        <span className="font-display text-xl">Nuestro Espacio</span>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setAbiertoMovil(false)}
            className={({ isActive }) =>
              `relative isolate flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-colors duration-300 ${
                isActive ? 'text-white' : 'text-ink-soft hover:bg-primary-light hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="pestana-activa"
                    className="absolute inset-0 rounded-2xl z-0"
                    style={{ background: 'var(--color-primary)' }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 text-lg">{item.icono}</span>
                <span className="relative z-10">{item.etiqueta}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full bg-cover bg-center border-2"
            style={{
              borderColor: 'var(--color-primary)',
              backgroundImage: perfil?.foto_url ? `url(${perfil.foto_url})` : undefined,
              backgroundColor: 'var(--color-primary-light)',
            }}
          />
          <span className="text-sm font-medium truncate max-w-[90px]">
            {perfil?.nombre || 'Tú'}
          </span>
        </div>

        <button
          onClick={alternarTema}
          aria-label="Cambiar tema de color"
          title="Cambiar tema"
          className="w-9 h-9 rounded-full flex items-center justify-center border transition-transform hover:scale-105"
          style={{ borderColor: 'var(--color-primary)' }}
        >
          {tema === 'naranja' ? '🧡' : '💗'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Botón hamburguesa — solo móvil */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
        style={{ background: 'var(--color-bg-elevated)' }}
        onClick={() => setAbiertoMovil(true)}
        aria-label="Abrir menú"
      >
        ☰
      </button>

      {/* Sidebar de escritorio */}
      <aside
        className="hidden md:flex borde-ondulado flex-col w-64 shrink-0 h-screen sticky top-0"
        style={{ background: 'var(--color-bg-elevated)' }}
      >
        {contenido}
      </aside>

      {/* Sidebar de móvil (overlay) */}
      {abiertoMovil && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-72 h-full shadow-xl"
            style={{ background: 'var(--color-bg-elevated)' }}
          >
            {contenido}
          </motion.div>
          <div className="flex-1 bg-black/30" onClick={() => setAbiertoMovil(false)} />
        </div>
      )}
    </>
  )
}
