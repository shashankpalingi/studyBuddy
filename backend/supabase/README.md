# Supabase Storage Configuration 📦

This folder contains the Supabase configuration for Study Buddy's storage services.

## Overview

Study Buddy uses a hybrid architecture:
- **Firebase**: Authentication & Real-time Database (Firestore)
- **Supabase**: File Storage & Static Assets

## Storage Buckets

### `study-buddy-files` (Public Bucket)
Main storage bucket for all application files:

```
study-buddy-files/
├── studybuddy/
│   └── rooms/
│       └── [roomId]/
│           └── files/           # File sharing uploads
├── whiteboards/                 # Whiteboard saves
└── profile-pictures/            # User profile pictures
```

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for initialization to complete

### 2. Create Storage Bucket
1. Navigate to **Storage** in Supabase dashboard
2. Click **"New bucket"**
3. Configure:
   - **Name**: `study-buddy-files`
   - **Public bucket**: ✅ Enabled
   - **File size limit**: 10MB (optional)
   - **Allowed MIME types**: Leave empty for all types

### 3. Configure Storage Policies

Run this SQL in **SQL Editor**:

```sql
-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow all uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes" ON storage.objects;

-- Create permissive policies for Firebase Auth integration
CREATE POLICY "Allow all uploads" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'study-buddy-files');

CREATE POLICY "Allow all reads" ON storage.objects 
  FOR SELECT USING (bucket_id = 'study-buddy-files');

CREATE POLICY "Allow all updates" ON storage.objects 
  FOR UPDATE WITH CHECK (bucket_id = 'study-buddy-files');

CREATE POLICY "Allow all deletes" ON storage.objects 
  FOR DELETE USING (bucket_id = 'study-buddy-files');
```

### 4. Environment Variables

Add these to your frontend `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## API Usage

### Upload File
```typescript
import { uploadToSupabase } from '../lib/supabase-storage';

const result = await uploadToSupabase(file, 'folder/subfolder');
// Returns: { url, path, fullPath }
```

### Delete File
```typescript
import { deleteFromSupabase } from '../lib/supabase-storage';

await deleteFromSupabase(filePath);
```

## Security Considerations

### Current Setup (Development)
- **Public bucket** with permissive RLS policies
- Works with Firebase Authentication
- Suitable for development and testing

### Production Recommendations
1. **Implement custom authentication middleware**
2. **Add file type validation**
3. **Set up proper CORS policies**
4. **Monitor storage usage and costs**
5. **Consider implementing file size limits**

## Monitoring & Maintenance

### Dashboard Access
- **Storage Usage**: Monitor in Supabase Dashboard > Storage
- **API Logs**: Check Supabase Dashboard > Logs
- **Performance**: Monitor upload/download speeds

### Cleanup Tasks
```sql
-- Clean up old files (run periodically)
DELETE FROM storage.objects 
WHERE bucket_id = 'study-buddy-files' 
AND created_at < NOW() - INTERVAL '90 days'
AND name LIKE 'whiteboards/%';
```

## Troubleshooting

### Common Issues

#### Upload Fails with RLS Error
```bash
Error: new row violates row-level security policy
```
**Solution**: Verify storage policies are correctly configured (see Step 3)

#### Files Not Accessible
**Solution**: Ensure bucket is public or URL generation is correct

#### Large File Uploads Timeout
**Solution**: Implement chunked uploads or increase timeout limits

### Debug Mode
Enable verbose logging in `supabase-storage.ts`:
```typescript
const DEBUG_STORAGE = true; // Set to true for detailed logs
```

## Migration History

- **v1.0**: Migrated from Cloudinary to Supabase Storage
- **Previous**: Used Cloudinary for all file storage
- **Current**: Hybrid Firebase (auth/db) + Supabase (storage)

## Support

For issues related to:
- **Storage setup**: Check Supabase documentation
- **Authentication**: Refer to Firebase Auth docs
- **Integration**: See `frontend/src/lib/supabase-storage.ts`
