import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null)
  const [perfil, setPerfil] = useState(null) // fila de "usuarios"
  const [pareja, setPareja] = useState(null) // fila de "parejas" (compartida por los dos)
  const [cargando, setCargando] = useState(true)

  // Escucha cambios de sesión (login/logout)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      setSesion(nuevaSesion)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Cuando hay sesión, carga el perfil y los datos de la pareja
  useEffect(() => {
    if (!sesion?.user) {
      setPerfil(null)
      setPareja(null)
      setCargando(false)
      return
    }

    async function cargarDatos() {
      setCargando(true)

      const { data: perfilData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', sesion.user.id)
        .single()

      setPerfil(perfilData)

      if (perfilData?.pareja_id) {
        const { data: parejaData } = await supabase
          .from('parejas')
          .select('*, usuario1:usuario1_id(*), usuario2:usuario2_id(*)')
          .eq('id', perfilData.pareja_id)
          .single()

        setPareja(parejaData)
      } else {
        setPareja(null)
      }

      setCargando(false)
    }

    cargarDatos()
  }, [sesion])

  const cerrarSesion = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider
      value={{ sesion, usuario: sesion?.user ?? null, perfil, pareja, cargando, cerrarSesion, setPerfil, setPareja }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
