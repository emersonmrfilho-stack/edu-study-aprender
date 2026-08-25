ALTER TABLE public.premium_purchases ADD COLUMN IF NOT EXISTS receipt_path text;

CREATE POLICY "Users can upload own receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'comprovantes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own receipts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'comprovantes' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));

CREATE POLICY "Users can update own receipts"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'comprovantes' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'comprovantes' AND (storage.foldername(name))[1] = auth.uid()::text);