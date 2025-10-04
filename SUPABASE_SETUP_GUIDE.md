# 🚀 Supabase Connection Setup Guide

## Step 1: Create/Access Supabase Project

1. **Go to [supabase.com](https://supabase.com)**
2. **Sign in** or create a new account
3. **Create a new project** or select existing one
4. **Wait for project initialization** (2-3 minutes)

## Step 2: Get Your Credentials

1. **Go to Settings → API** in your Supabase dashboard
2. **Copy these values:**
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon/public key** (long JWT token starting with `eyJ...`)

## Step 3: Update Environment Variables

1. **Open the `.env` file** in your project root
2. **Replace the placeholder values:**
   ```env
   VITE_SUPABASE_URL=https://your-actual-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-key
   ```

## Step 4: Run Database Migration

1. **Go to SQL Editor** in Supabase Dashboard
2. **Copy and paste** the migration from `supabase/migrations/create_comprehensive_rls_policies.sql`
3. **Click "Run"** to execute the migration
4. **Wait for completion** (should take 30-60 seconds)

## Step 5: Verify Connection

1. **Restart your development server:**
   ```bash
   npm run dev
   ```
2. **The app should now connect to Supabase successfully**
3. **Try creating a user account to test the connection**

## 🔧 Troubleshooting

### If you see "Configuration Required" error:
- Double-check your `.env` file has the correct values
- Restart the development server after updating `.env`
- Make sure there are no extra spaces in the environment variables

### If you see database errors:
- Run the RLS policies migration in Supabase SQL Editor
- Check that your Supabase project is active and running
- Verify the anon key has the correct permissions

### If authentication fails:
- Ensure email confirmation is disabled in Supabase Auth settings
- Check that the project URL is correct (no trailing slash)
- Verify the anon key is the public key, not the service role key

## 📞 Need Help?

If you encounter issues:
1. Check the browser console (F12) for detailed error messages
2. Verify your Supabase project is active in the dashboard
3. Make sure you're using the anon/public key, not the service role key