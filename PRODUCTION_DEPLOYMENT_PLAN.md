# Production Deployment Plan - UC METC SILMS

**SILMS** = Sales, Inventory, Locker, and Membership System

## 🎯 Recommended Setup

### Email Service: SendGrid
- **Cost:** FREE (100 emails/day)
- **Setup Time:** 15 minutes
- **Benefits:** Professional delivery, analytics, unlimited recipients

### Hosting: Railway
- **Cost:** FREE ($5/month credit)
- **Setup Time:** 20 minutes
- **Benefits:** All-in-one (frontend + backend + database)

### Total Monthly Cost: $0 🎉

---

## 📋 Step-by-Step Deployment

### Phase 1: Email Setup (15 minutes)

1. **Create SendGrid Account**
   - Go to: https://signup.sendgrid.com/
   - Sign up with hanssantoya@gmail.com
   - Verify email

2. **Create API Key**
   - Settings → API Keys → Create API Key
   - Name: `UC-METC-SILMS-Production`
   - Permissions: Mail Send (Full Access)
   - Copy the API key (starts with `SG.`)

3. **Verify Sender**
   - Settings → Sender Authentication → Single Sender Verification
   - From Email: hanssantoya@gmail.com
   - From Name: UC METC SILMS
   - Verify email

4. **Update backend/.env**
   ```env
   EMAIL_SERVICE=SendGrid
   EMAIL_USER=apikey
   EMAIL_PASSWORD=SG.your-actual-api-key-here
   EMAIL_FROM=hanssantoya@gmail.com
   ```

5. **Test Locally**
   ```bash
   cd backend
   npm run dev
   # Test forgot password feature
   ```

---

### Phase 2: Prepare for Deployment (10 minutes)

1. **Create Production Environment File**
   ```bash
   cp backend/.env backend/.env.production
   ```

2. **Update Production Values**
   ```env
   NODE_ENV=production
   PORT=5000
   
   # Database (Railway will provide this)
   DATABASE_URL=postgresql://...
   
   # JWT (Generate strong secret)
   JWT_SECRET=your-super-secure-production-secret-here
   JWT_EXPIRES_IN=30d
   
   # Email (SendGrid)
   EMAIL_SERVICE=SendGrid
   EMAIL_USER=apikey
   EMAIL_PASSWORD=SG.your-sendgrid-api-key
   EMAIL_FROM=hanssantoya@gmail.com
   
   # CORS (Update after deploying frontend)
   CORS_ORIGIN=https://your-app.railway.app
   ```

3. **Test Production Build**
   ```bash
   # Backend
   cd backend
   npm run build
   npm start
   
   # Frontend
   cd ..
   npm run build
   npm run preview
   ```

---

### Phase 3: Deploy to Railway (20 minutes)

#### A. Sign Up & Install CLI

1. **Create Railway Account**
   - Go to: https://railway.app/
   - Sign up with GitHub

2. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

#### B. Create Project

1. **Initialize Project**
   ```bash
   railway init
   # Name: uc-metc-silms
   ```

2. **Add PostgreSQL**
   ```bash
   railway add postgresql
   ```

3. **Get Database URL**
   ```bash
   railway variables
   # Copy DATABASE_URL
   ```

#### C. Deploy Backend

1. **Create backend service**
   ```bash
   cd backend
   railway up
   ```

2. **Set Environment Variables**
   - Go to Railway dashboard
   - Click your project → backend service
   - Variables tab → Add all from .env.production

3. **Configure Build**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Root Directory: `backend`

#### D. Deploy Frontend

1. **Update API URL**
   ```env
   # .env.production
   VITE_API_URL=https://your-backend.railway.app/api
   ```

2. **Deploy**
   ```bash
   cd ..
   railway up
   ```

3. **Configure Build**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview`
   - Root Directory: `/`

#### E. Update CORS

1. **Get Frontend URL**
   - Copy from Railway dashboard

2. **Update Backend Environment**
   ```env
   CORS_ORIGIN=https://your-frontend.railway.app
   ```

3. **Redeploy Backend**
   ```bash
   cd backend
   railway up
   ```

---

### Phase 4: Testing (15 minutes)

1. **Test Frontend**
   - Visit your Railway frontend URL
   - Check all pages load
   - Test navigation

2. **Test Backend API**
   ```bash
   curl https://your-backend.railway.app/api/public/stats
   ```

3. **Test Authentication**
   - Try logging in
   - Create test account
   - Check JWT token

4. **Test Password Reset**
   - Go to Forgot Password
   - Enter email
   - Check SendGrid dashboard
   - Verify email received
   - Test reset code

5. **Test Database**
   - Create some data
   - Verify persistence
   - Check relationships

---

### Phase 5: Custom Domain (Optional - 10 minutes)

1. **Get Domain**
   - Use existing school domain
   - Or register free at: https://www.freenom.com/

2. **Configure DNS**
   - Add CNAME record:
     ```
     Type: CNAME
     Name: silms (or @)
     Value: your-app.railway.app
     ```

3. **Add to Railway**
   - Railway dashboard → Settings → Domains
   - Add custom domain
   - Wait for SSL certificate

---

## 🔒 Security Checklist

### Before Going Live:

- [ ] Change JWT_SECRET to strong random string
- [ ] Enable HTTPS only (Railway does this automatically)
- [ ] Set secure CORS_ORIGIN
- [ ] Verify SendGrid sender
- [ ] Test all authentication flows
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Review user permissions
- [ ] Test password reset
- [ ] Check for exposed secrets

### Production .gitignore:

```gitignore
# Environment files
.env
.env.local
.env.production
backend/.env
backend/.env.production

# Dependencies
node_modules/
backend/node_modules/

# Build outputs
dist/
backend/dist/
build/

# Logs
*.log
backend/*.log

# OS files
.DS_Store
Thumbs.db
```

---

## 📊 Monitoring Setup

### 1. SendGrid Monitoring

- **Dashboard:** https://app.sendgrid.com/
- **Check daily:**
  - Emails sent
  - Delivery rate
  - Bounce rate
  - Spam reports

### 2. Railway Monitoring

- **Dashboard:** https://railway.app/dashboard
- **Check weekly:**
  - CPU usage
  - Memory usage
  - Bandwidth usage
  - Error logs

### 3. Application Monitoring

- **Set up alerts for:**
  - Failed logins
  - Database errors
  - Email failures
  - API errors

---

## 🆘 Troubleshooting

### Email Not Sending

1. Check SendGrid dashboard for errors
2. Verify API key is correct
3. Check sender is verified
4. Review backend logs
5. Test with different email

### Database Connection Failed

1. Check DATABASE_URL is correct
2. Verify PostgreSQL is running
3. Check connection limits
4. Review Railway logs

### Frontend Can't Reach Backend

1. Check CORS_ORIGIN matches frontend URL
2. Verify backend is deployed
3. Check API URL in frontend .env
4. Test backend endpoint directly

### Deployment Failed

1. Check build logs in Railway
2. Verify all dependencies installed
3. Check environment variables
4. Test build locally first

---

## 💰 Cost Breakdown

### Month 1-3 (Free Tier)

| Service | Cost | Usage |
|---------|------|-------|
| Railway | $0 | $5 credit/month |
| SendGrid | $0 | 100 emails/day |
| Domain (optional) | $0-12/year | One-time |
| **Total** | **$0/month** | |

### Month 4+ (If Needed)

| Service | Cost | When to Upgrade |
|---------|------|-----------------|
| Railway | $5-10/month | >$5 credit usage |
| SendGrid | $0 | Still free |
| **Total** | **$5-10/month** | |

---

## 📈 Success Metrics

### Week 1:
- [ ] Application deployed
- [ ] Email working
- [ ] 10+ test users
- [ ] All features tested

### Month 1:
- [ ] 50+ active users
- [ ] <1% error rate
- [ ] 99% uptime
- [ ] Positive feedback

### Month 3:
- [ ] 100+ active users
- [ ] Email delivery >95%
- [ ] Fast response times
- [ ] Ready to scale

---

## 🎉 Launch Checklist

### Pre-Launch:
- [ ] All features tested
- [ ] Email working perfectly
- [ ] Database backed up
- [ ] Security reviewed
- [ ] Performance tested
- [ ] Documentation complete

### Launch Day:
- [ ] Announce to users
- [ ] Monitor closely
- [ ] Be ready for support
- [ ] Collect feedback

### Post-Launch:
- [ ] Daily monitoring (week 1)
- [ ] Weekly check-ins
- [ ] User feedback review
- [ ] Performance optimization

---

## 📞 Support Contacts

### Technical Issues:
- **Railway:** https://railway.app/help
- **SendGrid:** https://support.sendgrid.com/
- **GitHub:** Your repository issues

### Emergency Contacts:
- **Database down:** Check Railway status
- **Email not working:** Check SendGrid status
- **App crashed:** Check Railway logs

---

## ✅ Summary

**Your Production Stack:**
- ✅ SendGrid for emails (FREE)
- ✅ Railway for hosting (FREE)
- ✅ PostgreSQL database (included)
- ✅ Automatic HTTPS
- ✅ Custom domain support
- ✅ Auto-deploy from GitHub

**Total Setup Time:** ~60 minutes  
**Monthly Cost:** $0 (free tier)  
**Capacity:** 100-500 users  
**Reliability:** ⭐⭐⭐⭐⭐

**You're ready to deploy! 🚀**

Follow the steps above and your UC METC SILMS will be live in production!
