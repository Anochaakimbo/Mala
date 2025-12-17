-- Drop existing check constraint if exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- Add new check constraint with both 'slip' and 'cash' values
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN ('slip', 'cash'));

-- Make payment_slip_url nullable (allow NULL or empty string)
ALTER TABLE orders ALTER COLUMN payment_slip_url DROP NOT NULL;
