import { useState } from 'react'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// Formatea una fecha local a 'YYYY-MM-DD' sin desfases de zona horaria
export function aClaveFecha(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * props:
 * - fechaSeleccionada: Date
 * - onSeleccionar(date)
 * - diasMarcados: Set<string> con claves 'YYYY-MM-DD' de días con contenido
 * - colorMarcador: función opcional (claveFecha) => color hex, para puntos de distintos colores
 */
export default function MiniCalendario({ fechaSeleccionada, onSeleccionar, diasMarcados = new Set(), colorMarcador }) {
  const [mesVisible, setMesVisible] = useState(
    () => new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), 1)
  )

  const primerDiaSemana = (new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1).getDay() + 6) % 7 // lunes=0
  const diasEnMes = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0).getDate()

  const celdas = []
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(new Date(mesVisible.getFullYear(), mesVisible.getMonth(), d))

  const hoy = aClaveFecha(new Date())

  return (
    <div className="rounded-3xl p-5" style={{ background: 'var(--color-bg-elevated)' }}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMesVisible((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="w-8 h-8 rounded-full hover:bg-primary-light transition-colors"
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <span className="font-display text-lg">
          {MESES[mesVisible.getMonth()]} {mesVisible.getFullYear()}
        </span>
        <button
          onClick={() => setMesVisible((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="w-8 h-8 rounded-full hover:bg-primary-light transition-colors"
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-soft mb-2">
        {DIAS_SEMANA.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celdas.map((fecha, i) => {
          if (!fecha) return <div key={`vacio-${i}`} />
          const clave = aClaveFecha(fecha)
          const seleccionado = clave === aClaveFecha(fechaSeleccionada)
          const marcado = diasMarcados.has(clave)
          const esHoy = clave === hoy

          return (
            <button
              key={clave}
              onClick={() => onSeleccionar(fecha)}
              className={`relative aspect-square rounded-xl text-sm flex items-center justify-center transition-colors ${
                seleccionado ? 'text-white' : esHoy ? 'font-bold' : 'text-ink hover:bg-primary-light'
              }`}
              style={{ background: seleccionado ? 'var(--color-primary)' : 'transparent' }}
            >
              {fecha.getDate()}
              {marcado && !seleccionado && (
                <span
                  className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                  style={{ background: colorMarcador ? colorMarcador(clave) : 'var(--color-primary)' }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
