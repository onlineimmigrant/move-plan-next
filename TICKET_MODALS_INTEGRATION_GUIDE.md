# How to Trigger Ticket Modals

## ✅ **Already Integrated!**

The ticket modals are now available throughout your app:

### 1. **Account Area** (Customer Tickets)
- **Floating Button**: A ticket icon button appears in the bottom-right corner
- **Location**: Available on all `/account/*` pages
- **Position**: `bottom-4 right-20` (next to ChatWidget)
- **Icon**: Ticket icon with hover rotation effect

### 2. **Admin Area** (Admin Ticket Management)
- **Floating Button**: A gear/cog icon button appears in the bottom-right corner
- **Location**: Available on all `/admin/*` pages  
- **Position**: `bottom-20 right-4` (stacked above other modals)
- **Icon**: Cog icon with hover rotation effect

---

## 🎯 **Alternative Integration Methods**

### Option A: Add to Specific Pages

Add the toggle button directly to any page component:

\`\`\`tsx
import TicketsAccountToggleButton from '@/components/modals/TicketsAccountModal/TicketsAccountToggleButton';

export default function MyPage() {
  return (
    <div>
      {/* Your page content */}
      <TicketsAccountToggleButton />
    </div>
  );
}
\`\`\`

### Option B: Custom Trigger Button

Create your own trigger instead of the floating button:

\`\`\`tsx
'use client';
import { useState } from 'react';
import TicketsAccountModal from '@/components/modals/TicketsAccountModal/TicketsAccountModal';

export default function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Custom button - can be anywhere in your UI */}
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        View Support Tickets
      </button>

      <TicketsAccountModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
\`\`\`

### Option C: Add to Navigation Menu

Add to your header/nav component:

\`\`\`tsx
import TicketsAccountToggleButton from '@/components/modals/TicketsAccountModal/TicketsAccountToggleButton';

export default function Header() {
  return (
    <nav>
      {/* ... other nav items ... */}
      <div className="flex items-center gap-4">
        <TicketsAccountToggleButton />
      </div>
    </nav>
  );
}
\`\`\`

### Option D: Programmatically Open

Control modal state from parent component:

\`\`\`tsx
'use client';
import { useState } from 'react';
import TicketsAccountModal from '@/components/modals/TicketsAccountModal/TicketsAccountModal';

export default function Dashboard() {
  const [isTicketsOpen, setIsTicketsOpen] = useState(false);

  const handleNewTicketNotification = () => {
    setIsTicketsOpen(true); // Open automatically on notification
  };

  return (
    <div>
      <button onClick={() => setIsTicketsOpen(true)}>
        Support
      </button>
      
      <TicketsAccountModal 
        isOpen={isTicketsOpen} 
        onClose={() => setIsTicketsOpen(false)} 
      />
    </div>
  );
}
\`\`\`

---

## 📍 **Current Button Positions**

The floating buttons are positioned to stack nicely with other modal buttons:

\`\`\`
Right side of screen:
┌─────────────────────────┐
│                         │
│                    [?]  │ ← ChatHelpWidget (bottom-4 right-4)
│                    [💬] │ ← ChatWidget (bottom-4 right-24)
│                    [🎫] │ ← TicketsAccount (bottom-4 right-20)
│               [⚙️]      │ ← TicketsAdmin (bottom-20 right-4)
└─────────────────────────┘
\`\`\`

---

## 🎨 **Customizing Button Appearance**

Edit the toggle button files to change styling:
- `/components/modals/TicketsAccountModal/TicketsAccountToggleButton.tsx`
- `/components/modals/TicketsAdminModal/TicketsAdminToggleButton.tsx`

Change position, icon, colors, or behavior as needed!

---

## ✨ **Try It Now!**

The buttons should already be visible when you navigate to:
- **Customer**: `/account/profile` or any account page
- **Admin**: `/admin` or any admin page

Just look for the floating buttons in the bottom-right corner! 🚀
