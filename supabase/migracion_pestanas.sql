-- ============================================
-- MIGRACIÓN: aplica esto si ya habías corrido schema.sql antes
-- (agrega lo necesario para que las 6 pestañas funcionen)
-- ============================================

-- 1. Restricción única para el upsert diario de Banco Emocional
alter table banco_emocional
  add constraint banco_emocional_pareja_fecha_unique unique (pareja_id, fecha);

-- 2. Buckets de Storage
insert into storage.buckets (id, name, public)
values ('fotos-diario', 'fotos-diario', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('fotos-perfil', 'fotos-perfil', true)
on conflict (id) do nothing;

create policy "lectura publica fotos diario" on storage.objects
  for select using (bucket_id = 'fotos-diario');

create policy "lectura publica fotos perfil" on storage.objects
  for select using (bucket_id = 'fotos-perfil');

create policy "usuarios autenticados suben fotos diario" on storage.objects
  for insert with check (bucket_id = 'fotos-diario' and auth.role() = 'authenticated');

create policy "usuarios autenticados borran fotos diario" on storage.objects
  for delete using (bucket_id = 'fotos-diario' and auth.role() = 'authenticated');

create policy "usuarios autenticados suben foto perfil" on storage.objects
  for insert with check (bucket_id = 'fotos-perfil' and auth.role() = 'authenticated');

create policy "usuarios autenticados actualizan foto perfil" on storage.objects
  for update using (bucket_id = 'fotos-perfil' and auth.role() = 'authenticated');

-- 3. No olvides correr también parche_rls.sql si aún no lo has hecho
