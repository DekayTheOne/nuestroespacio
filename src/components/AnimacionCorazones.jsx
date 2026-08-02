import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Genera corazones con posición, tamaño, retraso y duración aleatorios
function generarCorazones(cantidad) {
  return Array.from({ length: cantidad }).map((_, i) => ({
    id: i,
    izquierda: Math.random() * 100,
    tamano: 14 + Math.random() * 28,
    retraso: Math.random() * 1.2,
    duracion: 3 + Math.random() * 2.5,
    opacidadMax: 0.5 + Math.random() * 0.5,
  }))
}

export default function AnimacionCorazones({ onFinalizar }) {
  const [corazones] = useState(() => generarCorazones(22))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onFinalizar, 600)
    }, 2400)
    return () => clearTimeout(timer)
  }, [onFinalizar])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          style={{ background: 'var(--color-bg)' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {corazones.map((c) => (
            <span
              key={c.id}
              className="absolute bottom-0 animate-flotar select-none"
              style={{
                left: `${c.izquierda}%`,
                fontSize: `${c.tamano}px`,
                animationDelay: `${c.retraso}s`,
                animationDuration: `${c.duracion}s`,
                color: 'var(--color-primary)',
                opacity: c.opacidadMax,
              }}
            >
              ♥
            </span>
          ))}

          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            className="relative text-center px-6"
          >
            <div className="text-6xl mb-4 animate-latido" style={{ color: 'var(--color-primary)' }}>
              ♥
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-ink">Nuestro Espacio</h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
