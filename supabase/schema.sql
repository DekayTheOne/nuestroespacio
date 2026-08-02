-- ============================================
-- ESQUEMA: Nuestro Espacio
-- Ejecutar en Supabase → SQL Editor
-- ============================================

-- Tabla de usuarios (extiende auth.users)
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  foto_url text,
  tema_preferido text default 'naranja',
  codigo_invitacion text unique,
  pareja_id uuid,
  creado_en timestamptz default now()
);

-- Tabla de parejas (vincula a dos usuarios)
create table parejas (
  id uuid primary key default gen_random_uuid(),
  usuario1_id uuid references usuarios(id) on delete cascade,
  usuario2_id uuid references usuarios(id) on delete cascade,
  creado_en timestamptz default now()
);

alter table usuarios
  add constraint fk_pareja foreign key (pareja_id) references parejas(id) on delete set null;

-- Eventos de calendario
create table eventos_calendario (
  id uuid primary key default gen_random_uuid(),
  pareja_id uuid references parejas(id) on delete cascade,
  titulo text not null,
  fecha date not null,
  hora time,
  descripcion text,
  es_importante boolean default false,
  creado_por uuid references usuarios(id),
  creado_en timestamptz default now()
);

-- Entradas del diario
create table entradas_diario (
  id uuid primary key default gen_random_uuid(),
  pareja_id uuid references parejas(id) on delete cascade,
  fecha date not null,
  texto text,
  imagenes text[] default '{}',
  creado_por uuid references usuarios(id),
  creado_en timestamptz default now(),
  unique (pareja_id, fecha)
);

-- Banco emocional
create table banco_emocional (
  id uuid primary key default gen_random_uuid(),
  pareja_id uuid references parejas(id) on delete cascade,
  fecha date not null,
  depositos text,
  retiros text,
  plan_accion text,
  creado_por uuid references usuarios(id),
  creado_en timestamptz default now(),
  unique (pareja_id, fecha)
);

-- Pines del mapa
create table pines_mapa (
  id uuid primary key default gen_random_uuid(),
  pareja_id uuid references parejas(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  color text check (color in ('rojo', 'verde', 'azul')) not null,
  nota text,
  creado_por uuid references usuarios(id),
  creado_en timestamptz default now()
);

-- Banco de frases (Estado / "Nuestro Amor")
create table banco_frases (
  id uuid primary key default gen_random_uuid(),
  pareja_id uuid references parejas(id) on delete cascade,
  frase text not null,
  creado_por uuid references usuarios(id),
  creado_en timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- Regla general: un usuario solo ve/edita filas
-- cuyo pareja_id coincide con SU pareja_id.
-- ============================================

alter table usuarios enable row level security;
alter table parejas enable row level security;
alter table eventos_calendario enable row level security;
alter table entradas_diario enable row level security;
alter table banco_emocional enable row level security;
alter table pines_mapa enable row level security;
alter table banco_frases enable row level security;

-- Función que obtiene MI pareja_id sin volver a disparar RLS sobre "usuarios"
-- (evita la recursión infinita: una política de "usuarios" no puede hacer
-- una subconsulta directa a "usuarios" sin pasar por una función security definer)
create or replace function mi_pareja_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select pareja_id from usuarios where id = auth.uid();
$$;

-- usuarios: cada quien ve su propia fila, la de su pareja, o busca por código
create policy "ver mi perfil y el de mi pareja" on usuarios
  for select using (
    id = auth.uid()
    or pareja_id = mi_pareja_id()
    or codigo_invitacion is not null
  );

create policy "actualizar mi propio perfil" on usuarios
  for update using (id = auth.uid());

create policy "insertar mi propio perfil al registrarme" on usuarios
  for insert with check (id = auth.uid());

-- parejas
create policy "ver mi pareja" on parejas
  for select using (
    usuario1_id = auth.uid() or usuario2_id = auth.uid()
  );

create policy "crear vinculo de pareja" on parejas
  for insert with check (
    usuario1_id = auth.uid() or usuario2_id = auth.uid()
  );

-- Plantilla de política reutilizada en las tablas de contenido compartido
-- (usa la función mi_pareja_id() definida arriba)
create policy "acceso compartido eventos" on eventos_calendario
  for all using (pareja_id = mi_pareja_id())
  with check (pareja_id = mi_pareja_id());

create policy "acceso compartido diario" on entradas_diario
  for all using (pareja_id = mi_pareja_id())
  with check (pareja_id = mi_pareja_id());

create policy "acceso compartido banco emocional" on banco_emocional
  for all using (pareja_id = mi_pareja_id())
  with check (pareja_id = mi_pareja_id());

create policy "acceso compartido pines" on pines_mapa
  for all using (pareja_id = mi_pareja_id())
  with check (pareja_id = mi_pareja_id());

create policy "acceso compartido frases" on banco_frases
  for all using (pareja_id = mi_pareja_id())
  with check (pareja_id = mi_pareja_id());

-- ============================================
-- REALTIME
-- Activa la sincronización en vivo entre ambos usuarios
-- ============================================
alter publication supabase_realtime add table eventos_calendario;
alter publication supabase_realtime add table entradas_diario;
alter publication supabase_realtime add table banco_emocional;
alter publication supabase_realtime add table pines_mapa;
alter publication supabase_realtime add table banco_frases;

-- ============================================
-- STORAGE: buckets para fotos del diario y de perfil
-- ============================================
insert into storage.buckets (id, name, public)
values ('fotos-diario', 'fotos-diario', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('fotos-perfil', 'fotos-perfil', true)
on conflict (id) do nothing;

-- Lectura pública (para que las imágenes se puedan mostrar con su URL)
create policy "lectura publica fotos diario" on storage.objects
  for select using (bucket_id = 'fotos-diario');

create policy "lectura publica fotos perfil" on storage.objects
  for select using (bucket_id = 'fotos-perfil');

-- Solo usuarios autenticados pueden subir/editar/borrar
create policy "usuarios autenticados suben fotos diario" on storage.objects
  for insert with check (bucket_id = 'fotos-diario' and auth.role() = 'authenticated');

create policy "usuarios autenticados borran fotos diario" on storage.objects
  for delete using (bucket_id = 'fotos-diario' and auth.role() = 'authenticated');

create policy "usuarios autenticados suben foto perfil" on storage.objects
  for insert with check (bucket_id = 'fotos-perfil' and auth.role() = 'authenticated');

create policy "usuarios autenticados actualizan foto perfil" on storage.objects
  for update using (bucket_id = 'fotos-perfil' and auth.role() = 'authenticated');
