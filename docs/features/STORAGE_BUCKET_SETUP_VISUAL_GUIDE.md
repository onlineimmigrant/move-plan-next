# Storage Bucket Setup Guide - Visual Walkthrough

## Quick Setup (5 Minutes)

### Step 1: Create the Bucket

1. **Go to Supabase Dashboard**
   - Open your project at https://supabase.com
   - Click on **Storage** in the left sidebar

2. **Create New Bucket**
   - Click the **"New bucket"** or **"Create bucket"** button
   - Fill in the form:

   ```
   Bucket name: ticket-attachments
   ✓ Make bucket private (IMPORTANT - leave unchecked for public)
   ```

3. **Configure Bucket Settings**
   - File size limit: `10485760` (10MB in bytes)
   - Allowed MIME types (add these one by one):
     - `image/*`
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.*`
     - `text/plain`

4. **Click "Create bucket"**

---

### Step 2: Add Storage Policies

After creating the bucket, you need to add RLS policies:

1. **Navigate to Policies**
   - Click on the `ticket-attachments` bucket
   - Click on the **"Policies"** tab
   - You should see "No policies created yet"

2. **Create 6 Policies** (one at a time)

#### Policy 1: Users Can Upload to Their Folders
```
Name: Users can upload to their ticket folders
Operations: ✓ INSERT
Policy: Custom

USING expression:
bucket_id = 'ticket-attachments' AND (storage.foldername(name))[1] = auth.uid()::text

WITH CHECK expression:
bucket_id = 'ticket-attachments' AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 2: Admins Can Upload Anywhere
```
Name: Admins can upload to any folder
Operations: ✓ INSERT
Policy: Custom

USING expression:
bucket_id = 'ticket-attachments' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')

WITH CHECK expression:
(same as USING)
```

#### Policy 3: Users Can View Their Files
```
Name: Users can view their ticket files
Operations: ✓ SELECT
Policy: Custom

USING expression:
bucket_id = 'ticket-attachments' AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 4: Admins Can View All Files
```
Name: Admins can view all files
Operations: ✓ SELECT
Policy: Custom

USING expression:
bucket_id = 'ticket-attachments' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
```

#### Policy 5: Users Can Delete Their Files
```
Name: Users can delete their own files
Operations: ✓ DELETE
Policy: Custom

USING expression:
bucket_id = 'ticket-attachments' AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 6: Admins Can Delete Any File
```
Name: Admins can delete any file
Operations: ✓ DELETE
Policy: Custom

USING expression:
bucket_id = 'ticket-attachments' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
```

---

### Step 3: Verify Setup

Check that everything is configured:

- [ ] Bucket name is exactly: `ticket-attachments`
- [ ] Bucket is **private** (not public)
- [ ] File size limit is `10485760` bytes (10MB)
- [ ] MIME types are configured
- [ ] All 6 policies are created and **enabled** (green checkmark)

---

## Simplified Setup (For Testing Only)

If you want to test quickly without all the policies, you can create ONE simple policy:

**Name:** Allow authenticated users full access (testing only)
**Operations:** ✓ SELECT, ✓ INSERT, ✓ DELETE
**Policy:** Custom

**USING expression:**
```sql
bucket_id = 'ticket-attachments'
```

**WITH CHECK expression:**
```sql
bucket_id = 'ticket-attachments'
```

⚠️ **WARNING:** This allows ANY authenticated user to access ANY file. Use only for testing! Replace with the 6 detailed policies for production.

---

## File Path Structure

Files will be uploaded with this structure:
```
ticket-attachments/
  └── {user_id}/
      └── {ticket_id}/
          └── {timestamp}_{filename}
```

Example:
```
ticket-attachments/
  └── abc123-user-id/
      └── ticket-789/
          └── 1697654321_screenshot.png
```

This structure ensures:
- ✅ Users can only access their own tickets (enforced by RLS)
- ✅ Files are organized by ticket
- ✅ No filename conflicts (timestamp prefix)
- ✅ Easy to find and manage files

---

## Troubleshooting

### Upload Fails with "Policy violation"
- Check that the user is authenticated
- Verify the file path starts with `{auth.uid()}/`
- Make sure policies are enabled (green checkmark in dashboard)

### Upload Fails with "File size too large"
- Check file is under 10MB
- Verify bucket file size limit is set to `10485760`

### Upload Fails with "Invalid MIME type"
- Check file type is in the allowed list
- Add the MIME type to the bucket configuration

### Cannot Download Files
- Check SELECT policies are created
- Verify user has access to the ticket
- Check browser console for specific error

---

## Next Steps

After completing the storage setup:

1. ✅ Run `add_file_attachments_to_tickets.sql` (if not done already)
2. ✅ Complete this storage bucket setup
3. ⏭️ Continue with Phase 2 implementation (utility functions and UI)
