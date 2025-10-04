@@ .. @@
 -- Create storage buckets
+-- Drop existing buckets if they exist (this will be ignored if they don't exist)
+DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
+DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
+DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
+DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
+DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
+DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
+DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
+
 INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
 VALUES 
   ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),