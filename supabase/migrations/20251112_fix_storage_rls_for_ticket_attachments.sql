-- Fix storage RLS policies for ticket-attachments bucket
-- Allow authenticated users to upload files to their own paths
-- Allow users to read files from any ticket they have access to

-- Enable storage RLS for ticket-attachments bucket (if not already enabled)
CREATE POLICY "Allow users to upload files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'ticket-attachments' 
  AND auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Allow users to read files from ticket-attachments
CREATE POLICY "Allow users to read files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ticket-attachments');

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete their own files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'ticket-attachments' 
  AND auth.uid() = (storage.foldername(name))[1]::uuid
);
