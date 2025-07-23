-- Create storage bucket for maintenance media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('maintenance-media', 'maintenance-media', true);

-- Create storage policies for maintenance media uploads
CREATE POLICY "Anyone can upload maintenance media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'maintenance-media');

CREATE POLICY "Anyone can view maintenance media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'maintenance-media');

CREATE POLICY "Anyone can update maintenance media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'maintenance-media');

CREATE POLICY "Anyone can delete maintenance media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'maintenance-media');