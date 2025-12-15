-- Create storage bucket for menu images
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true);

-- Allow public read access to menu images
create policy "menu_images_public_read"
  on storage.objects for select
  using (bucket_id = 'menu-images');

-- Allow anyone to upload menu images (for now)
-- In production, you'd want to restrict this to admin users
create policy "menu_images_public_upload"
  on storage.objects for insert
  with check (bucket_id = 'menu-images');

-- Allow anyone to update menu images
create policy "menu_images_public_update"
  on storage.objects for update
  using (bucket_id = 'menu-images');

-- Allow anyone to delete menu images
create policy "menu_images_public_delete"
  on storage.objects for delete
  using (bucket_id = 'menu-images');
