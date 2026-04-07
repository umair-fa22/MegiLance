# MegiLance Production Deployment Checklist

**Version**: 2.0
**Last Updated**: April 7, 2026

---

## Pre-Deployment Checklist

### 1. Security Secrets (CRITICAL)

- [ ] **Turso Database**
  - [ ] `TURSO_DATABASE_URL` - Production database URL
  - [ ] `TURSO_AUTH_TOKEN` - Production auth token

- [ ] **JWT & Security**
  - [ ] `SECRET_KEY` - Minimum 32 characters, cryptographically random
  - [ ] `JWT_SECRET_KEY` - Minimum 32 characters, different from SECRET_KEY
  - [ ] `NEXTAUTH_SECRET` - For frontend NextAuth.js

- [ ] **OAuth Credentials** (Set in hosting dashboard, NOT in code)
  - [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
  - [ ] `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`

- [ ] **Payment Processing**
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `STRIPE_PUBLISHABLE_KEY` (frontend)

- [ ] **Email Service**
  - [ ] `RESEND_API_KEY` or SMTP credentials
  - [ ] `FROM_EMAIL` - Verified sender domain

- [ ] **Monitoring**
  - [ ] `SENTRY_DSN` - Backend error tracking
  - [ ] `NEXT_PUBLIC_SENTRY_DSN` - Frontend error tracking
  - [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics (optional)

---

### 2. Environment Configuration

#### Backend (DigitalOcean App Platform)

```bash
# Required
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING
TURSO_DATABASE_URL=libsql://YOUR-DATABASE.turso.io
TURSO_AUTH_TOKEN=your-token
SECRET_KEY=your-32-char-minimum-secret
JWT_SECRET_KEY=your-different-32-char-secret
BACKEND_CORS_ORIGINS=["https://megilance.site","https://www.megilance.site"]
FRONTEND_URL=https://megilance.site

# Email
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=noreply@megilance.site

# Payments (if enabled)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

#### Frontend (Vercel)

```bash
# Required
NEXT_PUBLIC_API_URL=https://api.megilance.site/api
NEXT_PUBLIC_BACKEND_URL=https://api.megilance.site
NEXT_PUBLIC_WS_URL=wss://api.megilance.site
NEXT_PUBLIC_APP_URL=https://megilance.site

# OAuth (server-side, NOT NEXT_PUBLIC_)
NEXTAUTH_URL=https://megilance.site
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx

# Feature Flags
NEXT_PUBLIC_SHOW_DEMO_LOGIN=false
NEXT_PUBLIC_PREVIEW_MODE=false

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

### 3. Domain & SSL

- [ ] Domain DNS configured
  - [ ] `megilance.site` -> Vercel (frontend)
  - [ ] `api.megilance.site` -> DigitalOcean (backend)
- [ ] SSL certificates active (auto-provisioned by Vercel/DO)
- [ ] HSTS preload submitted (optional but recommended)
- [ ] www redirect configured (www.megilance.site -> megilance.site)

---

### 4. Database

- [ ] Turso production database created
- [ ] Migrations applied: `alembic upgrade head`
- [ ] Initial admin user created via seed script
- [ ] Database backup strategy configured
- [ ] Connection pooling optimized (default: 10 connections, 20 max)

---

### 5. Build Verification

```bash
# Backend health check
curl https://api.megilance.site/api/health/ready

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "version": "2.0.0"
}

# Frontend accessibility
curl -I https://megilance.site
# Should return 200 OK
```

---

## Deployment Commands

### Option A: Docker Compose (Self-Hosted)

```bash
# Clone and configure
git clone https://github.com/ghulam-mujtaba5/MegiLance.git
cd MegiLance

# Create .env from template
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Build and deploy
docker compose -f docker-compose.prod.yml up -d --build

# Apply migrations
docker compose exec backend alembic upgrade head

# Check status
docker compose ps
docker compose logs -f
```

### Option B: Platform Deployment (Recommended)

**Backend to DigitalOcean:**
1. Connect GitHub repo to DigitalOcean App Platform
2. Select `backend/Dockerfile` as build configuration
3. Configure environment variables in dashboard
4. Deploy

**Frontend to Vercel:**
1. Import project from GitHub to Vercel
2. Set root directory to `frontend`
3. Configure environment variables
4. Deploy

---

## Post-Deployment Verification

### Critical Checks

- [ ] Health check passes: `/api/health/ready`
- [ ] Login/logout works for all roles (client, freelancer, admin)
- [ ] Password reset email sent successfully
- [ ] File uploads work
- [ ] Real-time messaging connects (WebSocket)
- [ ] Payment flow works (test mode first)

### Performance Checks

- [ ] Lighthouse score > 80 on homepage
- [ ] API response time < 500ms for common endpoints
- [ ] No JavaScript errors in browser console
- [ ] Images load with optimization

### Security Checks

- [ ] No secrets in browser network tab
- [ ] CORS working correctly (no blocked requests)
- [ ] Rate limiting active on auth endpoints
- [ ] CSP headers present
- [ ] No mixed content warnings

---

## Rollback Procedure

### If Deployment Fails:

1. **DigitalOcean**: Click "Rollback" in deployment history
2. **Vercel**: Click "Redeploy" on previous successful deployment
3. **Docker**: `docker compose -f docker-compose.prod.yml down && git checkout previous-tag && docker compose up -d`

### If Database Issues:

1. Check Turso dashboard for connection issues
2. Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
3. Roll back migration if needed: `alembic downgrade -1`

---

## Monitoring Setup

### Recommended Services

1. **Sentry** - Error tracking (free tier available)
   - Add `SENTRY_DSN` to backend
   - Add `NEXT_PUBLIC_SENTRY_DSN` to frontend

2. **DigitalOcean Monitoring** - Built-in metrics
   - CPU, Memory, Network
   - Alert thresholds

3. **Vercel Analytics** - Frontend performance
   - Core Web Vitals
   - Page load times

4. **UptimeRobot** - Uptime monitoring (free)
   - Monitor `/api/health/live` every 5 minutes
   - Alert on failures

---

## GitHub Secrets Required

Add these to repository Settings > Secrets:

```
TURSO_TEST_DB_URL          # For CI testing
TURSO_TEST_TOKEN           # For CI testing
TEST_SECRET_KEY            # For CI testing
DIGITALOCEAN_ACCESS_TOKEN  # For deployment
VERCEL_TOKEN               # For deployment
VERCEL_ORG_ID              # For deployment
VERCEL_PROJECT_ID          # For deployment
```

---

## Support Resources

- **Turso Docs**: https://docs.turso.tech
- **DigitalOcean App Platform**: https://docs.digitalocean.com/products/app-platform/
- **Vercel Docs**: https://vercel.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Next.js Docs**: https://nextjs.org/docs

---

## Emergency Contacts

- **Backend Issues**: Check `/api/health/ready` and Sentry
- **Frontend Issues**: Check Vercel deployment logs
- **Database Issues**: Check Turso dashboard

---

**Deployment Approved By**: _______________
**Date**: _______________
**Version Deployed**: 2.0.0
