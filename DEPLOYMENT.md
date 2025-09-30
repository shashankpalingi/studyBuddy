# Deployment Guide 🚀

This guide walks you through deploying Study Buddy to production environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Firebase Configuration](#firebase-configuration)
- [Supabase Configuration](#supabase-configuration)
- [Netlify Deployment](#netlify-deployment)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Environment Variables](#environment-variables)
- [Production Checklist](#production-checklist)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Accounts
- **GitHub Account** (for code repository)
- **Netlify Account** (for hosting)
- **Firebase Account** (for auth & database)
- **Supabase Account** (for file storage)

### Local Development
- **Node.js** v18 or higher
- **npm** or **yarn** package manager
- **Git** for version control

## 🌐 Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-username/study-buddy.git
cd study-buddy
```

### 2. Install Dependencies
```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies (optional)
cd ../backend
npm install
```

## 🔥 Firebase Configuration

### 1. Create Firebase Project

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Click "Create a project"**
3. **Follow the setup wizard:**
   - Project name: `study-buddy-prod` (or your preference)
   - Enable Google Analytics (recommended)
   - Choose analytics account

### 2. Enable Authentication

1. **Navigate to Authentication → Sign-in method**
2. **Enable providers:**
   - ✅ Email/Password
   - ✅ Google (configure OAuth consent screen)
   - ✅ GitHub (optional, add client ID/secret)

### 3. Create Firestore Database

1. **Go to Firestore Database**
2. **Click "Create database"**
3. **Choose production mode**
4. **Select region** (choose closest to your users)

### 4. Configure Security Rules

Deploy the security rules from your backend folder:

```bash
cd backend
npm install -g firebase-tools
firebase login
firebase init
# Select existing project
firebase deploy --only firestore:rules
```

### 5. Get Firebase Configuration

1. **Go to Project Settings → Your apps**
2. **Add web app** if not already done
3. **Copy the configuration object:**

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 📦 Supabase Configuration

### 1. Create Supabase Project

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Click "New Project"**
3. **Configure project:**
   - Name: `study-buddy-storage`
   - Database password: Generate strong password
   - Region: Same as Firebase region (if possible)

### 2. Create Storage Bucket

1. **Navigate to Storage → Buckets**
2. **Click "New Bucket"**
3. **Configure bucket:**
   - Name: `study-buddy-files`
   - Public: ✅ Enabled
   - File size limit: `10MB` (optional)

### 3. Set Up Storage Policies

1. **Go to SQL Editor**
2. **Run the configuration SQL:**

```sql
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes" ON storage.objects;

-- Create permissive policies for Firebase Auth integration
CREATE POLICY "Allow all uploads" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'study-buddy-files');

CREATE POLICY "Allow all reads" ON storage.objects 
  FOR SELECT USING (bucket_id = 'study-buddy-files');

CREATE POLICY "Allow all updates" ON storage.objects 
  FOR UPDATE WITH CHECK (bucket_id = 'study-buddy-files');

CREATE POLICY "Allow all deletes" ON storage.objects 
  FOR DELETE USING (bucket_id = 'study-buddy-files');
```

### 4. Get Supabase Credentials

1. **Go to Settings → API**
2. **Copy the values:**
   - Project URL: `https://your-project.supabase.co`
   - Anon key: `your-supabase-anon-key`

## 🌍 Netlify Deployment

### 1. Connect Repository

1. **Log in to [Netlify](https://netlify.com)**
2. **Click "New site from Git"**
3. **Choose GitHub** and authorize
4. **Select your forked repository**

### 2. Configure Build Settings

**Build Settings:**
- **Base directory:** `frontend`
- **Build command:** `npm run build`
- **Publish directory:** `frontend/dist`
- **Node version:** `18` (set in netlify.toml)

### 3. Environment Variables

In Netlify dashboard, go to **Site settings → Environment variables** and add:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: AI Features
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Deploy

1. **Click "Deploy site"**
2. **Monitor build logs** for any errors
3. **Test the deployed application**

### 5. Custom Domain (Optional)

1. **Go to Site settings → Domain management**
2. **Add custom domain**
3. **Configure DNS** with your domain provider
4. **Enable HTTPS** (automatic with Let's Encrypt)

## 🔄 GitHub Actions CI/CD

### 1. Repository Secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions** and add:

```env
# Netlify
NETLIFY_AUTH_TOKEN=your_netlify_auth_token
NETLIFY_SITE_ID=your_netlify_site_id

# Firebase
FIREBASE_TOKEN=your_firebase_ci_token

# Environment Variables (for build)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 2. Get Tokens

**Netlify Auth Token:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and get token
netlify login
netlify env:list # Shows your site ID
```

**Firebase Token:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and get CI token
firebase login:ci
```

### 3. Workflow Configuration

The GitHub workflow is already configured in `.github/workflows/deploy.yml`. It will:

- ✅ Run on pushes to `main` and `develop`
- ✅ Run linting and tests
- ✅ Build the application
- ✅ Deploy to Netlify (production on `main`, preview on other branches)
- ✅ Deploy Firebase rules
- ✅ Run security audits

## 📋 Environment Variables Reference

### Frontend (.env)

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef...

# Supabase Configuration
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: AI Features
VITE_GEMINI_API_KEY=AIzaSyD...

# Development Only
VITE_NODE_ENV=production
```

### Netlify Environment Variables

```env
NODE_VERSION=18
NPM_FLAGS=--production=false
COMMAND=npm run build
```

## ✅ Production Checklist

### Pre-Deployment
- [ ] **Firebase project created and configured**
- [ ] **Supabase project created with storage bucket**
- [ ] **All environment variables set**
- [ ] **Security rules deployed**
- [ ] **Domain configured (if using custom domain)**
- [ ] **SSL certificate enabled**

### Post-Deployment Testing
- [ ] **Application loads successfully**
- [ ] **User registration and login work**
- [ ] **File upload/download functions**
- [ ] **Real-time features sync properly**
- [ ] **Video calls connect successfully**
- [ ] **Whiteboard collaboration works**
- [ ] **Mobile responsiveness verified**
- [ ] **Performance metrics acceptable**

### Security Verification
- [ ] **HTTPS enabled and working**
- [ ] **Firebase security rules active**
- [ ] **Supabase RLS policies working**
- [ ] **No sensitive data in client code**
- [ ] **CORS policies configured correctly**

### Monitoring Setup
- [ ] **Firebase Analytics enabled**
- [ ] **Netlify Analytics configured**
- [ ] **Error tracking implemented**
- [ ] **Performance monitoring active**

## 📊 Monitoring & Maintenance

### 1. Firebase Console Monitoring

**Key Metrics to Watch:**
- **Authentication:** Daily active users, sign-in success rate
- **Firestore:** Read/write operations, query performance
- **Performance:** Page load times, network requests
- **Crashlytics:** Error rates and crash reports

### 2. Supabase Dashboard Monitoring

**Storage Metrics:**
- **Usage:** Storage consumed vs. quota
- **API Calls:** Request volume and success rate
- **Performance:** Upload/download speeds
- **Costs:** Monthly usage costs

### 3. Netlify Analytics

**Deployment Metrics:**
- **Build Status:** Success/failure rates
- **Deploy Times:** Build duration trends
- **Traffic:** Unique visitors, page views
- **Performance:** Core Web Vitals

### 4. Alert Setup

**Firebase Alerts:**
```javascript
// Set up in Firebase Console > Alerts
- Firestore quota usage > 80%
- Authentication failures > 5%
- Performance issues detected
```

**Supabase Alerts:**
```sql
-- Storage usage alerts
-- Set up in Supabase Dashboard > Settings > Billing
- Storage usage > 80% of quota
- API requests approaching limits
```

## 🔧 Troubleshooting

### Common Deployment Issues

#### Build Failures

**Symptom:** Build fails in CI/CD
```bash
Error: Missing environment variables
```

**Solution:**
1. Verify all environment variables are set
2. Check for typos in variable names
3. Ensure secrets are accessible in the correct environment

#### Authentication Issues

**Symptom:** Users cannot sign in after deployment
```javascript
Error: Firebase config invalid
```

**Solution:**
1. Verify Firebase configuration in production
2. Check authorized domains in Firebase console
3. Ensure HTTPS is enabled

#### Storage Upload Failures

**Symptom:** File uploads fail in production
```javascript
Error: new row violates row-level security policy
```

**Solution:**
1. Verify Supabase storage policies are applied
2. Check bucket permissions and public access
3. Confirm environment variables are correct

#### Real-time Features Not Working

**Symptom:** Chat/whiteboard not syncing in real-time
```javascript
Error: Firestore permission denied
```

**Solution:**
1. Deploy latest Firestore security rules
2. Check user authentication status
3. Verify Firestore indexes are built

### Performance Optimization

#### Slow Loading

**Symptoms:**
- Initial page load > 3 seconds
- Large bundle size warnings

**Solutions:**
```javascript
// Implement code splitting
const LazyComponent = lazy(() => import('./Component'));

// Optimize images
// Use WebP format where possible
// Implement lazy loading for images
```

#### High Storage Costs

**Symptoms:**
- Unexpected Supabase storage charges
- Rapid storage growth

**Solutions:**
```sql
-- Clean up old files regularly
DELETE FROM storage.objects 
WHERE bucket_id = 'study-buddy-files' 
AND created_at < NOW() - INTERVAL '90 days'
AND name LIKE 'whiteboards/%';
```

### Emergency Procedures

#### Rollback Deployment

**If critical issues arise:**

1. **Netlify Rollback:**
```bash
# Via Netlify CLI
netlify rollback
```

2. **Firebase Rules Rollback:**
```bash
# Revert to previous rules
firebase deploy --only firestore:rules
```

3. **DNS/Domain Issues:**
```bash
# Check DNS propagation
dig your-domain.com
nslookup your-domain.com
```

#### Incident Response

**Priority Levels:**
- **P0 (Critical):** App completely down, data loss risk
- **P1 (High):** Major functionality broken, security issues
- **P2 (Medium):** Some features affected, workarounds available
- **P3 (Low):** Minor issues, cosmetic problems

**Response Actions:**
1. **Assess impact** and assign priority
2. **Communicate** with users if necessary
3. **Implement fix** or rollback
4. **Monitor** for resolution
5. **Post-mortem** for P0/P1 incidents

## 📞 Support Resources

### Documentation
- **Firebase Docs:** https://firebase.google.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **React Docs:** https://react.dev

### Community Support
- **GitHub Issues:** Project-specific problems
- **Discord:** Real-time community help
- **Stack Overflow:** Technical questions
- **Reddit:** r/Firebase, r/reactjs communities

### Professional Support
- **Firebase Support:** Available with Blaze plan
- **Supabase Support:** Pro plan and above
- **Netlify Support:** Team plan and above

---

## 🎉 Deployment Complete!

Once you've followed this guide, your Study Buddy application should be:

- ✅ **Live and accessible** at your chosen domain
- ✅ **Secure** with proper authentication and storage policies
- ✅ **Scalable** with cloud infrastructure
- ✅ **Monitored** with comprehensive analytics
- ✅ **Maintainable** with automated CI/CD

**Happy deploying! 🚀**

---

*For additional help, please check our [CONTRIBUTING.md](CONTRIBUTING.md) or create an issue on GitHub.*