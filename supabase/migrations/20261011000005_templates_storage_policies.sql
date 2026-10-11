-- The superadmin uploads each entity's original formats (logos, header, footer) from the panel to the
-- private bucket `templates` (<entity>/<kind>.docx); the worker reads them with service_role.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'objects') then
    execute $p$create policy panel_templates_read on storage.objects for select to authenticated
      using (bucket_id = 'templates' and public.is_staff())$p$;
    execute $p$create policy panel_templates_write on storage.objects for insert to authenticated
      with check (bucket_id = 'templates' and public.is_superadmin())$p$;
    execute $p$create policy panel_templates_update on storage.objects for update to authenticated
      using (bucket_id = 'templates' and public.is_superadmin())
      with check (bucket_id = 'templates' and public.is_superadmin())$p$;
    execute $p$create policy panel_templates_delete on storage.objects for delete to authenticated
      using (bucket_id = 'templates' and public.is_superadmin())$p$;
  else
    raise notice 'storage schema not available: storage policies skipped';
  end if;
end $$;
