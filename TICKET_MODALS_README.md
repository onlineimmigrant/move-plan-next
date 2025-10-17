# Ticket Modal System - Complete Documentation

## 📋 Overview

The ticket modal system provides customer support functionality through two modals:
- **TicketsAccountModal**: Customer-facing support ticket interface
- **TicketsAdminModal**: Admin ticket management with advanced features

Both modals are designed to work gracefully even if optional features are unavailable.

---

## 🗄️ Database Requirements

### **Required Tables**

#### 1. `tickets` (REQUIRED)
Core table for storing support tickets.

```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  customer_id UUID REFERENCES auth.users(id),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  preferred_contact_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Status values**: `'open'`, `'in progress'`, `'closed'`

#### 2. `ticket_responses` (REQUIRED)
Stores conversation messages between customers and admins.

```sql
CREATE TABLE ticket_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  avatar_id UUID, -- Optional: references ticket_avatars
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Optional Tables**

#### 3. `ticket_avatars` (OPTIONAL)
Allows admins to respond as different support agents.

```sql
CREATE TABLE ticket_avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  image TEXT, -- URL or base64
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fallback**: If table doesn't exist, uses default "Support" avatar.

#### 4. `ticket_predefined_responses` (OPTIONAL - Admin only)
Quick reply templates for common responses.

```sql
CREATE TABLE ticket_predefined_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, title)
);
```

**Fallback**: If table doesn't exist, predefined responses section is hidden.

---

## ✨ Features

### **Customer Modal Features**
- ✅ View all support tickets (filtered by customer)
- ✅ Status-based tabs (In Progress, Open, Closed)
- ✅ Full conversation history
- ✅ Send messages/responses
- ✅ Real-time waiting indicator
- ✅ Mobile-responsive sidebar
- ✅ Auto-resizing textarea
- ✅ Size toggle (initial → half → fullscreen)

### **Admin Modal Features**
- ✅ All customer features +
- ✅ View ALL tickets (organization-wide)
- ✅ Real-time subscriptions (live updates)
- ✅ Change ticket status via dropdown
- ✅ Avatar selection (if available)
- ✅ Predefined response templates (if available)
- ✅ Customer information display
- ✅ Horizontal scrolling response badges

---

## 🚀 Setup Instructions

### **Step 1: Run Required Migrations**

You MUST have these tables:

```bash
# Run these SQL migrations in your Supabase SQL editor
1. Create tickets table
2. Create ticket_responses table
3. Set up RLS policies for both tables
```

### **Step 2: Run Optional Migrations** (Recommended)

For enhanced functionality:

```bash
# Run these migrations for additional features
./add_ticket_predefined_responses_table.sql
```

Then insert sample data:
```bash
# Edit the organization_id in the file first!
./insert_sample_predefined_responses.sql
```

### **Step 3: Verify Tables**

```sql
-- Check which tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ticket%';
```

### **Step 4: Test the Modals**

1. Navigate to `/account` - Customer modal button should appear
2. Navigate to `/admin` - Admin modal button should appear
3. Click to open modals
4. Check browser console for any errors

---

## 🔧 Error Handling

Both modals handle missing optional features gracefully:

### **Missing `ticket_avatars` table**
- ✅ Uses default "Support" avatar only
- ✅ No avatar selector shown in admin modal
- ✅ Customer responses show without avatar
- ⚠️ Console warning: `"Ticket avatars not available"`

### **Missing `ticket_predefined_responses` table**
- ✅ Predefined responses section completely hidden
- ✅ Admin can still type custom messages
- ⚠️ Console warning: `"Predefined responses not available"`

### **Real-time subscription issues**
- ✅ Modal works with manual refresh
- ✅ Can still send/receive messages
- ⚠️ Console warning: `"Real-time subscription error"`

---

## 📍 Integration

### **Current Integration**

Already integrated into layouts:
- `/app/[locale]/account/layout.tsx` - Customer modal toggle
- `/app/[locale]/admin/layout.tsx` - Admin modal toggle

### **Custom Integration**

Use the modal anywhere:

```tsx
'use client';
import { useState } from 'react';
import TicketsAccountModal from '@/components/modals/TicketsAccountModal/TicketsAccountModal';

export default function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Support</button>
      <TicketsAccountModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
```

---

## 🎨 Customization

### **Change Toggle Button Position**

Edit `TicketsAccountToggleButton.tsx` or `TicketsAdminToggleButton.tsx`:

```tsx
className="fixed bottom-4 right-20 ..." // Change bottom-4 or right-20
```

### **Add More Predefined Responses**

```sql
INSERT INTO ticket_predefined_responses (organization_id, title, message)
VALUES ('your-org-id', 'Custom Title', 'Your custom message here');
```

### **Customize Avatar**

```sql
INSERT INTO ticket_avatars (organization_id, title, full_name, image)
VALUES ('your-org-id', 'Support Agent', 'John Doe', 'https://...');
```

---

## 🐛 Troubleshooting

### **Modal doesn't open**
1. Check browser console for errors
2. Verify `isOpen` state is true
3. Check z-index conflicts (modals use z-[10000] and z-[10001])

### **No tickets showing**
1. Verify `tickets` table exists
2. Check RLS policies allow reading tickets
3. Verify `organization_id` matches in settings

### **Can't send responses**
1. Check `ticket_responses` table exists
2. Verify user is authenticated
3. Check RLS policies allow INSERT

### **Console errors about missing tables**
- ✅ If warnings only: Modal works with limited features
- ❌ If errors: Check required tables exist

---

## 📊 Data Flow

```
Customer Modal:
User opens modal → Fetch tickets (customer_id filter) → Display by status
User selects ticket → Show conversation → User sends message → Update UI

Admin Modal:
Admin opens modal → Fetch ALL tickets → Set up real-time subscription
Admin selects ticket → Show conversation + customer info
Admin selects avatar (if available) → Admin types message → Send with avatar_id
Admin clicks status dropdown → Update ticket status
```

---

## ✅ Testing Checklist

- [ ] Customer can see their tickets
- [ ] Customer can send responses
- [ ] Admin can see all tickets
- [ ] Admin can change ticket status
- [ ] Messages appear in correct order
- [ ] Timestamps display correctly
- [ ] Mobile sidebar toggles work
- [ ] Textarea auto-resizes
- [ ] Size toggle works (initial → half → fullscreen)
- [ ] Close button works
- [ ] Modal backdrop dismisses modal
- [ ] Real-time updates work (admin only)
- [ ] Predefined responses work (if table exists)
- [ ] Avatar selection works (if table exists)

---

## 📝 Migration Files

Available in root directory:
- `add_ticket_predefined_responses_table.sql` - Creates predefined responses table
- `insert_sample_predefined_responses.sql` - Adds sample response templates

Run these in Supabase SQL Editor for full functionality!

---

## 🆘 Support

If you encounter issues:
1. Check browser console for errors
2. Verify database tables exist
3. Check RLS policies are correct
4. Ensure user authentication is working
5. Review the TICKET_MODALS_INTEGRATION_GUIDE.md

For database schema issues, consult the SQL migration files provided.
