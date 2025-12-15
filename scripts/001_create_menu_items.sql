-- Create menu_items table for mala skewer menu
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  description text,
  price decimal(10,2) not null,
  image_url text,
  category text default 'ของเสียบ',
  spice_level integer default 1,
  is_available boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.menu_items enable row level security;

-- Public can read all menu items
create policy "menu_items_select_all"
  on public.menu_items for select
  using (true);

-- For now, allow anyone to insert/update/delete (admin functionality)
-- In production, you'd want to add admin user checks
create policy "menu_items_insert_all"
  on public.menu_items for insert
  with check (true);

create policy "menu_items_update_all"
  on public.menu_items for update
  using (true);

create policy "menu_items_delete_all"
  on public.menu_items for delete
  using (true);

-- Add some sample data
insert into public.menu_items (name, name_en, description, price, category, spice_level) values
  ('หมูสามชั้น', 'Pork Belly', 'หมูสามชั้นชิ้นใหญ่ หอมกรุ่น', 15.00, 'ของเสียบ', 3),
  ('ลูกชิ้นปลา', 'Fish Ball', 'ลูกชิ้นปลาสดใหม่', 10.00, 'ของเสียบ', 2),
  ('เต้าหู้', 'Tofu', 'เต้าหู้นุ่มชุ่มซอส', 8.00, 'ของเสียบ', 1),
  ('เห็ดเข็มทอง', 'Enoki Mushroom', 'เห็ดเข็มทองกรอบ', 12.00, 'ของเสียบ', 2),
  ('ไส้กรอก', 'Sausage', 'ไส้กรอกรมควัน', 15.00, 'ของเสียบ', 2),
  ('กุ้ง', 'Shrimp', 'กุ้งสดใหญ่', 25.00, 'ของเสียบ', 3),
  ('ปลาหมึก', 'Squid', 'ปลาหมึกสด', 20.00, 'ของเสียบ', 2),
  ('เนื้อวัว', 'Beef', 'เนื้อวัวชิ้นหนา', 30.00, 'ของเสียบ', 3);
