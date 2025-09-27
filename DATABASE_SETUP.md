# Database Setup Instructions

## 🚀 Setting up Real Activity Tracking

The Recent Activity widget currently shows sample data because the database table hasn't been created yet. Here's how to set up real activity tracking:

### Option 1: Using the Migration Script (Recommended)

1. **Add your Supabase Database URL to `.env.local`:**
   ```bash
   # Add this line to your .env.local file:
   SUPABASE_DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
   ```

2. **Run the migration:**
   ```bash
   ./run-migration.sh
   ```

### Option 2: Manual SQL Execution

1. **Open your Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste the contents of `database/migrations/002_organization_activities.sql`**
4. **Click "Run" to execute the migration**

### Option 3: Using Supabase CLI (if installed)

```bash
# Link your project
supabase link --project-ref [YOUR_PROJECT_ID]

# Run migration
supabase db push
```

### ✅ What the Migration Creates:

- **`organization_activities` table** for tracking all user actions
- **Row Level Security policies** for proper permissions
- **Database indexes** for optimal performance
- **Sample activity data** for testing

### 🔍 Verification:

After running the migration, the Recent Activity section will:
- ✅ Show real database activities instead of samples
- ✅ Remove the "Using Sample Data" warning
- ✅ Display actual timestamps and user actions
- ✅ Update in real-time when actions are performed

### 📊 What Gets Tracked:

- Organization creation
- Organization updates
- Site deployments
- Organization deletions
- User information for each action
- Precise timestamps

### 🎯 Current Status:

- ⚠️ **Database table not created** - showing sample data
- ✅ **API endpoints ready** - `/api/activities` (GET/POST)
- ✅ **UI components ready** - will automatically switch to real data
- ✅ **Activity logging ready** - delete actions already implemented

Run the migration to unlock real-time activity tracking!
