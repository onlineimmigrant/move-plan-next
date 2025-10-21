# Twilio Video Service Outage - October 20, 2025

## Current Status: SERVICE DISRUPTION

### Incident Summary
Twilio is experiencing widespread service disruptions affecting multiple services including:
- ✅ Twilio REST API (elevated latency & timeouts)
- ✅ Video API (room creation, connections, recordings)
- ✅ API Key authentication
- ✅ Programmable Messaging (SMS, MMS)

### Root Cause
AWS US East (N. Virginia) regional outage cascading to Twilio infrastructure.

### Timeline
- **00:15 PST Oct 20**: Elevated HTTP 500 errors detected
- **00:26 PST Oct 20**: Video service issues confirmed
- **Ongoing**: Investigation in progress, updates every 60 minutes

### Impact on Our Application

#### What's Affected:
1. **Room Creation** - POST `/api/meetings/rooms` returns 503 errors
2. **Token Generation** - PUT `/api/meetings/rooms` may fail authentication
3. **Video Connections** - "Invalid Access Token issuer/subject" errors
4. **API Key Operations** - Cannot create or validate API keys

#### What Still Works:
- ✅ Database operations (booking creation, room records)
- ✅ UI and frontend functionality
- ✅ Existing room data retrieval

### Workarounds Implemented

1. **Graceful Error Handling**
   - Service status banner showing outage information
   - User-friendly error messages
   - Links to Twilio status page

2. **Room Reuse Logic**
   - System attempts to reuse existing active rooms
   - Fallback to most recent room when creation fails

3. **Enhanced Logging**
   - API Key usage tracking
   - Room name and identity logging
   - Service error detection

### What to Do

#### For Users:
1. Check https://status.twilio.com for current status
2. Wait for service restoration (updates every 60 minutes)
3. Existing scheduled meetings may be affected
4. Consider rescheduling critical video calls

#### For Developers:
1. **Do NOT** modify API credentials during outage
2. **Monitor** Twilio status page for updates
3. **Wait** for service restoration before testing
4. **Review** logs after restoration to verify functionality

### When Service Resumes

1. **Verify API Key**
   - Test authentication: `curl -X GET "https://api.twilio.com/2010-04-01/Accounts/your_account_sid.json" -u "your_api_key_sid:your_api_key_secret"`
   - If fails, create new API key from Console

2. **Test Room Creation**
   ```bash
   curl -X POST http://localhost:3000/api/meetings/rooms \
     -H "Content-Type: application/json" \
     -d '{"booking_id":"<valid-booking-id>","max_participants":4}'
   ```

3. **Test Token Generation**
   ```bash
   curl -X PUT http://localhost:3000/api/meetings/rooms \
     -H "Content-Type: application/json" \
     -d '{"booking_id":"<valid-booking-id>","identity":"test-user"}'
   ```

4. **Test Video Connection**
   - Visit `/en/test-video`
   - Join existing room
   - Verify video/audio works

### API Key Recreation Steps (If Needed)

If API key is invalid after outage:

1. Go to: https://console.twilio.com/us1/account/keys-credentials/api-keys
2. Create new API Key:
   - Friendly Name: `VideoCallAPIKey`
   - Key Type: `Standard`
3. Update `.env`:
   ```properties
   TWILIO_API_KEY=your_api_key_sid
   TWILIO_API_SECRET=your_api_key_secret
   ```
4. Restart application

### Monitoring Resources

- **Twilio Status**: https://status.twilio.com
- **AWS Status**: https://health.aws.amazon.com/health/status
- **Application Logs**: Check server console for error codes (503, 500, 20003)

### Related Incidents

- AWS US East outage affecting multiple services
- Vercel deployment issues
- Slack connectivity problems
- Started ~08:00 GMT Oct 20, 2025

---

**Last Updated**: October 20, 2025
**Status**: Under Investigation
**Next Update**: Per Twilio (every 60 minutes)
