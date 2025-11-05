# Auto-Extraction Model Selection Fix

## Problem
Auto-extraction was selecting an inactive model (`grok-4-fast-reasoning-2`) from the organization's `ai_models_default` table instead of using the active chat model, resulting in 404 errors when the selected model had no active API key.

## Root Cause
The `autoExtractAndSaveData` function queried the database for any active model in the organization (using heuristics like `ilike '%grok%'` or `ilike '%gpt%'`), which could select a different model than the one actively used in the chat session.

## Solution
Updated the extraction flow to use the **same model that answered the chat request**:

### Changes Made

1. **Updated `autoExtractAndSaveData` signature** (`/src/app/api/chat/route.ts`):
   ```typescript
   async function autoExtractAndSaveData(
     userId: string,
     content: string,
     existingSettings: Record<string, any>,
     chatModel?: { name?: string; api_key?: string | null; endpoint?: string | null; max_tokens?: number | null }
   )
   ```

2. **Pass chat model info from all call sites**:
   - GPT handler: passes `{ name, api_key, endpoint, max_tokens }`
   - Grok handler: passes `{ name, api_key, endpoint, max_tokens }`
   - Claude handler: passes `{ name, api_key, endpoint, max_tokens }`

3. **Model selection logic**:
   - **Primary**: If `chatModel` is provided with a name, use it for extraction
   - **Fallback**: If no chatModel provided, fall back to querying `ai_models_default` for an active organization model
   - **Validation**: Log which model is being used for extraction

4. **Error handling improvements**:
   - Wrapped AI provider calls in try/catch blocks
   - Extraction failures are logged but don't block chat responses
   - Gracefully skip extraction if model is unsupported or API call fails
   - Database save errors are logged but don't throw exceptions

## Benefits

✅ **Consistency**: Extraction uses the exact same model that successfully answered the chat  
✅ **Reliability**: No more 404 errors from selecting inactive models  
✅ **Non-blocking**: Extraction failures don't impact chat responses  
✅ **Better logging**: Clear visibility into which model is used for extraction  
✅ **Fallback support**: Still works if chatModel not provided (uses DB lookup)

## Testing

### Build Status
✅ Production build completed successfully with no errors

### How to Verify
1. Start a chat with a task containing "Data for settings"
2. Attach a document (PDF/DOCX) to be parsed
3. Check logs for:
   - `[AutoExtract] Using chat model provided by the request: <model-name>`
   - `[AutoExtract] Successfully extracted and saved: N fields`
4. Verify `ai_user_settings.default_settings` contains extracted data

### Test Case (Reproduction of Original Issue)
**Before**: Chat used `grok-4-fast-reasoning`, but extraction selected inactive `grok-4-fast-reasoning-2` → 404 error  
**After**: Chat uses `grok-4-fast-reasoning`, extraction also uses `grok-4-fast-reasoning` → Success

## Logs to Monitor

### Success Flow
```
[Chat] Using model: grok-4-fast-reasoning Model ID: 20
[AutoExtract] Starting auto-extraction for user: <user-id>
[AutoExtract] Using chat model provided by the request: grok-4-fast-reasoning
[AutoExtract] Calling Grok model for extraction
[AutoExtract] Successfully extracted and saved: 5 fields
```

### Error Flow (gracefully handled)
```
[AutoExtract] AI extraction error: Request failed with status code 404
[AutoExtract] AI response status: 404 {...}
[Chat] POST /api/chat 200 in 14026ms
```
Note: Chat still returns 200 even if extraction fails

## Future Improvements

- [ ] Add per-user/per-chat toggle to enable/disable auto-extraction
- [ ] Add API key validation before attempting extraction
- [ ] Create unit tests for extraction flow (happy path + provider errors)
- [ ] Add retry logic with exponential backoff for transient provider errors
- [ ] Consider extracting data asynchronously in a background job

## Related Files

- `/src/app/api/chat/route.ts` - Main chat handler and extraction logic
- `/src/app/api/chat/extract-data/route.ts` - Standalone extraction API endpoint
- `/src/components/modals/ChatWidget/ExtractedDataModal.tsx` - UI for reviewing extracted data

## Documentation

- See `AI_DATA_EXTRACTION_FEATURE.md` for full extraction feature overview
- See `AI_DATA_EXTRACTION_QUICK_START.md` for setup and usage guide
