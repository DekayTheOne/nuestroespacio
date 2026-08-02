import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EncabezadoPestana from '../components/EncabezadoPestana'
import MiniCalendario, { aClaveFecha } from '../components/MiniCalendario'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Diario() {
  const { perfil } = useAuth()
  const parejaId = perfil?.pareja_id

  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date())
  const [entradas, setEntradas] = useState([]) // todas, para marcar el calendario
  const [texto, setTexto] = useState('')
  const [imagenesExistentes, setImagenesExistentes] = useState([])
  const [imagenesNuevas, setImagenesNuevas] = useState([]) // File[]
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [imagenAmpliada, setImagenAmpliada] = useState(null) // url de la foto en vista grande

  const claveSeleccionada = aClaveFecha(fechaSeleccionada)

  useEffect(() => {
    if (!parejaId) return
    async function cargarTodas() {
      const { data } = await supabase.from('entradas_diario').select('*').eq('pareja_id', parejaId)
      setEntradas(data || [])
      setCargando(false)
    }
    cargarTodas()

    const canal = supabase
      .channel(`diario-${parejaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entradas_diario', filter: `pareja_id=eq.${parejaId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setEntradas((prev) => prev.filter((e) => e.id !== payload.old.id))
          } else {
            setEntradas((prev) => {
              const resto = prev.filter((e) => e.id !== payload.new.id)
              return [...resto, payload.new]
            })
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [parejaId])

  // Sincroniza el editor cuando cambia el día seleccionado
  useEffect(() => {
    const entrada = entradas.find((e) => e.fecha === claveSeleccionada)
    setTexto(entrada?.texto || '')
    setImagenesExistentes(entrada?.imagenes || [])
    setImagenesNuevas([])
  }, [claveSeleccionada, entradas])

  const diasMarcados = useMemo(() => new Set(entradas.map((e) => e.fecha)), [entradas])

  async function guardar() {
    setGuardando(true)

    const urlsSubidas = []
    for (const archivo of imagenesNuevas) {
      const ruta = `${parejaId}/${claveSeleccionada}-${Date.now()}-${archivo.name}`
      const { error: errSubida } = await supabase.storage.from('fotos-diario').upload(ruta, archivo)
      if (!errSubida) {
        const { data } = supabase.storage.from('fotos-diario').getPublicUrl(ruta)
        urlsSubidas.push(data.publicUrl)
      }
    }

    const todasLasImagenes = [...imagenesExistentes, ...urlsSubidas]

    await supabase.from('entradas_diario').upsert(
      {
        pareja_id: parejaId,
        fecha: claveSeleccionada,
        texto,
        imagenes: todasLasImagenes,
        creado_por: perfil.id,
      },
      { onConflict: 'pareja_id,fecha' }
    )

    setImagenesNuevas([])
    setGuardando(false)
  }

  function quitarImagenExistente(url) {
    setImagenesExistentes((prev) => prev.filter((u) => u !== url))
  }

  return (
    <div>
      <EncabezadoPestana icono="📔" titulo="Diario" subtitulo="Un recuerdo por cada día que viven juntos." />

      <div className="grid md:grid-cols-[360px_1fr] gap-6">
        <MiniCalendario
          fechaSeleccionada={fechaSeleccionada}
          onSeleccionar={setFechaSeleccionada}
          diasMarcados={diasMarcados}
        />

        <div className="rounded-3xl p-6" style={{ background: 'var(--color-bg-elevated)' }}>
          <h2 className="font-display text-xl mb-4">
            {fechaSeleccionada.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>

          {cargando ? (
            <p className="text-ink-soft text-sm">Cargando...</p>
          ) : (
            <>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="¿Qué pasó hoy?"
                rows={6}
                className="w-full rounded-2xl px-4 py-3 border outline-none resize-none mb-4"
                style={{ borderColor: 'var(--color-primary-light)' }}
              />

              {(imagenesExistentes.length > 0 || imagenesNuevas.length > 0) && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {imagenesExistentes.map((url) => (
                    <div key={url} className="relative">
                      <img
                        src={url}
                        alt=""
                        onClick={() => setImagenAmpliada(url)}
                        className="w-24 h-24 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                      />
                      <button
                        onClick={() => quitarImagenExistente(url)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {imagenesNuevas.map((archivo, i) => {
                    const urlLocal = URL.createObjectURL(archivo)
                    return (
                      <div key={i} className="relative">
                        <img
                          src={urlLocal}
                          alt=""
                          onClick={() => setImagenAmpliada(urlLocal)}
                          className="w-24 h-24 object-cover rounded-xl opacity-80 cursor-pointer hover:opacity-60 transition-opacity"
                        />
                        <span className="absolute bottom-1 left-1 text-[10px] bg-white/80 rounded px-1">nueva</span>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex items-center gap-3">
                <label
                  className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer border"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                >
                  + Agregar fotos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => setImagenesNuevas((prev) => [...prev, ...Array.from(e.target.files)])}
                  />
                </label>

                <button
                  onClick={guardar}
                  disabled={guardando}
                  className="px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {guardando ? 'Guardando...' : 'Guardar entrada'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {imagenAmpliada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setImagenAmpliada(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              src={imagenAmpliada}
              alt=""
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setImagenAmpliada(null)}
              aria-label="Cerrar"
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/90 text-lg flex items-center justify-center"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
