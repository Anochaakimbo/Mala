-- Create storage bucket for payment slips
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-slips', 'payment-slips', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy for payment slips bucket
CREATE POLICY "payment_slips_select_all"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-slips');

CREATE POLICY "payment_slips_insert_all"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-slips');

CREATE POLICY "payment_slips_update_all"
ON storage.objects FOR UPDATE
USING (bucket_id = 'payment-slips');

CREATE POLICY "payment_slips_delete_all"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-slips');
