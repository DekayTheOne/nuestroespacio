import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import EncabezadoPestana from '../components/EncabezadoPestana'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const COLORES = {
  rojo: { hex: '#e5484d', etiqueta: 'Falta visitar' },
  verde: { hex: '#30a46c', etiqueta: 'Visitado' },
  azul: { hex: '#3b82f6', etiqueta: 'Ahorrando para visitar' },
}

function crearIcono(color) {
  const hex = COLORES[color]?.hex || '#999'
  return L.divIcon({
    className: '',
    html: `<div style="
      width:26px;height:26px;border-radius:50% 50% 50% 0;
      background:${hex};transform:rotate(-45deg);
      border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  })
}

// Componente interno: escucha clicks en el mapa para agregar un pin nuevo
function ManejadorClicks({ onClickMapa }) {
  useMapEvents({
    click(e) {
      onClickMapa(e.latlng)
    },
  })
  return null
}

export default function Mapa() {
  const { perfil } = useAuth()
  const parejaId = perfil?.pareja_id

  const [pines, setPines] = useState([])
  const [puntoNuevo, setPuntoNuevo] = useState(null) // {lat, lng} pendiente de guardar
  const [colorNuevo, setColorNuevo] = useState('rojo')
  const [notaNueva, setNotaNueva] = useState('')

  useEffect(() => {
    if (!parejaId) return
    async function cargar() {
      const { data } = await supabase.from('pines_mapa').select('*').eq('pareja_id', parejaId)
      setPines(data || [])
    }
    cargar()

    const canal = supabase
      .channel(`mapa-${parejaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pines_mapa', filter: `pareja_id=eq.${parejaId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') setPines((prev) => [...prev, payload.new])
          if (payload.eventType === 'DELETE') setPines((prev) => prev.filter((p) => p.id !== payload.old.id))
          if (payload.eventType === 'UPDATE')
            setPines((prev) => prev.map((p) => (p.id === payload.new.id ? payload.new : p)))
        }
      )
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [parejaId])

  async function guardarPin() {
    if (!puntoNuevo) return
    await supabase.from('pines_mapa').insert({
      pareja_id: parejaId,
      lat: puntoNuevo.lat,
      lng: puntoNuevo.lng,
      color: colorNuevo,
      nota: notaNueva || null,
      creado_por: perfil.id,
    })
    setPuntoNuevo(null)
    setNotaNueva('')
    setColorNuevo('rojo')
  }

  async function eliminarPin(id) {
    await supabase.from('pines_mapa').delete().eq('id', id)
  }

  return (
    <div>
      <EncabezadoPestana icono="📍" titulo="Mapa" subtitulo="Dale a cualquier parte del mapita y agrega un pin para agendar el lugarcito." />

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mb-4 p-4 rounded-2xl" style={{ background: 'var(--color-bg-elevated)' }}>
        {Object.entries(COLORES).map(([clave, info]) => (
          <div key={clave} className="flex items-center gap-2 text-sm">
            <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ background: info.hex }} />
            {info.etiqueta}
          </div>
        ))}
      </div>

      <div className="rounded-3xl overflow-hidden" style={{ height: '520px' }}>
        <MapContainer center={[20, 0]} zoom={2.5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ManejadorClicks onClickMapa={(latlng) => setPuntoNuevo(latlng)} />

          {pines.map((pin) => (
            <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={crearIcono(pin.color)}>
              <Popup>
                <div className="text-sm">
                  <p className="font-medium mb-1">{COLORES[pin.color]?.etiqueta}</p>
                  {pin.nota && <p className="text-ink-soft mb-2">{pin.nota}</p>}
                  <button onClick={() => eliminarPin(pin.id)} className="text-red-500 text-xs underline">
                    Eliminar pin
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {puntoNuevo && (
            <Marker position={[puntoNuevo.lat, puntoNuevo.lng]} icon={crearIcono(colorNuevo)}>
              <Popup autoPan>
                <div className="flex flex-col gap-2 text-sm w-48">
                  <p className="font-medium">Nuevo pin</p>
                  <div className="flex gap-2">
                    {Object.entries(COLORES).map(([clave, info]) => (
                      <button
                        key={clave}
                        onClick={() => setColorNuevo(clave)}
                        className="w-6 h-6 rounded-full border-2"
                        style={{
                          background: info.hex,
                          borderColor: colorNuevo === clave ? '#000' : 'transparent',
                        }}
                        title={info.etiqueta}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Nota (opcional)"
                    value={notaNueva}
                    onChange={(e) => setNotaNueva(e.target.value)}
                    className="border rounded-lg px-2 py-1 text-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={guardarPin}
                      className="flex-1 text-white text-xs rounded-lg py-1.5"
                      style={{ background: 'var(--color-primary)' }}
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setPuntoNuevo(null)}
                      className="flex-1 text-xs rounded-lg py-1.5 border"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  )
}
