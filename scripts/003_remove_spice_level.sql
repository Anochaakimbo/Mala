-- Remove spice_level column from menu_items table
alter table public.menu_items drop column if exists spice_level;
