# File Upload Bug Fix - UUID Session ID

## Issue
**Error:** `invalid input syntax for type uuid: "session-1762282094342-nhs9r8jh4"`

**Cause:** The `chat_session_id` column in the `chat_files` table expects a UUID type, but we were generating a string like `"session-{timestamp}-{random}"`.

## Solution
Changed session ID generation from string to proper UUID v4:

**Before:**
```typescript
const [chatSessionId] = useState(() => 
  `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
);
```

**After:**
```typescript
const [chatSessionId] = useState(() => {
  // Generate a proper UUID v4
  return crypto.randomUUID();
});
```

## Files Modified
1. `/src/components/modals/ChatHelpWidget/ChatWidgetWrapper.tsx`
2. `/src/components/ChatHelpWidget/ChatWidgetWrapper.tsx`
3. `/src/components/modals/ChatWidget/ChatWidget.tsx`

## Verification
✅ Build successful  
✅ TypeScript compilation passed  
✅ UUID format now matches database expectations  

## Testing
1. Start dev server: `npm run dev`
2. Open chat widget
3. Click paperclip icon
4. Upload a file
5. Should now succeed without UUID error

The session ID will now be a proper UUID like: `a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5g6h7`
