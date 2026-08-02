-- ============================================
-- PARCHE: corrige recursión infinita en RLS
-- Ejecuta esto en Supabase → SQL Editor
-- (vuelve a activar RLS si lo desactivaste)
-- ============================================

alter table usuarios enable row level security;
alter table parejas enable row level security;

-- Elimina las políticas viejas que causaban el loop
drop policy if exists "ver perfiles propios y de pareja" on usuarios;
drop policy if exists "buscar por codigo de invitacion" on usuarios;

-- Función que obtiene MI pareja_id sin volver a disparar RLS (evita la recursión)
create or replace function mi_pareja_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select pareja_id from usuarios where id = auth.uid();
$$;

-- Ahora las políticas usan la función en vez de una subconsulta directa a "usuarios"
create policy "ver mi perfil y el de mi pareja" on usuarios
  for select using (
    id = auth.uid()
    or pareja_id = mi_pareja_id()
    or codigo_invitacion is not null  -- necesario para buscar por código al emparejar
  );

-- (las políticas de update/insert de usuarios y las de "parejas" quedan igual, no se tocan)
