-- Seed mapping for brand 'depot' to industry 'SaaS'
-- Safe upsert; keeps status manual and updates timestamp
insert into public.brand_industries (brand_slug, industry, status, updated_by, note)
values ('depot','SaaS','manual','migration_0015', '{"source":"migration"}'::jsonb)
on conflict (brand_slug) do update set
  industry = excluded.industry,
  status = 'manual',
  updated_by = 'migration_0015',
  updated_at = now();
