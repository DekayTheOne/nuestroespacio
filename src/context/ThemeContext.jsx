import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => localStorage.getItem('ne_tema') || 'naranja')

  useEffect(() => {
    if (tema === 'rosa') {
      document.documentElement.setAttribute('data-tema', 'rosa')
    } else {
      document.documentElement.removeAttribute('data-tema')
    }
    localStorage.setItem('ne_tema', tema)
  }, [tema])

  const alternarTema = () => setTema((t) => (t === 'naranja' ? 'rosa' : 'naranja'))

  return (
    <ThemeContext.Provider value={{ tema, setTema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}
