# Quick Start - Testing AI Transcription & Analysis

## 🚀 Prerequisites

### 1. Run Database Migration
```sql
-- In Supabase SQL Editor, run:
-- /database/migrations/create_meeting_transcriptions.sql
```

### 2. Set Environment Variable
```bash
# Add to .env.local
NEXT_PUBLIC_ASSEMBLYAI_API_KEY=your_key_here
```

### 3. Insert Sample AI Models
```sql
-- HR Interview Model (Grok-3)
INSERT INTO ai_models_system (
  name, provider, model_name, description,
  organization_types, required_plan, is_enabled,
  api_key, endpoint,
  task
) VALUES (
  'Grok-3 HR Interview Assistant',
  'xAI',
  'grok-3-turbo-chat',
  'AI for HR interviews and candidate evaluation',
  ARRAY['hr', 'recruitment', 'general'], -- Add 'general' for testing
  'free', -- Set to 'free' for easier testing
  true,
  'your-xai-api-key-here',
  'https://api.x.ai/v1/chat/completions',
  '[
    {"id": "summary", "name": "Interview Summary", "description": "Provide comprehensive summary", "enabled": true},
    {"id": "questions", "name": "Follow-up Questions", "description": "Suggest 5 follow-up questions", "enabled": true},
    {"id": "strengths", "name": "Candidate Strengths", "description": "Identify key strengths", "enabled": true}
  ]'::jsonb
);
```

### 4. Restart Dev Server
```bash
npm run dev
```

---

## 🧪 Testing Steps

### Step 1: Start a Video Call
1. Navigate to a meeting/booking
2. Click to join video call
3. Wait for VideoCallModal to load
4. Ensure audio/video permissions are granted

### Step 2: Test Transcription
1. Click **"More" (⋯)** button in video controls
2. Click **"Transcribe"** button
3. **Expected:** 
   - TranscriptionPanel appears on left
   - Red "Recording" indicator appears
   - Start speaking
4. **Verify:**
   - Text appears in real-time (~2-3s delay)
   - Speaker name is shown
   - Timestamps are accurate
   - Confidence scores appear

### Step 3: Test AI Analysis
1. While transcription is running, click **"More" (⋯)** again
2. Click **"AI Insights"** button
3. **Expected:**
   - AI menu popup appears
4. Select an AI model from dropdown
5. Click **"Show Analysis Panel"**
6. **Expected:**
   - AIAnalysisPanel appears on right
7. Click **"Run Analysis"**
8. **Expected:**
   - "Analyzing..." indicator shows
   - After 2-5 seconds, results appear
   - Tasks are collapsible
   - Token counts shown

### Step 4: Test UI Features
1. **Drag panels** around screen (desktop only)
2. **Click task headers** to expand/collapse
3. **Click "Reanalyze"** to run analysis again
4. **Close panels** with X button
5. **Export transcript** with download icon

---

## ✅ Success Criteria

- [ ] Transcription starts within 3 seconds
- [ ] Text appears in real-time
- [ ] Multiple speakers are tracked
- [ ] AI analysis completes successfully
- [ ] All tasks execute and show results
- [ ] Panels are draggable
- [ ] No console errors
- [ ] Costs are tracked in database

---

## 🐛 Common Issues & Fixes

### Issue: "No AI models available"
**Fix:** 
```sql
-- Check if models exist and are enabled
SELECT name, is_enabled, organization_types, required_plan 
FROM ai_models_system;

-- Update organization_types to include your org type
UPDATE ai_models_system 
SET organization_types = ARRAY['general', 'hr', 'legal']
WHERE id = 1;
```

### Issue: Transcription doesn't start
**Fix:**
1. Check browser console for errors
2. Verify AssemblyAI API key: `console.log(process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY)`
3. Test API key: https://www.assemblyai.com/dashboard

### Issue: Analysis fails
**Fix:**
1. Check if AI provider API key is set in database
2. Verify endpoint URL is correct
3. Check API rate limits
4. Review browser console for API errors

---

## 📊 What to Look For

### In Transcription Panel:
- ✅ Live text streaming
- ✅ Speaker labels (e.g., "You", "Participant 1")
- ✅ Timestamps (HH:MM:SS)
- ✅ Confidence percentages (90%+)
- ✅ Word/segment counters

### In AI Analysis Panel:
- ✅ Summary stats (model, time, tokens, tasks)
- ✅ Collapsible task sections
- ✅ Full analysis results per task
- ✅ No error messages
- ✅ Reasonable response times (<10s)

### In Database:
```sql
-- Check if transcription was saved
SELECT * FROM meeting_transcriptions 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 🎯 Quick Test Script

```javascript
// Open browser console during video call
// Test AssemblyAI API key
console.log('API Key:', process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY);

// Check if hooks are loaded
console.log('Hooks available:', 
  typeof useTranscription, 
  typeof useMeetingAIModels, 
  typeof useAIAnalysis
);
```

---

## 📞 Need Help?

Check these files for detailed implementation:
1. `AI_TRANSCRIPTION_IMPLEMENTATION_COMPLETE.md` - Full guide
2. `/src/components/modals/MeetingsModals/VideoCall/hooks/useTranscription.ts` - Transcription logic
3. `/src/components/modals/MeetingsModals/VideoCall/hooks/useAIAnalysis.ts` - Analysis logic

**Ready to test!** 🚀
