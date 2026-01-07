-- Create the storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('inventory-items', 'inventory-items', true)
on conflict (id) do nothing;

-- Remove existing policies to avoid conflicts
drop policy if exists "inventory_items_select_policy" on storage.objects;
drop policy if exists "inventory_items_insert_policy" on storage.objects;
drop policy if exists "inventory_items_update_policy" on storage.objects;
drop policy if exists "inventory_items_delete_policy" on storage.objects;

-- RLS Policies

-- Public Read Access
create policy "inventory_items_select_policy"
  on storage.objects for select
  using ( bucket_id = 'inventory-items' );

-- Authenticated Insert Access (Student Upload)
create policy "inventory_items_insert_policy"
  on storage.objects for insert
  with check (
    bucket_id = 'inventory-items'
    and auth.role() = 'authenticated'
  );

-- Owner Update Access
create policy "inventory_items_update_policy"
  on storage.objects for update
  using (
    bucket_id = 'inventory-items' 
    and auth.uid() = owner
  );

-- Owner Delete Access
create policy "inventory_items_delete_policy"
  on storage.objects for delete
  using (
    bucket_id = 'inventory-items'
    and auth.uid() = owner
  );
