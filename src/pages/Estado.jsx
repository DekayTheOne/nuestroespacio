import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EncabezadoPestana from '../components/EncabezadoPestana'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

// Frases semilla, por si el banco de la pareja aún está vacío
const FRASES_BASE = [
  'Porque serás mi eterna eleccion ahora y hasta que deje de respirar.',
  'Mis ojos se iluminan cada vez que veo a mi reina y solecito llamada Melanie:3',
]

export default function Estado() {
  const { perfil } = useAuth()
  const parejaId = perfil?.pareja_id

  const [frases, setFrases] = useState(FRASES_BASE)
  const [fraseActual, setFraseActual] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [nuevaFrase, setNuevaFrase] = useState('')
  const [animando, setAnimando] = useState(false)

  useEffect(() => {
    if (!parejaId) return
    async function cargar() {
      const { data } = await supabase.from('banco_frases').select('frase').eq('pareja_id', parejaId)
      if (data && data.length > 0) {
        setFrases([...FRASES_BASE, ...data.map((f) => f.frase)])
      }
    }
    cargar()
  }, [parejaId])

  function mostrarFrase() {
    setAnimando(true)
    const aleatoria = frases[Math.floor(Math.random() * frases.length)]
    setTimeout(() => {
      setFraseActual(aleatoria)
      setAnimando(false)
    }, 200)
  }

  async function agregarFrase(e) {
    e.preventDefault()
    if (!nuevaFrase.trim()) return

    await supabase.from('banco_frases').insert({
      pareja_id: parejaId,
      frase: nuevaFrase.trim(),
      creado_por: perfil.id,
    })

    setFrases((prev) => [...prev, nuevaFrase.trim()])
    setNuevaFrase('')
    setMostrarFormulario(false)
  }

  return (
    <div className="flex flex-col items-center">
      <EncabezadoPestana icono="" titulo="Estado" subtitulo="Un empujoncito" />

      <div className="flex flex-col items-center justify-center py-10 w-full max-w-xl">
        <motion.button
          onClick={mostrarFrase}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          className="w-56 h-56 md:w-64 md:h-64 rounded-full flex flex-col items-center justify-center text-white shadow-lg font-display text-2xl gap-2"
          style={{ background: 'var(--color-primary)' }}
        >
          <span className="text-5xl">♥</span>
          Nuestro Amor
        </motion.button>

        <div className="min-h-[140px] mt-10 w-full flex items-center justify-center px-4">
          <AnimatePresence mode="wait">
            {fraseActual && !animando && (
              <motion.p
                key={fraseActual}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="text-center text-lg leading-relaxed font-display"
              >
                “{fraseActual}”
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Botón discreto para agregar frases */}
      <div className="mt-auto pt-10">
        {!mostrarFormulario ? (
          <button
            onClick={() => setMostrarFormulario(true)}
            className="text-xs text-ink-soft underline hover:text-ink transition-colors"
          >
            + agregar una frase al banco
          </button>
        ) : (
          <motion.form
            onSubmit={agregarFrase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2 items-center"
          >
            <textarea
              value={nuevaFrase}
              onChange={(e) => setNuevaFrase(e.target.value)}
              placeholder="Escribe una frase de apoyo/carinio para agregar al banco..."
              rows={2}
              className="w-72 rounded-xl px-3 py-2 border text-sm outline-none resize-none"
              style={{ borderColor: 'var(--color-primary-light)' }}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full text-white text-xs font-medium"
                style={{ background: 'var(--color-primary)' }}
              >
                Guardar frase
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="px-4 py-1.5 rounded-full text-xs border"
              >
                Cancelar
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  )
}
