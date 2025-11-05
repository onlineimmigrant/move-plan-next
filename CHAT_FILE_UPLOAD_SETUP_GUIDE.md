# Chat File Upload - Quick Setup Guide

## Setup Steps (Execute in Order)

### 1. Create Storage Bucket (Supabase Dashboard)

**Option A: Via Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/rgbmdfaoowqbgshjuwwm/storage/buckets

2. Click "New Bucket"
3. Bucket name: `chat-files`
4. Public bucket: ✅ Yes
5. File size limit: `10485760` (10MB)
6. Allowed MIME types: Add these one by one:
   - `application/pdf`
   - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
   - `application/msword`
   - `text/plain`
   - `text/markdown`
   - `image/jpeg`
   - `image/png`
   - `image/gif`
   - `image/webp`
7. Click "Create bucket"

**Option B: Via SQL (faster)**
Run this in Supabase SQL Editor:
```sql
-- Run the migration file
\i /database/migrations/009_create_chat_files_storage.sql
```

Or copy the SQL from: `/database/migrations/009_create_chat_files_storage.sql`

---

### 2. Verify Tables Exist

Run in Supabase SQL Editor:
```sql
-- Check if chat_files table exists
SELECT * FROM chat_files LIMIT 1;

-- Check if user_storage_quota table exists
SELECT * FROM user_storage_quota LIMIT 1;

-- If user_storage_quota doesn't exist, create it:
CREATE TABLE IF NOT EXISTS public.user_storage_quota (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_usage BIGINT DEFAULT 0,
  max_quota BIGINT DEFAULT 52428800,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for automatic quota updates
CREATE OR REPLACE FUNCTION update_user_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_storage_quota (user_id, current_usage)
    VALUES (NEW.user_id, NEW.file_size)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      current_usage = user_storage_quota.current_usage + NEW.file_size,
      updated_at = NOW();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_storage_quota
    SET 
      current_usage = GREATEST(0, current_usage - OLD.file_size),
      updated_at = NOW()
    WHERE user_id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_storage_usage ON chat_files;
CREATE TRIGGER trigger_update_storage_usage
AFTER INSERT OR DELETE ON chat_files
FOR EACH ROW
EXECUTE FUNCTION update_user_storage_usage();

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_chat_files()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM chat_files
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

---

### 3. Test File Upload

1. Start dev server: `npm run dev`
2. Open browser: http://localhost:3000
3. Log in to your account
4. Open chat widget (AI Agent icon)
5. **Look for the paperclip (📎) icon** in the chat input area (bottom left, next to search/save buttons)
6. Click the paperclip icon
7. Select a test file (PDF, TXT, or image)
8. Verify:
   - ✅ File appears as a badge above the input field
   - ✅ You can remove the file by clicking the X
   - ✅ Multiple files can be attached
   - ✅ Files preview inline in chat messages (images and PDFs)
   - ✅ **Double-click on preview to view fullscreen (desktop)**
   - ✅ **Tap fullscreen button in top-right corner (mobile)**
   - ✅ Use left/right arrows or keyboard (← →) to navigate between multiple files
   - ✅ Press Escape or click outside to close fullscreen view

**Alternative: Use "Manage Files" for uploaded files**
- Click AI model dropdown → "Manage Files"
- This shows all previously uploaded files
- You can select files from here to attach to chat
- Shows storage quota and allows file deletion

---

### 4. Test File Operations

#### Upload Multiple Files
1. Upload 2-3 different file types
2. Check storage quota bar color changes

#### View Files
1. Files preview inline in chat messages
2. **Desktop: Double-click any image or PDF to view fullscreen**
3. **Mobile: Tap the fullscreen button (⛶) in the top-right corner**
4. Use left/right arrows or keyboard (← →) to navigate between files
5. Press Escape or click outside to close fullscreen
6. Hover over preview to see "Double-click to enlarge" hint (desktop)

#### Select Files
1. Check boxes next to files
2. Click "Add to Chat (N)"
3. Check browser console for: `Files selected for chat: [...]`

#### Delete File
1. Click trash icon
2. Confirm deletion
3. Verify storage quota decreased

---

### 5. Verify Security (RLS Policies)

Test with two different users:

**User A:**
1. Log in as User A
2. Upload a file
3. Note the file ID

**User B:**
1. Log in as User B
2. Try to access User A's file directly (paste URL)
3. Should see: ❌ Access denied or 404

**Expected:** Users can only see/manage their own files.

---

### 6. Monitor Storage (SQL Queries)

```sql
-- Total files and storage per user
SELECT 
  p.email,
  COUNT(cf.id) AS file_count,
  COALESCE(SUM(cf.file_size), 0) / 1024 / 1024 AS usage_mb
FROM profiles p
LEFT JOIN chat_files cf ON cf.user_id = p.id
GROUP BY p.email
ORDER BY usage_mb DESC;

-- Files expiring in next 2 days
SELECT 
  p.email,
  cf.file_name,
  cf.expires_at,
  AGE(cf.expires_at, NOW()) AS time_until_expire
FROM chat_files cf
JOIN profiles p ON p.id = cf.user_id
WHERE cf.expires_at < NOW() + INTERVAL '2 days'
ORDER BY cf.expires_at;

-- Users over 80% quota
SELECT 
  p.email,
  q.current_usage / 1024 / 1024 AS usage_mb,
  q.max_quota / 1024 / 1024 AS max_mb,
  ROUND((q.current_usage::numeric / q.max_quota) * 100, 2) AS usage_percent
FROM user_storage_quota q
JOIN profiles p ON p.id = q.user_id
WHERE (q.current_usage::numeric / q.max_quota) > 0.8
ORDER BY usage_percent DESC;
```

---

## Troubleshooting

### Problem: "Failed to upload file"

**Check:**
1. Storage bucket `chat-files` exists?
   ```sql
   SELECT * FROM storage.buckets WHERE name = 'chat-files';
   ```
2. User is authenticated?
3. File size < 10MB?
4. File type allowed?

**Fix:**
- Create bucket (see Step 1)
- Check browser console for error details
- Verify MIME types in bucket settings

---

### Problem: "Unauthorized" error

**Check:**
1. User logged in?
2. Access token valid?
3. RLS policies exist?

**Fix:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'chat_files';

-- Should show: rowsecurity = true

-- Recreate policies if missing
-- (Copy from Step 2 or migration file)
```

---

### Problem: Storage quota not updating

**Check:**
1. Trigger exists?
   ```sql
   SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_update_storage_usage';
   ```
2. Quota table exists?
   ```sql
   SELECT * FROM user_storage_quota LIMIT 1;
   ```

**Fix:**
- Run trigger creation SQL from Step 2
- Manually recalculate quotas:
  ```sql
  INSERT INTO user_storage_quota (user_id, current_usage)
  SELECT user_id, SUM(file_size)
  FROM chat_files
  GROUP BY user_id
  ON CONFLICT (user_id) DO UPDATE
  SET current_usage = EXCLUDED.current_usage;
  ```

---

### Problem: Files not deleting from storage

**Check:**
1. Storage policies allow DELETE?
2. Service role key set in `.env`?

**Fix:**
```sql
-- Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'chat-files';

-- Add DELETE policy if missing
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Production Checklist

Before deploying to production:

- [ ] Storage bucket created
- [ ] All tables exist (chat_files, user_storage_quota)
- [ ] RLS policies enabled and tested
- [ ] Storage policies configured
- [ ] Triggers created (quota update, cleanup)
- [ ] Environment variables set (SUPABASE_SERVICE_ROLE_KEY)
- [ ] File upload tested (multiple file types)
- [ ] File deletion tested
- [ ] Quota enforcement tested
- [ ] Security tested (cross-user access blocked)
- [ ] Build successful (`npm run build`)
- [ ] No console errors

---

## Next Steps

### Immediate:
1. ✅ Complete setup (Steps 1-2 above)
2. ✅ Test file upload (Step 3)
3. ⏳ Integrate file content into chat API (see main documentation)

### Short-term:
4. Add scheduled cleanup job (pg_cron or Vercel Cron)
5. Set up monitoring/alerts for storage usage
6. Add file parsing libraries (pdf-parse, mammoth)

### Long-term:
7. Implement file preview
8. Add drag-drop upload
9. Integrate Vision API for image analysis

---

## Support

**Documentation:** See `CHAT_FILE_UPLOAD_IMPLEMENTATION.md` for complete details

**Quick Links:**
- API Routes: `/api/chat/files/*`
- Components: `/src/components/modals/ChatWidget/ChatFilesList.tsx`
- Database: `/database/migrations/009_create_chat_files_storage.sql`

**Need Help?** Check the troubleshooting section above or review error logs in:
- Browser console (F12)
- Supabase logs (Dashboard → Logs)
- Server logs (terminal running `npm run dev`)
