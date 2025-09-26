-- Seed mapping for brand 'efigence' to industry 'DigitalTech'
-- Safe upsert; keeps status manual and updates timestamp
insert into public.brand_industries (brand_slug, industry, status, updated_by, note)
values ('efigence','DigitalTech','manual','migration_0017', '{"source":"migration"}'::jsonb)
on conflict (brand_slug) do update set
  industry = excluded.industry,
  status = 'manual',
  updated_by = 'migration_0017',
  updated_at = now();
