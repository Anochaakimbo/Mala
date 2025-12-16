-- Add discount column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10, 2);

-- Update payment method check to only allow slip
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method = 'slip');

-- Make payment_slip_url required since we only accept slip now
ALTER TABLE public.orders ALTER COLUMN payment_slip_url SET NOT NULL;
