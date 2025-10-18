# Ticket Assignment Feature - Remaining Work

## Current Status
- ✅ SQL migration file created (`add_ticket_assignment_and_priority.sql`)
- ✅ fetchAdminUsers() and handleAssignTicket() functions created (needs to be re-added)
- ❌ File got corrupted during UI implementation, reverted to clean state
- ❌ Need to reapply all changes systematically

## What Needs To Be Done

### Step 1: Update Ticket Interface
Add to lines 23-34 in TicketsAdminModal.tsx:
```typescript
interface Ticket {
  id: string;
  subject: string;
  status: string;
  customer_id: string | null;
  created_at: string;
  message: string;
  preferred_contact_method: string | null;
  email: string;
  full_name?: string;
  assigned_to?: string | null;  // ADD THIS
  priority?: string;             // ADD THIS
  ticket_responses: TicketResponse[];
}
```

### Step 2: Add adminUsers State
Add after line 70 (after selectedAvatar state):
```typescript
const [adminUsers, setAdminUsers] = useState<{id: string; email: string; full_name?: string}[]>([]);
```

### Step 3: Update useEffect to call fetchAdminUsers
Add fetchAdminUsers(); call in the useEffect where fetchTickets() and fetchAvatars() are called

### Step 4: Add fetchAdminUsers Function
Add after fetchAvatars() function (around line 220):
```typescript
// Function to fetch admin users for ticket assignment
const fetchAdminUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('organization_id', settings.organization_id)
      .eq('role', 'admin')
      .order('full_name', { ascending: true});

    if (error) {
      console.error('Error fetching admin users:', error);
      return;
    }

    setAdminUsers(data || []);
  } catch (err) {
    console.error('Error fetching admin users:', err);
  }
};
```

### Step 5: Add handleAssignTicket Function
Add after fetchAdminUsers():
```typescript
// Function to assign ticket to an admin
const handleAssignTicket = async (ticketId: string, adminId: string | null) => {
  try {
    const { error } = await supabase
      .from('tickets')
      .update({ assigned_to: adminId })
      .eq('id', ticketId);

    if (error) throw error;

    // Update local state
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, assigned_to: adminId } 
          : ticket
      )
    );

    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, assigned_to: adminId } : null);
    }

    setToast({ message: adminId ? 'Ticket assigned successfully' : 'Ticket unassigned successfully', type: 'success' });
  } catch (err) {
    console.error('Error assigning ticket:', err);
    setToast({ message: 'Failed to assign ticket', type: 'error' });
  }
};
```

### Step 6: Update fetchTickets SELECT Query
Change the .select() line to include assigned_to and priority:
```typescript
.select('id, subject, status, customer_id, created_at, message, preferred_contact_method, email, full_name, assigned_to, priority, ticket_responses(*)')
```

### Step 7: Add Assignment Dropdown UI
Find the ticket header section (around line 505) where status Popover is, and add assignment dropdown RIGHT AFTER the status Popover closes but BEFORE the </div> that closes the flex container.

The structure should be:
```tsx
<div className="flex items-center gap-2">
  <span>Ticket</span>
  <Popover>Status Badge...</Popover>  {/* Existing */}
  
  {/* ADD THIS NEW POPOVER */}
  <Popover className="relative">
    <Popover.Button className="px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200 hover:ring-2 hover:ring-purple-300 bg-purple-100 text-purple-700 border border-purple-200">
      {selectedTicket.assigned_to 
        ? adminUsers.find(u => u.id === selectedTicket.assigned_to)?.full_name || 
          adminUsers.find(u => u.id === selectedTicket.assigned_to)?.email || 
          'Assigned'
        : 'Unassigned'}
    </Popover.Button>
    <Transition
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 translate-y-1"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-150"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-1"
    >
      <Popover.Panel className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-[10002] max-h-64 overflow-y-auto">
        {({ close }) => (
          <>
            <button
              onClick={() => {
                handleAssignTicket(selectedTicket.id, null);
                close();
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              {!selectedTicket.assigned_to && <Check className="h-4 w-4 text-blue-600" />}
              <span className={!selectedTicket.assigned_to ? 'font-medium' : ''}>Unassigned</span>
            </button>
            <div className="border-t border-slate-200 my-1"></div>
            {adminUsers.map((admin) => (
              <button
                key={admin.id}
                onClick={() => {
                  handleAssignTicket(selectedTicket.id, admin.id);
                  close();
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                {selectedTicket.assigned_to === admin.id && <Check className="h-4 w-4 text-blue-600" />}
                <div className="flex flex-col">
                  <span className={selectedTicket.assigned_to === admin.id ? 'font-medium' : ''}>
                    {admin.full_name || admin.email}
                  </span>
                  {admin.full_name && (
                    <span className="text-xs text-slate-500">{admin.email}</span>
                  )}
                </div>
              </button>
            ))}
          </>
        )}
      </Popover.Panel>
    </Transition>
  </Popover>
</div>
```

### Step 8: Run SQL Migration
Before testing, run the SQL migration in Supabase dashboard:
```sql
-- Copy contents of add_ticket_assignment_and_priority.sql and execute
```

## After Completion
Move to Issue #7: Implement priority levels feature (similar pattern to assignment)

## Remaining 13 Issues After First 7
After completing issues 6 and 7, remind user about remaining 13 issues (#8-20) from the original analysis.
