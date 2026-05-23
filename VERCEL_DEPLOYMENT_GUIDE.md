# Vercel Deployment Guide - Smart Product Inventory

## 🚨 Current Issue: 401 Login Error

**Error**: `Failed to load resource: the server responded with a status of 401 ()`

**Cause**: Missing or incorrect environment variables in Vercel

## ✅ Required Environment Variables

You MUST set these in Vercel Dashboard → Project Settings → Environment Variables:

### 1. DATABASE_URL (REQUIRED)
```
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

**For Supabase**:
```
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 2. DIRECT_URL (REQUIRED for Migrations)
```
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### 3. JWT_SECRET (REQUIRED)
```
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"
```

**Generate a secure secret**:
```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32
```

### 4. NEXT_PUBLIC_APP_NAME (Optional)
```
NEXT_PUBLIC_APP_NAME="Smart Product Inventory"
```

## 📋 Step-by-Step Fix

### Step 1: Check Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project: `smart-inventory-k3xa`
3. Go to **Settings** → **Environment Variables**
4. Verify these variables exist:
   - ✅ `DATABASE_URL`
   - ✅ `DIRECT_URL`
   - ✅ `JWT_SECRET`

### Step 2: Add Missing Variables

If any are missing, add them:

1. Click **Add New**
2. Enter **Key**: `JWT_SECRET`
3. Enter **Value**: (your generated secret)
4. Select **All Environments** (Production, Preview, Development)
5. Click **Save**

Repeat for `DATABASE_URL` and `DIRECT_URL`

### Step 3: Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **⋯** (three dots) → **Redeploy**
4. Check **Use existing Build Cache** (optional)
5. Click **Redeploy**

### Step 4: Test Login

1. Go to https://smart-inventory-k3xa.vercel.app/login
2. Try logging in with your credentials
3. Check browser console for errors

## 🔍 Troubleshooting

### Issue 1: Still Getting 401 Error

**Check Vercel Logs**:
1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** → Latest deployment
3. Click **View Function Logs**
4. Look for errors like:
   - `JWT_SECRET is not configured`
   - `Can't reach database`
   - `P1001` (database connection error)

**Solution**:
- If JWT_SECRET error → Add JWT_SECRET environment variable
- If database error → Check DATABASE_URL is correct
- If P1001 error → Check database is accessible from Vercel

### Issue 2: Database Connection Failed

**Error**: `Can't reach database` or `P1001`

**Possible Causes**:
1. DATABASE_URL is incorrect
2. Database is not accessible from Vercel's IP addresses
3. Using wrong port (should be 6543 for pooling, not 5432)

**Solution for Supabase**:
1. Go to Supabase Dashboard → Project Settings → Database
2. Copy **Connection Pooling** string (port 6543)
3. Update DATABASE_URL in Vercel with pooling URL
4. Redeploy

### Issue 3: Invalid Credentials (But Credentials Are Correct)

**Possible Causes**:
1. Database is empty (no users seeded)
2. Using wrong database
3. Password hashing mismatch

**Solution**:
```bash
# Run seed script to create admin user
npm run prisma:seed

# Or manually create user in database
```

### Issue 4: Cookie Not Being Set

**Error**: Login succeeds but redirects back to login

**Possible Causes**:
1. Cookie domain mismatch
2. Secure flag issue
3. SameSite attribute issue

**Solution**: Already fixed in the code update. Redeploy to apply.

## 🗄️ Database Setup for Vercel

### Option 1: Supabase (Recommended)

1. Create Supabase project at https://supabase.com
2. Go to Project Settings → Database
3. Copy **Connection Pooling** string
4. Add to Vercel as `DATABASE_URL`
5. Copy **Direct Connection** string
6. Add to Vercel as `DIRECT_URL`

### Option 2: Neon

1. Create Neon project at https://neon.tech
2. Copy connection string
3. Add to Vercel as `DATABASE_URL` and `DIRECT_URL`

### Option 3: Railway

1. Create Railway project at https://railway.app
2. Add PostgreSQL service
3. Copy connection string
4. Add to Vercel as `DATABASE_URL` and `DIRECT_URL`

## 🔐 Security Checklist

- [ ] JWT_SECRET is at least 32 characters long
- [ ] JWT_SECRET is randomly generated (not a simple password)
- [ ] DATABASE_URL contains correct credentials
- [ ] Database is accessible from Vercel's IP ranges
- [ ] Using connection pooling (port 6543) for Supabase
- [ ] Environment variables are set for all environments

## 📝 Example Environment Variables

```env
# Database (Supabase with Connection Pooling)
DATABASE_URL="postgresql://postgres.abcdefghijklmnop:your-password@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Database Connection (for migrations)
DIRECT_URL="postgresql://postgres.abcdefghijklmnop:your-password@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# JWT Secret (32+ characters)
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"

# App Name (Optional)
NEXT_PUBLIC_APP_NAME="Smart Product Inventory"
```

## 🧪 Test After Deployment

### 1. Test Login API Directly

```bash
curl -X POST https://smart-inventory-k3xa.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@example.com","password":"your-password"}'
```

**Expected Response**:
```json
{
  "success": true,
  "userId": "...",
  "role": "ADMIN",
  "redirect": "/"
}
```

### 2. Test Database Connection

```bash
curl https://smart-inventory-k3xa.vercel.app/api/health
```

### 3. Test in Browser

1. Open https://smart-inventory-k3xa.vercel.app/login
2. Open Browser DevTools (F12) → Console
3. Try logging in
4. Check for errors in console
5. Check Network tab for API responses

## 🚀 Quick Fix Commands

### Redeploy from CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Add environment variables
vercel env add JWT_SECRET
vercel env add DATABASE_URL
vercel env add DIRECT_URL

# Redeploy
vercel --prod
```

## 📞 Still Having Issues?

### Check Vercel Logs

```bash
# View logs in real-time
vercel logs --follow

# View specific deployment logs
vercel logs [deployment-url]
```

### Common Log Messages

**"JWT_SECRET is not configured"**
→ Add JWT_SECRET environment variable

**"Can't reach database server"**
→ Check DATABASE_URL and database accessibility

**"Invalid credentials"**
→ Check if user exists in database

**"P2025: Record not found"**
→ User doesn't exist, run seed script

## ✅ Verification Checklist

After fixing:

- [ ] Can access https://smart-inventory-k3xa.vercel.app/login
- [ ] Login form loads without errors
- [ ] Can submit login form
- [ ] No 401 errors in console
- [ ] Successfully redirects to dashboard after login
- [ ] Can see data in dashboard
- [ ] Can navigate to other pages
- [ ] Can logout successfully

## 📚 Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

**Most Common Fix**: Add `JWT_SECRET` environment variable in Vercel and redeploy!
