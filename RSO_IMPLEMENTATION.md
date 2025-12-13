# Riot Sign-On (RSO) OAuth Implementation Guide

## 📋 Status: PREPARED (Not Yet Active)

This document outlines how to implement Riot Sign-On OAuth for secure account verification.

---

## 🎯 Why RSO?

**Current Issue:** Users can link any Riot account without proving ownership
**Solution:** RSO OAuth verifies users actually own the accounts they link

---

## 📝 Step 1: Register Application with Riot

1. Go to: https://developer.riotgames.com/
2. Login with your Riot Account
3. Click "Register Product" or "My Applications"
4. Fill out application form:

```
Application Name: GGEZ.GG
Description: League of Legends statistics and coaching platform providing match analysis, champion guides, and personalized recommendations.
Website: https://ggez-gg.vercel.app
Redirect URIs:
  - https://ggez-gg.vercel.app/api/auth/riot/callback
  - http://localhost:5173/api/auth/riot/callback

Required OAuth Scopes:
  ✓ openid (Required - Basic user identification)
  ✓ summoner (Required - Summoner info and PUUID)
  ✓ email (Optional - User email address)
```

5. Submit and wait for approval (typically 3-7 days)
6. After approval, you'll receive:
   - `RSO_CLIENT_ID`
   - `RSO_CLIENT_SECRET`

---

## 🔐 Step 2: Add Environment Variables

Add to `.env` and Vercel:

```env
# Riot Sign-On OAuth
RSO_CLIENT_ID=your-client-id-here
RSO_CLIENT_SECRET=your-client-secret-here
RSO_REDIRECT_URI=https://ggez-gg.vercel.app/api/auth/riot/callback
```

---

## 💻 Step 3: Implementation Files

### Files to create:

1. **`src/routes/api/auth/riot/+server.js`**
   - Initiates OAuth flow
   - Redirects to Riot authorization page

2. **`src/routes/api/auth/riot/callback/+server.js`**
   - Handles OAuth callback
   - Exchanges code for access token
   - Fetches user PUUID
   - Links account in database

3. **Update `src/routes/profile/+page.svelte`**
   - Replace manual input with "Login with Riot" button
   - Show linking status

---

## 🔄 OAuth Flow Diagram

```
User clicks "Login with Riot"
        ↓
Redirect to Riot OAuth page
        ↓
User logs in with Riot credentials
        ↓
Riot redirects to /api/auth/riot/callback?code=ABC123
        ↓
Exchange code for access_token
        ↓
Use access_token to get PUUID from Riot API
        ↓
Save PUUID to user in database
        ↓
Redirect to /dashboard - Account linked! ✅
```

---

## 🔗 API Endpoints

### Riot RSO Endpoints:

```
Authorization:
https://auth.riotgames.com/authorize?
  redirect_uri={REDIRECT_URI}&
  client_id={CLIENT_ID}&
  response_type=code&
  scope=openid+summoner

Token Exchange:
POST https://auth.riotgames.com/token
Headers:
  Content-Type: application/x-www-form-urlencoded
Body:
  grant_type=authorization_code
  code={AUTHORIZATION_CODE}
  redirect_uri={REDIRECT_URI}
  client_id={CLIENT_ID}
  client_secret={CLIENT_SECRET}

Get Account Info:
GET https://europe.api.riotgames.com/riot/account/v1/accounts/me
Headers:
  Authorization: Bearer {ACCESS_TOKEN}
```

---

## 📦 Database Schema Changes

Current `user` table already has:
```sql
riot_puuid TEXT
riot_game_name TEXT
riot_tag_line TEXT
```

Optional additions for RSO:
```sql
ALTER TABLE user ADD COLUMN riot_access_token TEXT;
ALTER TABLE user ADD COLUMN riot_refresh_token TEXT;
ALTER TABLE user ADD COLUMN riot_token_expires_at INTEGER;
```

---

## 🚀 Migration Path

### Phase 1: Current (Manual Linking)
- Users manually enter Game Name + Tag
- No ownership verification
- Works immediately

### Phase 2: RSO Implementation (Future)
1. Get RSO credentials from Riot
2. Implement OAuth routes
3. Update Profile page UI
4. Test OAuth flow
5. Deploy to production

### Phase 3: Migration (Optional)
- Keep manual linking as fallback
- Encourage RSO for new users
- Badge for "Verified" accounts

---

## ✅ Benefits After Implementation

- 🔒 **Security:** Only account owners can link
- 👤 **Trust:** Verified badge for RSO users
- 📊 **Better Data:** Access to private match data
- 🔄 **Auto-Update:** Riot can notify us of name changes

---

## 📚 Resources

- Riot Developer Portal: https://developer.riotgames.com/
- RSO Documentation: https://developer.riotgames.com/docs/lol#rso
- OAuth 2.0 Spec: https://oauth.net/2/

---

## 🎯 Next Steps

1. ✅ Read this document
2. ⏳ Register application on Riot Developer Portal
3. ⏳ Wait for approval
4. ⏳ Get CLIENT_ID and CLIENT_SECRET
5. ⏳ Implement OAuth routes (see implementation files below)
6. ⏳ Test locally
7. ⏳ Deploy to production

---

*Last Updated: 2025-12-13*
*Status: Documentation Ready - Awaiting Riot Approval*
