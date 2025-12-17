-- Add columns to track order modifications
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_modified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_total_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS modification_note TEXT;

-- Add column to track original quantity in order_items
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS original_quantity INTEGER;

-- Update existing orders to set original_total_amount
UPDATE public.orders 
SET original_total_amount = total_amount
WHERE original_total_amount IS NULL;

-- Create index for modified orders
CREATE INDEX IF NOT EXISTS idx_orders_is_modified ON public.orders(is_modified);

-- Add comment
COMMENT ON COLUMN public.orders.is_modified IS 'Flag to indicate if order has been modified by shop owner';
COMMENT ON COLUMN public.orders.original_total_amount IS 'Original order total before modification';
COMMENT ON COLUMN public.orders.modification_note IS 'Note about what was modified';
COMMENT ON COLUMN public.order_items.original_quantity IS 'Original quantity before modification';
