# Realtime Debug Checklist

## Test This Now:

1. **Refresh both browser windows** (hard refresh: Ctrl+Shift+R)

2. **Open console in BOTH windows** (F12)

3. **Window 1 (Admin)**: 
   - Open tickets modal
   - Select a ticket
   - Leave it open

4. **Window 2 (Customer)**:
   - Open tickets modal  
   - Select THE SAME ticket
   - Leave it open

5. **In Window 1 (Admin)**: Add a response

6. **Check Window 2 (Customer) Console** - You should see:
   ```
   ✅ Realtime (Customer): Response change {payload}
   🔄 Selected ticket refreshed (customer) - responses count: X Previous: Y
   ```

7. **If you see the console logs but NO visual update:**
   - Does the response count increase? (X should be > Y)
   - If YES: React is not re-rendering
   - If NO: Database query not returning new response

## What to Share:

Please copy and paste the **exact console output** from Window 2 after adding the response in Window 1.

Specifically look for:
- Is `responses count` increasing?
- Any errors?
- Does it say "Selected ticket refreshed"?

## Possible Issues:

### Issue 1: ticket_responses not ordered
The query might need ordering. Check if responses appear but in wrong order.

### Issue 2: React not detecting change
If response count increases but UI doesn't update, it's a React re-render issue.

### Issue 3: Nested query issue
The `ticket_responses(*)` might not be loading properly in the refresh query.

## Quick Test:

In console, type:
```javascript
// This will show you the current selectedTicket state
console.log('Current responses:', document.querySelector('[data-selected-ticket]'))
```

Share what you see!
