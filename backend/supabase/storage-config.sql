-- Supabase Storage Configuration for Study Buddy
-- This file contains all SQL commands needed to set up storage buckets and policies

-- ============================================================================
-- BUCKET CREATION
-- ============================================================================

-- Create the main storage bucket for Study Buddy files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'study-buddy-files',
  'study-buddy-files',
  true,
  10485760, -- 10MB file size limit
  NULL -- Allow all MIME types
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Create permissive policies for Firebase Auth integration
-- Note: These policies are permissive because we're using Firebase Auth
-- instead of Supabase Auth. In production, consider more restrictive policies.

-- Allow anyone to upload files to the study-buddy-files bucket
CREATE POLICY "Allow all uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'study-buddy-files');

-- Allow anyone to read/download files from the study-buddy-files bucket
CREATE POLICY "Allow all reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'study-buddy-files');

-- Allow anyone to update file metadata in the study-buddy-files bucket
CREATE POLICY "Allow all updates" ON storage.objects
  FOR UPDATE WITH CHECK (bucket_id = 'study-buddy-files');

-- Allow anyone to delete files from the study-buddy-files bucket
CREATE POLICY "Allow all deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'study-buddy-files');

-- ============================================================================
-- OPTIONAL: MORE RESTRICTIVE POLICIES (PRODUCTION READY)
-- ============================================================================
-- Uncomment these and comment out the above policies for production use
-- These require proper authentication headers to be sent with requests

/*
-- Only allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'study-buddy-files' AND
    auth.role() = 'authenticated'
  );

-- Allow public reads (downloads)
CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'study-buddy-files');

-- Only allow authenticated users to update
CREATE POLICY "Allow authenticated updates" ON storage.objects
  FOR UPDATE WITH CHECK (
    bucket_id = 'study-buddy-files' AND
    auth.role() = 'authenticated'
  );

-- Only allow authenticated users to delete
CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'study-buddy-files' AND
    auth.role() = 'authenticated'
  );
*/

-- ============================================================================
-- STORAGE MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to clean up old whiteboard saves (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_whiteboards()
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'study-buddy-files'
    AND name LIKE 'whiteboards/%'
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to get storage usage statistics
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS TABLE(
  total_files bigint,
  total_size_mb numeric,
  files_by_folder json
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_files,
    ROUND((SUM(metadata->>'size')::numeric / 1048576), 2) as total_size_mb,
    json_object_agg(
      split_part(name, '/', 1),
      folder_stats.file_count
    ) as files_by_folder
  FROM storage.objects,
  LATERAL (
    SELECT COUNT(*) as file_count
    FROM storage.objects o2
    WHERE o2.bucket_id = 'study-buddy-files'
      AND split_part(o2.name, '/', 1) = split_part(storage.objects.name, '/', 1)
  ) folder_stats
  WHERE bucket_id = 'study-buddy-files'
  GROUP BY folder_stats.file_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS (Optional - for advanced usage)
-- ============================================================================

-- Create a function to log file uploads
CREATE OR REPLACE FUNCTION log_file_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- You could insert into a custom logging table here
  -- For now, we'll just use PostgreSQL's built-in logging
  RAISE NOTICE 'File uploaded: % (% bytes)', NEW.name, NEW.metadata->>'size';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to log uploads (uncomment if needed)
-- CREATE TRIGGER storage_upload_log
--   AFTER INSERT ON storage.objects
--   FOR EACH ROW
--   WHEN (NEW.bucket_id = 'study-buddy-files')
--   EXECUTE FUNCTION log_file_upload();

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Example: Check storage usage
-- SELECT * FROM get_storage_stats();

-- Example: Clean up old whiteboards
-- SELECT cleanup_old_whiteboards();

-- Example: List all files in a specific folder
-- SELECT name, created_at, metadata->>'size' as size_bytes
-- FROM storage.objects
-- WHERE bucket_id = 'study-buddy-files'
--   AND name LIKE 'studybuddy/rooms/%';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Run this file in your Supabase SQL Editor
-- 2. Ensure you have sufficient permissions to create buckets and policies
-- 3. Test with a small file upload after running this configuration
-- 4. Monitor storage usage regularly
-- 5. Adjust file size limits based on your needs
