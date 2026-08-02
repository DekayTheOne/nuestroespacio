# Nuestro Espacio 💗

App web privada para dos. Ya incluye las 6 pestañas funcionales (Calendario, Diario, Banco Emocional, Mapa, Estado, Configuración), todas sincronizadas en tiempo real entre ambos miembros de la pareja mediante Supabase Realtime.

## ⚠️ Si ya tenías el proyecto corriendo antes

Corre estos dos scripts en el **SQL Editor de Supabase**, en este orden:
1. `supabase/parche_rls.sql` → corrige el error de recursión infinita en RLS (y vuelve a activar RLS si lo habías desactivado).
2. `supabase/migracion_pestanas.sql` → agrega lo necesario para que Banco Emocional y las fotos (Diario/Configuración) funcionen.

Si es una instalación nueva, con correr `supabase/schema.sql` completo es suficiente (ya incluye ambas correcciones).

## 1. Requisitos

- Node.js 18+ instalado
- Una cuenta gratuita en [supabase.com](https://supabase.com)
- VS Code

## 2. Configurar Supabase (una sola vez)

1. Entra a [supabase.com](https://supabase.com) → **New Project**. Elige nombre, contraseña de base de datos y región (elige una cercana a ustedes).
2. Ve a **SQL Editor** → pega todo el contenido de `supabase/schema.sql` de este proyecto → **Run**. Esto crea las tablas, la seguridad por pareja y activa el tiempo real.
3. Ve a **Project Settings → API**. Copia:
   - **Project URL**
   - **anon public key**
4. Ve a **Authentication → Providers** y confirma que "Email" esté habilitado (viene por defecto). Si quieres evitar el paso de verificación por correo mientras pruebas, en **Authentication → Settings** puedes desactivar "Confirm email" temporalmente.
5. (Opcional, para fotos) Ve a **Storage** → crea dos buckets: `fotos-diario` y `fotos-perfil`, márcalos como públicos.

## 3. Abrir el proyecto en VS Code

```bash
# Descomprime el proyecto y entra a la carpeta
cd nuestro-espacio

# Instala dependencias
npm install

# Crea tu archivo de variables de entorno
cp .env.example .env.local
```

Abre `.env.local` y pega tus valores reales de Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

Extensiones recomendadas para VS Code (aparecerán sugeridas automáticamente si tienes el archivo `.vscode/extensions.json` incluido):
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prettier

## 4. Correr en local

```bash
npm run dev
```

Abre `http://localhost:5173`. Deberías ver la landing page.

## 5. Probar el flujo completo

1. Regístrate con tu correo (usuario A).
2. Te llevará a la pantalla **"Emparecemos sus cuentas"** → genera tu código.
3. En una ventana de incógnito (o dile a tu pareja), regístrense con otro correo (usuario B).
4. El usuario B ingresa el código del usuario A → quedan vinculados.
5. A partir de ahí, cualquier dato que uno cree en Calendario/Diario/etc. (una vez que conectemos cada pestaña) lo verá el otro al instante gracias a Supabase Realtime.

## 6. Estructura del proyecto

```
src/
├── components/       → Sidebar, animación de corazones, layout, encabezados
├── context/           → AuthContext (sesión + pareja) y ThemeContext (naranja/rosa)
├── lib/                → cliente de Supabase
├── pages/              → Landing, Emparejar, y las 6 pestañas de la app
supabase/
└── schema.sql          → todo el esquema de base de datos + seguridad + realtime
```

## 7. Estado de las pestañas

- [x] Calendario: vista de mes + eventos con hora/notas/marca de "importante" + realtime
- [x] Diario: calendario + texto + subida de varias imágenes por día + realtime
- [x] Banco Emocional: Depósitos / Retiros / Plan de Acción por día + realtime
- [x] Mapa: click en el mapa para agregar pin de color (rojo/verde/azul) + leyenda + realtime
- [x] Estado: botón "Nuestro Amor" con frase aleatoria + banco de frases ampliable
- [x] Configuración: editar nombre, foto de perfil y tema

### Posibles mejoras futuras
- Notificaciones push cuando la pareja agrega algo
- Editar/eliminar entradas del diario y del banco emocional (hoy solo se sobrescriben)
- Buscador dentro del diario
- Exportar el diario a PDF como regalo

## 8. Despliegue

**Frontend (Vercel, recomendado):**

1. Sube este proyecto a un repositorio de GitHub.
2. Entra a [vercel.com](https://vercel.com) → **New Project** → importa el repo.
3. En **Environment Variables**, agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los mismos valores de tu `.env.local`.
4. Deploy. Cada vez que hagas `git push`, Vercel actualiza la app automáticamente.

**Backend:** no necesitas desplegar nada — Supabase ya está alojado en la nube.

**Dominio propio (opcional):** compra un dominio (Namecheap, Google Domains, etc.) y apúntalo desde Vercel → Project → Settings → Domains.
