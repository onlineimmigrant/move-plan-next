# Phase 8: Team Collaboration - Architecture Document

## 📋 Overview

**Phase 8** introduces comprehensive team collaboration features that transform the ticket system from individual admin work to coordinated team support. This phase enables admins to communicate efficiently, prevent conflicts, track activities, and maintain context across shifts.

### Goals
- **Coordination**: Enable seamless collaboration between multiple admins on tickets
- **Context Preservation**: Maintain conversation context across handoffs and shifts
- **Conflict Prevention**: Avoid duplicate work and editing conflicts
- **Communication**: Provide real-time internal chat for quick team discussions
- **Visibility**: Show who's doing what across the entire support team

### Expected Impact
- **50% reduction** in duplicate work and conflicts
- **30% faster** ticket resolution through better handoffs
- **40% improvement** in first-contact resolution via team knowledge sharing
- **60% faster** admin onboarding with better context and collaboration

---

## 🗄️ Database Schema Architecture

### Core Tables (10 tables)

#### 1. **admin_mentions** - @Mention System
```sql
-- Purpose: Track @mentions for notifications and context
Key Fields:
- ticket_id, response_id (where mention occurred)
- mentioned_admin_id, mentioned_by_admin_id
- mention_text, context_snippet
- is_read, read_at (notification status)

Indexes:
- Unread mentions by admin (fast notification query)
- Mentions per ticket (show all team involvement)
- Organization-wide mention search
```

#### 2. **team_discussions** - Private Internal Conversations
```sql
-- Purpose: Admin-only conversations on tickets (never shown to customers)
Key Fields:
- ticket_id (which ticket)
- message, admin_id
- parent_id, thread_position (threaded replies)
- is_edited, is_deleted (soft delete)
- has_attachments

Indexes:
- Active discussions per ticket
- Thread hierarchy for nested replies
- Admin activity history
```

#### 3. **ticket_watchers** - Ticket Following System
```sql
-- Purpose: Track who's interested in ticket updates
Key Fields:
- ticket_id, admin_id
- notify_on_response, notify_on_status_change, notify_on_assignment_change
- is_auto_watch (auto-added vs manual)

Indexes:
- Watchers per ticket (show interested admins)
- Tickets watched by admin (personal watching list)
- Active notification subscriptions
```

#### 4. **ticket_locks** - Conflict Prevention
```sql
-- Purpose: Prevent concurrent editing with soft/hard locks
Key Fields:
- ticket_id, locked_by_admin_id
- lock_reason, lock_type (soft warning vs hard block)
- expires_at, last_activity_at (auto-release)

Indexes:
- Active locks per ticket (check before editing)
- Locks by admin (show admin's current locks)
```

#### 5. **admin_presence** - Real-time "Currently Viewing"
```sql
-- Purpose: Show who's looking at what in real-time
Key Fields:
- ticket_id, admin_id
- activity_type (viewing, typing, idle)
- last_active_at, expires_at (5 min auto-expire)
- session_id, page_url

Indexes:
- Active viewers per ticket
- Admin's current presence across tickets
- Organization-wide presence
```

#### 6. **team_chat_messages** - Internal Team Chat
```sql
-- Purpose: Real-time chat between admins (Slack-style)
Key Fields:
- message, sender_admin_id
- channel_id, recipient_admin_id (channel vs DM)
- message_type (text, system, file, ticket_link)
- metadata (rich content), parent_message_id (threads)
- read_by_admin_ids (read receipts)

Indexes:
- Messages per channel (chat history)
- Thread hierarchy
- Unread messages per admin
```

#### 7. **team_chat_channels** - Chat Rooms
```sql
-- Purpose: Organized channels for teams/departments/projects
Key Fields:
- name, description, channel_type
- is_private, allowed_admin_ids (access control)
- is_archived

Examples: #general, #team-billing, #team-technical, #announcements
```

#### 8. **activity_feed** - Centralized Activity Log
```sql
-- Purpose: Track all ticket and team activities
Key Fields:
- activity_type (ticket_created, response_added, status_changed, etc.)
- actor_admin_id (who did it)
- ticket_id, response_id, discussion_id (what was affected)
- activity_data (JSONB flexible data)
- summary (human-readable)
- is_public (visible to customer or admin-only)

Indexes:
- Recent activities per ticket (ticket timeline)
- Activities by admin (admin performance)
- Activities by type (filter feed)
```

#### 9. **ticket_handoff_notes** - Context Transfer
```sql
-- Purpose: Structured handoff with context and checklist
Key Fields:
- from_admin_id, to_admin_id
- handoff_reason (shift_end, expertise_required, escalation, etc.)
- notes, checklist (JSONB)
- is_acknowledged, acknowledged_at

Use Cases:
- Shift changes with full context
- Escalation with background info
- Specialist handoffs with action items
```

#### 10. **duplicate_tickets** - Duplicate Detection & Merging
```sql
-- Purpose: Track duplicate relationships and merge history
Key Fields:
- primary_ticket_id, duplicate_ticket_id
- similarity_score, detection_method (manual, auto_text, auto_customer)
- merge_status (pending, confirmed, merged, rejected)
- merged_by_admin_id, merge_notes

Algorithm: Similarity based on customer email, subject, content, time proximity
```

---

## 🏗️ Component Architecture

### Component Hierarchy

```
AdminDashboard
├── AdminActivityFeed (sidebar)
│   ├── ActivityFeedItem
│   ├── ActivityFilters
│   └── InfiniteScroll
│
├── TeamChatWidget (floating or sidebar)
│   ├── ChannelList
│   ├── MessageThread
│   │   ├── Message
│   │   ├── TypingIndicator
│   │   └── MessageInput (with @mentions)
│   ├── OnlineAdminsList
│   └── UnreadBadge
│
├── TicketsAdminModal (enhanced)
│   ├── TicketHeader
│   │   ├── WatchButton
│   │   ├── ViewersIndicator (avatars)
│   │   ├── LockIndicator
│   │   └── HandoffButton
│   │
│   ├── TicketTabs
│   │   ├── ResponsesTab (existing)
│   │   ├── NotesTab (existing)
│   │   ├── **TeamDiscussionTab** (NEW)
│   │   └── ActivityTab (timeline)
│   │
│   ├── TeamDiscussionPanel
│   │   ├── DiscussionMessage
│   │   ├── MentionInput (with typeahead)
│   │   ├── ThreadedReplies
│   │   └── AttachmentUpload
│   │
│   ├── TypingIndicator (bottom)
│   ├── DuplicateWarning (if detected)
│   └── HandoffModal
│       ├── AdminSelector
│       ├── ReasonDropdown
│       ├── ContextEditor (rich text)
│       └── ChecklistBuilder
│
├── MentionsInbox (notification center)
│   ├── MentionCard
│   ├── UnreadCounter
│   └── MarkAllRead
│
└── DuplicateMergeModal
    ├── TicketComparison (side-by-side)
    ├── MergeOptions (which data to keep)
    └── MergePreview
```

---

## 🔄 Real-time Infrastructure

### Supabase Realtime Setup

#### 1. **Presence Tracking** (for "Currently Viewing")
```typescript
// Track admin presence on ticket view
const presenceChannel = supabase.channel(`ticket:${ticketId}:presence`)
  .on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState()
    // Show avatars of viewing admins
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    // Admin started viewing
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    // Admin left ticket
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel.track({
        user_id: adminId,
        user_name: adminName,
        viewing_ticket: ticketId,
        online_at: new Date().toISOString()
      })
    }
  })
```

#### 2. **Typing Indicators**
```typescript
// Broadcast typing state (ephemeral, not stored)
const typingChannel = supabase.channel(`ticket:${ticketId}:typing`)
  .on('broadcast', { event: 'typing' }, (payload) => {
    // Show "Admin is typing..." indicator
    showTypingIndicator(payload.admin_name)
  })

// Send typing event on input
const handleTyping = debounce(() => {
  typingChannel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { admin_id: adminId, admin_name: adminName }
  })
}, 500)
```

#### 3. **Real-time Database Subscriptions**
```typescript
// Subscribe to team discussions on this ticket
supabase
  .channel(`team_discussions:ticket_id=eq.${ticketId}`)
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'team_discussions' },
    (payload) => {
      // New team discussion message
      addDiscussionMessage(payload.new)
    }
  )
  .subscribe()

// Subscribe to mentions for current admin
supabase
  .channel(`admin_mentions:mentioned_admin_id=eq.${adminId}`)
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'admin_mentions' },
    (payload) => {
      // New mention notification
      showMentionNotification(payload.new)
    }
  )
  .subscribe()

// Subscribe to team chat channel
supabase
  .channel(`team_chat:channel_id=eq.${channelId}`)
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'team_chat_messages' },
    (payload) => {
      // New chat message
      addChatMessage(payload.new)
    }
  )
  .subscribe()
```

#### 4. **Lock Management** (Optimistic with heartbeat)
```typescript
// Acquire lock when starting to respond
const acquireLock = async (ticketId: string) => {
  const { data, error } = await supabase
    .from('ticket_locks')
    .insert({
      ticket_id: ticketId,
      locked_by_admin_id: adminId,
      lock_reason: 'editing_response',
      lock_type: 'soft',
      expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 min
    })
    .select()
    .single()
  
  if (data) {
    // Start heartbeat to keep lock alive
    startLockHeartbeat(data.id)
  }
  return data
}

// Heartbeat to extend lock expiration
const startLockHeartbeat = (lockId: string) => {
  const interval = setInterval(async () => {
    await supabase
      .from('ticket_locks')
      .update({ 
        last_activity_at: new Date(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000)
      })
      .eq('id', lockId)
  }, 5 * 60 * 1000) // Every 5 minutes
  
  // Store interval to clear on unmount
  return interval
}
```

---

## 🎨 UI/UX Patterns

### 1. **@Mention System**

**Input Component:**
```tsx
<MentionInput
  value={message}
  onChange={setMessage}
  onMention={(adminId) => handleMention(adminId)}
  admins={availableAdmins}
  placeholder="Type @ to mention an admin..."
/>
```

**Typeahead Dropdown:**
- Trigger: Type `@` in text input
- Filter: Show admins matching typed letters
- Display: Avatar + name + role
- Selection: Insert `@username` into text, store admin_id reference
- Highlight: Mentions shown in blue with hover card

**Notification Flow:**
1. Admin types message with `@john`
2. Parse message, extract mention
3. Insert into `admin_mentions` table
4. Real-time subscription triggers notification
5. John sees badge in header notification center
6. Click → Navigate to ticket with context highlighted

### 2. **Presence Indicators**

**"Currently Viewing" Display:**
```tsx
<TicketViewers>
  {viewers.map(viewer => (
    <Avatar
      key={viewer.admin_id}
      src={viewer.avatar}
      name={viewer.admin_name}
      status={viewer.activity_type} // viewing, typing, idle
      pulseAnimation={viewer.activity_type === 'typing'}
    />
  ))}
  {viewers.length > 3 && <span>+{viewers.length - 3} more</span>}
</TicketViewers>
```

**Placement:**
- Ticket header (right side)
- Ticket list (small indicator)
- Admin dashboard "Currently Active" section

### 3. **Team Discussion Panel**

**Design:**
- Similar to Slack/Discord threads
- Separate tab in TicketsAdminModal: "Team Discussion"
- Clear visual distinction (darker background, "Internal Only" badge)
- Threaded replies with indentation
- Rich text editor with @mentions, markdown, file attachments
- Inline ticket/customer references

**Privacy Notice:**
```tsx
<PrivacyBanner>
  🔒 Internal Team Discussion - Not visible to customers
</PrivacyBanner>
```

### 4. **Activity Feed**

**Feed Item Structure:**
```tsx
<ActivityItem>
  <AdminAvatar />
  <ActivityContent>
    <ActionText>{admin} assigned ticket #{ticketId} to {targetAdmin}</ActionText>
    <Timestamp>2 minutes ago</Timestamp>
    <TicketLink />
  </ActivityContent>
  <ActionIcon /> {/* Assignment, status change, response, etc. */}
</ActivityItem>
```

**Filters:**
- Activity type: All, Assignments, Status Changes, Responses, Mentions
- Team member: All admins or specific admin
- Date range: Today, This Week, This Month, Custom
- Ticket: All tickets or specific ticket

**Auto-scroll:**
- New activities fade in at top
- Badge shows "5 new activities" if scrolled down
- Click badge to scroll to top

### 5. **Handoff Modal**

**Step 1: Select Target Admin**
```tsx
<AdminSelector
  admins={availableAdmins}
  selectedAdmin={targetAdmin}
  onSelect={setTargetAdmin}
  showAvailability={true} // Online status
  showWorkload={true} // Current ticket count
/>
```

**Step 2: Provide Context**
```tsx
<HandoffForm>
  <ReasonSelect
    options={['Shift Change', 'Expertise Required', 'Workload Balance', 'Escalation', 'Vacation']}
  />
  <RichTextEditor
    placeholder="Provide context, history, and any important notes..."
    value={handoffNotes}
  />
  <ChecklistBuilder
    items={checklist}
    onAdd={addChecklistItem}
    onRemove={removeChecklistItem}
  />
  <UrgencyToggle />
</HandoffForm>
```

**Step 3: Confirmation**
- Show summary of handoff
- Preview notification that target admin will receive
- "Hand Off Ticket" button

**Target Admin Experience:**
1. Receives notification with bell icon + badge
2. Sees handoff card in notifications center
3. Card shows: from admin, reason, preview of notes
4. "Accept" / "Request More Info" buttons
5. On accept: ticket assigned, handoff acknowledged, activity logged

### 6. **Duplicate Detection UI**

**Auto-detection Warning:**
```tsx
<DuplicateWarning severity="warning">
  ⚠️ Possible duplicate of Ticket #{123}
  <ViewButton onClick={() => openTicketComparison(123)} />
  <DismissButton />
</DuplicateWarning>
```

**Manual Merge Modal:**
```tsx
<DuplicateMergeModal>
  <TicketComparison>
    <TicketCard ticket={primaryTicket} label="Primary" />
    <TicketCard ticket={duplicateTicket} label="Duplicate" />
  </TicketComparison>
  
  <MergeOptions>
    <Checkbox>Merge responses from duplicate</Checkbox>
    <Checkbox>Combine tags</Checkbox>
    <Checkbox>Notify customer of merge</Checkbox>
    <ResponseSelector>Which responses to keep?</ResponseSelector>
  </MergeOptions>
  
  <MergePreview>
    {/* Show what merged ticket will look like */}
  </MergePreview>
  
  <MergeButton>Merge Tickets</MergeButton>
</DuplicateMergeModal>
```

**Merge Logic:**
1. Move selected responses from duplicate to primary
2. Combine tags (deduplicate)
3. Add system note to primary: "Merged with #[duplicate_id]"
4. Close duplicate with auto-response
5. Log activity in feed
6. Send notification to customer if checkbox checked

### 7. **Team Chat Widget**

**Layout:**
```tsx
<TeamChatWidget collapsed={isCollapsed}>
  <ChatHeader>
    <ChannelName>#team-support</ChannelName>
    <OnlineCount>12 online</OnlineCount>
    <CollapseButton />
  </ChatHeader>
  
  <ChannelSidebar>
    <ChannelSection title="Channels">
      <Channel name="general" unread={3} />
      <Channel name="team-billing" unread={0} />
      <Channel name="announcements" unread={1} />
    </ChannelSection>
    <ChannelSection title="Direct Messages">
      <DirectMessage admin={admin1} online={true} />
      <DirectMessage admin={admin2} online={false} />
    </ChannelSection>
  </ChannelSidebar>
  
  <MessageArea>
    <MessageList>
      {messages.map(msg => (
        <ChatMessage
          message={msg}
          isOwn={msg.sender_id === adminId}
          showAvatar={true}
        />
      ))}
    </MessageList>
    
    <TypingIndicators>
      {typingAdmins.map(admin => (
        <span>{admin.name} is typing...</span>
      ))}
    </TypingIndicators>
    
    <ChatInput
      onSend={sendMessage}
      onTyping={handleTyping}
      placeholder="Message #team-support"
    />
  </MessageArea>
</TeamChatWidget>
```

**Features:**
- Markdown support
- @mentions with autocomplete
- Inline ticket links (#123 auto-links)
- File uploads
- Message reactions (👍, ❤️, 🎉)
- Thread replies (keep conversations organized)
- Search chat history
- Pin important messages

---

## 🔐 Security & Permissions

### Access Control

**Principle:** Team collaboration features are admin-only. Customers never see:
- Team discussions
- Admin presence
- Internal chat
- Activity feed (admin activities)
- Handoff notes
- Duplicate merge process

**RLS Policies:**
```sql
-- Only admins in same organization can access
CREATE POLICY "Admins only" ON team_discussions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**Role-Based Features:**
- **Admin:** Can use all collaboration features
- **Super Admin:** Can manage team groups, view all activities
- **Limited Admin:** May have restricted access to certain channels

### Privacy Considerations

1. **Team Discussions:** 
   - Never exposed in customer-facing views
   - Encrypted at rest in database
   - No email notifications to customers

2. **Mentions:**
   - Only notify target admin (not customer)
   - Context snippet limited to prevent data leakage

3. **Activity Feed:**
   - `is_public` flag determines customer visibility
   - Customer sees: status changes, responses added
   - Customer never sees: assignments, internal notes, admin activities

4. **Chat Messages:**
   - Retained according to data retention policy
   - Searchable only by admins in same organization
   - Cannot be forwarded to customers

---

## 📊 Analytics & Metrics

### Team Performance Metrics

Track effectiveness of collaboration features:

1. **Handoff Efficiency:**
   - Average time to accept handoff
   - Handoff acceptance rate
   - Tickets resolved after handoff

2. **Collaboration Activity:**
   - Team discussions per ticket
   - @Mentions frequency
   - Average watchers per ticket

3. **Conflict Prevention:**
   - Duplicate tickets detected/merged
   - Concurrent edit conflicts prevented
   - Lock acquisition patterns

4. **Response Time Impact:**
   - Response time with vs without watchers
   - Resolution time improvement with handoffs
   - First-response time by team

### Dashboard Widgets

**Team Activity Dashboard:**
```tsx
<TeamMetrics>
  <MetricCard
    title="Active Collaborations"
    value={42}
    change="+15%"
    icon={<UsersIcon />}
  />
  <MetricCard
    title="Handoffs This Week"
    value={28}
    change="+8"
    icon={<ArrowRightIcon />}
  />
  <MetricCard
    title="Duplicates Prevented"
    value={15}
    change="saved 3hrs"
    icon={<DocumentDuplicateIcon />}
  />
  <MetricCard
    title="Avg. Resolution Time"
    value="4.2h"
    change="-1.3h"
    trend="down"
    icon={<ClockIcon />}
  />
</TeamMetrics>
```

---

## 🚀 Implementation Phases

### Phase 8A: Foundation (Tasks 1-3)
- ✅ Database schema creation
- ✅ Architecture documentation
- 🔄 @Mention system (input, parser, notifications)
- 🔄 Team discussions UI (tab, message list, input)
- 🔄 Ticket watchers (watch button, notification preferences)

### Phase 8B: Real-time Features (Tasks 4-6)
- Presence tracking (Supabase realtime)
- Typing indicators
- Admin chat widget
- Activity feed

### Phase 8C: Advanced Features (Tasks 7-9)
- Ticket handoffs (modal, context, checklist)
- Ticket locks (conflict prevention)
- Duplicate detection (algorithm, merge UI)

### Phase 8D: Polish & Testing (Task 10)
- Performance optimization
- Error handling
- Comprehensive testing
- Documentation

---

## 🧪 Testing Strategy

### Unit Tests
- MentionInput parsing logic
- Duplicate detection algorithm
- Lock acquisition/release logic
- Activity feed filtering

### Integration Tests
- Real-time presence updates
- Mention notification flow
- Handoff acceptance flow
- Chat message delivery

### E2E Tests
- Admin mentions another admin → notification received
- Two admins view same ticket → both avatars shown
- Admin starts typing → other admin sees indicator
- Handoff ticket → target admin accepts → assignment changes
- Duplicate detection → merge tickets → verify merged data

### Performance Tests
- 50 concurrent admins viewing different tickets
- Activity feed with 10,000+ entries
- Chat with high message volume (100 msgs/min)
- Presence tracking with frequent updates

---

## 📚 Documentation Deliverables

1. **Admin User Guide:**
   - How to @mention teammates
   - Using team discussions effectively
   - Handoff best practices
   - Watching tickets for updates
   - Merging duplicate tickets

2. **API Documentation:**
   - Real-time subscription patterns
   - Presence API endpoints
   - Activity logging functions

3. **Migration Guide:**
   - Applying Phase 8 schema
   - Enabling realtime features
   - Training team on new features

---

## 🎯 Success Criteria

Phase 8 is complete when:

- ✅ All 10 tables created and indexed
- ✅ RLS policies applied and tested
- ✅ @Mention system working end-to-end
- ✅ Team discussions visible in separate tab
- ✅ Presence tracking shows active viewers
- ✅ Typing indicators working in real-time
- ✅ Admin chat functional with channels
- ✅ Activity feed displays all team actions
- ✅ Handoff flow complete with context transfer
- ✅ Duplicate detection and merge working
- ✅ Ticket locks prevent concurrent edits
- ✅ All features tested with multiple concurrent admins
- ✅ Documentation complete and published

**Target Completion:** Phase 8A-8D over ~2-3 weeks

---

## 🔗 Integration Points

### With Existing System

**Phase 5 (Analytics):**
- Add team collaboration metrics to dashboard
- Track handoff performance
- Measure duplicate prevention impact

**Phase 6 (Automation):**
- Auto-assign watchers based on rules
- Trigger notifications on automated actions
- Log automation activities in feed

**Phase 7 (Customer Portal):**
- Private discussions visible only to admins (not customers)
- Activity feed shows customer-facing vs internal actions
- Handoffs transparent to customer (seamless transition)

**Phase 9 (AI & Smart Features - Future):**
- AI suggests relevant team members to @mention
- Smart handoff recommendations based on expertise
- Auto-detect duplicates using ML similarity

**Phase 10 (Integrations - Future):**
- Sync team chat with Slack
- Export activity feed to external tools
- Webhook notifications for mentions/handoffs

---

*Last Updated: [Current Date]*  
*Status: Architecture Complete - Ready for Implementation*
