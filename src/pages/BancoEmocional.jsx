import { useEffect, useMemo, useState } from 'react'
import EncabezadoPestana from '../components/EncabezadoPestana'
import MiniCalendario, { aClaveFecha } from '../components/MiniCalendario'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const CAMPOS = [
  { clave: 'depositos', etiqueta: 'Depósitos', icono: '💰', ayuda: 'Gestos, palabras o momentos que fortalecieron la relación.' },
  { clave: 'retiros', etiqueta: 'Retiros', icono: '📉', ayuda: 'Lo que restó confianza o generó distancia.' },
  { clave: 'plan_accion', etiqueta: 'Plan de Acción', icono: '🎯', ayuda: '¿Qué van a hacer distinto de ahora en adelante?' },
]

export default function BancoEmocional() {
  const { perfil } = useAuth()
  const parejaId = perfil?.pareja_id

  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date())
  const [registros, setRegistros] = useState([])
  const [campos, setCampos] = useState({ depositos: '', retiros: '', plan_accion: '' })
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(true)

  const claveSeleccionada = aClaveFecha(fechaSeleccionada)

  useEffect(() => {
    if (!parejaId) return
    async function cargar() {
      const { data } = await supabase.from('banco_emocional').select('*').eq('pareja_id', parejaId)
      setRegistros(data || [])
      setCargando(false)
    }
    cargar()

    const canal = supabase
      .channel(`banco-emocional-${parejaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'banco_emocional', filter: `pareja_id=eq.${parejaId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setRegistros((prev) => prev.filter((r) => r.id !== payload.old.id))
          } else {
            setRegistros((prev) => [...prev.filter((r) => r.id !== payload.new.id), payload.new])
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [parejaId])

  useEffect(() => {
    const registro = registros.find((r) => r.fecha === claveSeleccionada)
    setCampos({
      depositos: registro?.depositos || '',
      retiros: registro?.retiros || '',
      plan_accion: registro?.plan_accion || '',
    })
  }, [claveSeleccionada, registros])

  const diasMarcados = useMemo(() => new Set(registros.map((r) => r.fecha)), [registros])

  async function guardar() {
    setGuardando(true)
    await supabase.from('banco_emocional').upsert(
      {
        pareja_id: parejaId,
        fecha: claveSeleccionada,
        ...campos,
        creado_por: perfil.id,
      },
      { onConflict: 'pareja_id,fecha' }
    )
    setGuardando(false)
  }

  return (
    <div>
      <EncabezadoPestana
        icono="💌"
        titulo="Banco Emocional"
        subtitulo="Depósitos, retiros y planes de acción para cuidar la relación."
      />

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
            <div className="flex flex-col gap-4">
              {CAMPOS.map((campo) => (
                <div key={campo.clave}>
                  <label className="flex items-center gap-2 text-sm font-medium mb-1">
                    <span>{campo.icono}</span> {campo.etiqueta}
                  </label>
                  <p className="text-xs text-ink-soft mb-2">{campo.ayuda}</p>
                  <textarea
                    value={campos[campo.clave]}
                    onChange={(e) => setCampos((c) => ({ ...c, [campo.clave]: e.target.value }))}
                    rows={3}
                    className="w-full rounded-2xl px-4 py-3 border outline-none resize-none"
                    style={{ borderColor: 'var(--color-primary-light)' }}
                  />
                </div>
              ))}

              <button
                onClick={guardar}
                disabled={guardando}
                className="self-start px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
                style={{ background: 'var(--color-primary)' }}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
