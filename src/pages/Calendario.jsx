import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EncabezadoPestana from '../components/EncabezadoPestana'
import MiniCalendario, { aClaveFecha } from '../components/MiniCalendario'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Calendario() {
  const { perfil, pareja } = useAuth()
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date())
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const parejaId = perfil?.pareja_id

  useEffect(() => {
    if (!parejaId) return

    async function cargar() {
      setCargando(true)
      const { data } = await supabase
        .from('eventos_calendario')
        .select('*')
        .eq('pareja_id', parejaId)
        .order('fecha', { ascending: true })
      setEventos(data || [])
      setCargando(false)
    }
    cargar()

    const canal = supabase
      .channel(`eventos-${parejaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'eventos_calendario', filter: `pareja_id=eq.${parejaId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEventos((prev) => [...prev, payload.new].sort((a, b) => a.fecha.localeCompare(b.fecha)))
          } else if (payload.eventType === 'DELETE') {
            setEventos((prev) => prev.filter((e) => e.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setEventos((prev) => prev.map((e) => (e.id === payload.new.id ? payload.new : e)))
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [parejaId])

  const diasMarcados = useMemo(() => new Set(eventos.map((e) => e.fecha)), [eventos])
  const claveSeleccionada = aClaveFecha(fechaSeleccionada)
  const eventosDelDia = eventos.filter((e) => e.fecha === claveSeleccionada)

  async function crearEvento(datos) {
    const { error } = await supabase.from('eventos_calendario').insert({
      pareja_id: parejaId,
      titulo: datos.titulo,
      fecha: claveSeleccionada,
      hora: datos.hora || null,
      descripcion: datos.descripcion || null,
      es_importante: datos.esImportante,
      creado_por: perfil.id,
    })
    if (!error) setMostrarFormulario(false)
  }

  async function eliminarEvento(id) {
    await supabase.from('eventos_calendario').delete().eq('id', id)
  }

  const nombrePareja =
    pareja?.usuario1?.id === perfil?.id ? pareja?.usuario2?.nombre : pareja?.usuario1?.nombre

  return (
    <div>
      <EncabezadoPestana
        icono="🗓️"
        titulo="Calendario"
        subtitulo={
          nombrePareja ? `Compartido entre tú y ${nombrePareja}.` : 'Agenden juntos sus fechas importantes.'
        }
      />

      <div className="grid md:grid-cols-[360px_1fr] gap-6">
        <MiniCalendario
          fechaSeleccionada={fechaSeleccionada}
          onSeleccionar={setFechaSeleccionada}
          diasMarcados={diasMarcados}
          colorMarcador={(clave) => {
            const ev = eventos.find((e) => e.fecha === clave)
            return ev?.es_importante ? 'var(--color-primary)' : 'var(--color-accent)'
          }}
        />

        <div className="rounded-3xl p-6" style={{ background: 'var(--color-bg-elevated)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">
              {fechaSeleccionada.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h2>
            <button
              onClick={() => setMostrarFormulario((v) => !v)}
              className="px-4 py-2 rounded-full text-white text-sm font-medium"
              style={{ background: 'var(--color-primary)' }}
            >
              {mostrarFormulario ? 'Cancelar' : '+ Agregar evento'}
            </button>
          </div>

          <AnimatePresence>
            {mostrarFormulario && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <FormularioEvento onGuardar={crearEvento} />
              </motion.div>
            )}
          </AnimatePresence>

          {cargando ? (
            <p className="text-ink-soft text-sm">Cargando...</p>
          ) : eventosDelDia.length === 0 ? (
            <p className="text-ink-soft text-sm">No hay eventos este día. ¡Agenden algo bonito!</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {eventosDelDia.map((ev) => (
                <li
                  key={ev.id}
                  className="flex items-start justify-between gap-3 p-4 rounded-2xl"
                  style={{ background: 'var(--color-primary-light)' }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {ev.es_importante && <span>💗</span>}
                      <span className="font-medium">{ev.titulo}</span>
                      {ev.hora && <span className="text-xs text-ink-soft">{ev.hora.slice(0, 5)}</span>}
                    </div>
                    {ev.descripcion && <p className="text-sm text-ink-soft mt-1">{ev.descripcion}</p>}
                  </div>
                  <button
                    onClick={() => eliminarEvento(ev.id)}
                    className="text-ink-soft hover:text-red-500 text-sm shrink-0"
                    aria-label="Eliminar evento"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function FormularioEvento({ onGuardar }) {
  const [titulo, setTitulo] = useState('')
  const [hora, setHora] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [esImportante, setEsImportante] = useState(false)

  function manejarEnvio(e) {
    e.preventDefault()
    if (!titulo.trim()) return
    onGuardar({ titulo, hora, descripcion, esImportante })
    setTitulo('')
    setHora('')
    setDescripcion('')
    setEsImportante(false)
  }

  return (
    <form onSubmit={manejarEnvio} className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: 'var(--color-bg)' }}>
      <input
        type="text"
        placeholder="¿Qué van a hacer?"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        required
        className="rounded-xl px-4 py-2 border outline-none focus:ring-2"
        style={{ borderColor: 'var(--color-primary-light)' }}
      />
      <div className="flex gap-3">
        <input
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          className="rounded-xl px-4 py-2 border outline-none flex-1"
          style={{ borderColor: 'var(--color-primary-light)' }}
        />
        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
          <input type="checkbox" checked={esImportante} onChange={(e) => setEsImportante(e.target.checked)} />
          Fecha importante 💗
        </label>
      </div>
      <textarea
        placeholder="Notas (opcional)"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        rows={2}
        className="rounded-xl px-4 py-2 border outline-none resize-none"
        style={{ borderColor: 'var(--color-primary-light)' }}
      />
      <button
        type="submit"
        className="self-start px-5 py-2 rounded-xl text-white text-sm font-medium"
        style={{ background: 'var(--color-primary)' }}
      >
        Guardar evento
      </button>
    </form>
  )
}
