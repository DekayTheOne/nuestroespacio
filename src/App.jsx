import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AnimacionCorazones from './components/AnimacionCorazones'
import LayoutApp from './components/LayoutApp'
import Landing from './pages/Landing'
import Emparejar from './pages/Emparejar'
import Calendario from './pages/Calendario'
import Diario from './pages/Diario'
import BancoEmocional from './pages/BancoEmocional'
import Mapa from './pages/Mapa'
import Estado from './pages/Estado'
import Configuracion from './pages/Configuracion'

// Protege las rutas de /app: exige sesión y, si aún no hay pareja vinculada,
// redirige primero a la pantalla de emparejamiento.
function RutaProtegida({ children }) {
  const { usuario, perfil, cargando } = useAuth()

  if (cargando) return <PantallaCarga />
  if (!usuario) return <Navigate to="/" replace />
  if (!perfil?.pareja_id) return <Navigate to="/emparejar" replace />

  return children
}

function PantallaCarga() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <span className="text-4xl animate-latido" style={{ color: 'var(--color-primary)' }}>
        ♥
      </span>
    </div>
  )
}

export default function App() {
  const { usuario, cargando } = useAuth()
  const [mostrarAnimacion, setMostrarAnimacion] = useState(
    () => sessionStorage.getItem('ne_animacion_vista') !== '1'
  )

  function finalizarAnimacion() {
    sessionStorage.setItem('ne_animacion_vista', '1')
    setMostrarAnimacion(false)
  }

  if (cargando) return <PantallaCarga />

  if (mostrarAnimacion && usuario) {
    return <AnimacionCorazones onFinalizar={finalizarAnimacion} />
  }

  return (
    <Routes>
      <Route path="/" element={usuario ? <Navigate to="/app/calendario" replace /> : <Landing />} />
      <Route
        path="/emparejar"
        element={
          usuario ? <Emparejar /> : <Navigate to="/" replace />
        }
      />
      <Route
        path="/app"
        element={
          <RutaProtegida>
            <LayoutApp />
          </RutaProtegida>
        }
      >
        <Route path="calendario" element={<Calendario />} />
        <Route path="diario" element={<Diario />} />
        <Route path="banco-emocional" element={<BancoEmocional />} />
        <Route path="mapa" element={<Mapa />} />
        <Route path="estado" element={<Estado />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route index element={<Navigate to="calendario" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
