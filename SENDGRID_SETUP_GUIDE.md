# SendGrid Setup Guide - Professional Email Service

**For UC METC SILMS** (Sales, Inventory, Locker, and Membership System)

## Why SendGrid?

✅ **100 emails/day FREE** (vs Gmail's 500/day)  
✅ **Unlimited recipients** per email  
✅ **Better deliverability** - emails rarely go to spam  
✅ **Email analytics** - track opens, clicks, bounces  
✅ **Professional sender reputation**  
✅ **No personal email exposure**  
✅ **Scalable** - easy to upgrade as you grow  
✅ **Trusted by major companies** (Uber, Airbnb, Spotify)

---

## Step 1: Create SendGrid Account (5 minutes)

### A. Sign Up

1. Go to: **https://signup.sendgrid.com/**

2. Fill in the form:
   - **Email:** Use hanssantoya@gmail.com or a school email
   - **Password:** Create a strong password
   - **Company Name:** UC METC
   - **Website:** Your school website or leave blank

3. Click **"Create Account"**

4. **Verify your email** - Check your inbox and click the verification link

### B. Complete Account Setup

1. **Tell us about yourself:**
   - Role: Developer
   - Company size: 1-10 employees
   - I'm sending: Transactional emails
   - Use case: Password resets, notifications

2. **Skip the integration tutorial** (we'll do it manually)

---

## Step 2: Create API Key (2 minutes)

### A. Navigate to API Keys

1. Log in to SendGrid: **https://app.sendgrid.com/**

2. Click **Settings** (left sidebar) → **API Keys**

3. Click **"Create API Key"** (top right)

### B. Configure API Key

1. **API Key Name:** `UC-METC-SILMS-Production`

2. **API Key Permissions:** Select **"Restricted Access"**

3. **Permissions to enable:**
   - ✅ **Mail Send** → Full Access
   - Leave everything else as "No Access"

4. Click **"Create & View"**

5. **COPY THE API KEY** - You'll only see it once!
   ```
   SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

6. **Save it somewhere safe** (you'll need it in a moment)

---

## Step 3: Verify Sender Identity (IMPORTANT!)

SendGrid requires sender verification to prevent spam.

### Option A: Single Sender Verification (Easiest - 5 minutes)

1. Go to **Settings** → **Sender Authentication** → **Single Sender Verification**

2. Click **"Create New Sender"**

3. Fill in the form:
   ```
   From Name: UC METC SILMS
   From Email Address: hanssantoya@gmail.com (or your school email)
   Reply To: hanssantoya@gmail.com
   Company Address: UC METC Campus Address
   City: Your City
   Country: Philippines
   ```

4. Click **"Create"**

5. **Check your email** (hanssantoya@gmail.com)

6. Click the verification link in the email

7. ✅ **Sender verified!**

### Option B: Domain Authentication (Advanced - Better for production)

If you have a custom domain (e.g., ucmetc.edu.ph):

1. Go to **Settings** → **Sender Authentication** → **Authenticate Your Domain**
2. Follow the DNS setup instructions
3. This gives you better deliverability and professional emails

---

## Step 4: Update Your Application (3 minutes)

### A. Update backend/.env

```env
# Email Configuration - SendGrid
EMAIL_SERVICE=SendGrid
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-actual-api-key-here
EMAIL_FROM=hanssantoya@gmail.com
```

**Important Notes:**
- `EMAIL_USER` must be exactly `apikey` (lowercase)
- `EMAIL_PASSWORD` is your SendGrid API key
- `EMAIL_FROM` must match your verified sender email

### B. Update Email Service Code

The email service needs a small modification for SendGrid:

---

## Step 5: Test SendGrid (2 minutes)

### A. Restart Backend

```bash
cd backend
npm run dev
```

Look for:
```
✅ [EMAIL SERVICE] Email service initialized successfully (SendGrid)
```

### B. Test Password Reset

1. Go to Forgot Password page
2. Enter an email
3. Check inbox (should arrive within seconds)

### C. Check SendGrid Dashboard

1. Go to **Activity** in SendGrid dashboard
2. You'll see:
   - Emails sent
   - Delivery status
   - Opens/clicks (if enabled)

---

## SendGrid Features You Get

### 1. Email Analytics
- Track delivery rates
- See bounce rates
- Monitor spam reports
- View open rates (optional)

### 2. Better Deliverability
- Professional sender reputation
- Automatic spam prevention
- Dedicated IP (paid plans)

### 3. Email Templates
- Create reusable templates
- A/B testing
- Dynamic content

### 4. Webhooks
- Get notified of bounces
- Track email events
- Automate workflows

---

## Free Tier Limits

| Feature | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Emails/day | 100 | Unlimited |
| Emails/month | 3,000 | Unlimited |
| Sender verification | Required | Required |
| Email analytics | ✅ Yes | ✅ Yes |
| API access | ✅ Yes | ✅ Yes |
| Support | Email only | Priority |

**Is 100/day enough?**
- 500 users × 2 password resets/month = ~33 emails/day ✅
- Plus notifications, announcements = ~50-70 emails/day ✅
- **You're well within limits!**

---

## Upgrading SendGrid (When Needed)

### Essentials Plan - $19.95/month
- 50,000 emails/month
- Email validation
- Priority support

### Pro Plan - $89.95/month
- 100,000 emails/month
- Dedicated IP
- Advanced analytics

**Recommendation:** Start with free tier, upgrade when you exceed 100 emails/day

---

## Troubleshooting

### "Sender not verified" error
- Complete Single Sender Verification
- Check verification email in spam folder
- Wait 5-10 minutes after verification

### "Invalid API key" error
- Check EMAIL_USER is exactly `apikey`
- Verify API key is copied correctly
- Make sure API key has "Mail Send" permission

### Emails not arriving
- Check SendGrid Activity dashboard
- Look for bounce/spam reports
- Verify sender email matches verified sender

### Rate limit exceeded
- You're sending more than 100 emails/day
- Upgrade to paid plan
- Or spread emails throughout the day

---

## Security Best Practices

### 1. API Key Security
```bash
# Never commit API keys to Git
echo "backend/.env" >> .gitignore

# Use different keys for dev/production
# Dev: UC-METC-SILMS-Development
# Prod: UC-METC-SILMS-Production
```

### 2. Rotate API Keys
- Rotate every 90 days
- Delete unused keys
- Use restricted permissions only

### 3. Monitor Usage
- Check SendGrid dashboard weekly
- Watch for unusual activity
- Set up alerts for bounces

### 4. Rate Limiting
Add to your backend to prevent abuse:

```typescript
// In backend/src/routes/auth.ts
const resetAttempts = new Map<string, { count: number; resetAt: number }>();

// Before sending email:
const now = Date.now();
const attempt = resetAttempts.get(email) || { count: 0, resetAt: now };

// Reset counter after 1 hour
if (now - attempt.resetAt > 3600000) {
  attempt.count = 0;
  attempt.resetAt = now;
}

// Limit to 3 attempts per hour
if (attempt.count >= 3) {
  return res.status(429).json({ 
    message: 'Too many reset attempts. Please try again in 1 hour.' 
  });
}

attempt.count++;
resetAttempts.set(email, attempt);
```

---

## Monitoring & Maintenance

### Weekly Tasks
- [ ] Check SendGrid dashboard for bounces
- [ ] Review email delivery rates
- [ ] Monitor API usage

### Monthly Tasks
- [ ] Review email analytics
- [ ] Check if approaching free tier limits
- [ ] Update email templates if needed

### Quarterly Tasks
- [ ] Rotate API keys
- [ ] Review sender reputation
- [ ] Consider upgrading if needed

---

## Next Steps

1. ✅ Create SendGrid account
2. ✅ Generate API key
3. ✅ Verify sender email
4. ✅ Update .env file
5. ✅ Update email service code
6. ✅ Test password reset
7. ✅ Monitor SendGrid dashboard

---

## Support Resources

- **SendGrid Docs:** https://docs.sendgrid.com/
- **API Reference:** https://docs.sendgrid.com/api-reference/
- **Status Page:** https://status.sendgrid.com/
- **Support:** https://support.sendgrid.com/

---

## Summary

SendGrid gives you:
- ✅ Professional email delivery
- ✅ Better deliverability (no spam)
- ✅ Email analytics
- ✅ Scalability
- ✅ Free tier perfect for your needs

**Setup time: ~15 minutes**  
**Cost: FREE (100 emails/day)**  
**Recommended: YES** ⭐⭐⭐⭐⭐
