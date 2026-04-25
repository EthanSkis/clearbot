-- =============================================================
-- Documents storage bucket + per-workspace folder isolation
-- =============================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 52428800)
on conflict (id) do nothing;

drop policy if exists "documents_select" on storage.objects;
create policy "documents_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and exists (
      select 1 from public.documents d
      where d.storage_path = storage.objects.name
        and public.is_workspace_member(d.workspace_id)
    )
  );

drop policy if exists "documents_insert" on storage.objects;
create policy "documents_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] in (
      select id::text from public.workspaces where public.is_workspace_member(id)
    )
  );

drop policy if exists "documents_delete" on storage.objects;
create policy "documents_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] in (
      select id::text from public.workspaces where public.is_workspace_member(id)
    )
  );
