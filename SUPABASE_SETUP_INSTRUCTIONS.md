# 🚀 SUPABASE SETUP INSTRUCTIONS

## Step-by-Step Database Setup

### 1. Access Your Supabase Project
- Go to [supabase.com](https://supabase.com)
- Open your project: `sfpgntrvjhodblfhkrjk`
- Click on **"SQL Editor"** in the left sidebar

### 2. Run the Database Migration
1. **Copy the ENTIRE content** from `supabase/migrations/reset_for_production.sql`
2. **Paste it** into the SQL Editor
3. **Click "Run"** button
4. **Wait for completion** (should take 10-30 seconds)

### 3. Verify Tables Created
After running the migration, check that these tables exist:
- ✅ church_settings
- ✅ users  
- ✅ departments
- ✅ user_departments
- ✅ tasks
- ✅ attendance
- ✅ finance_records
- ✅ notifications
- ✅ notes
- ✅ registration_links
- ✅ programs
- ✅ souls_won
- ✅ folders
- ✅ folder_comments
- ✅ pd_reports

### 4. Verify Storage Buckets
Go to **Storage** in Supabase Dashboard and check:
- ✅ `avatars` bucket (public) - for profile images
- ✅ `documents` bucket (private) - for documents

### 5. Test Authentication
1. **Go to your app** and click "Create Account"
2. **Register first user** with role "pastor"
3. **This user will have full admin access**
4. **Login and test features**

## 🎯 What the Migration Does:

### Database Structure
- **Creates all tables** with proper relationships
- **Sets up Row Level Security** for data protection
- **Creates indexes** for performance
- **Adds default data** (departments, church settings)

### Security Setup
- **Role-based access control** (pastor, admin, worker, member, newcomer)
- **Users can only access their own data**
- **Admins can manage everything**
- **Secure file upload policies**

### Storage Configuration
- **Avatar uploads** to public bucket
- **Document uploads** to private bucket
- **File size limits** and type restrictions
- **User-specific folder structure**

### Default Data
- **8 default departments** (Worship, Youth, Children, etc.)
- **Church settings** with AMEN TECH branding
- **Proper role definitions**

## 🔧 Troubleshooting:

### If you get "policy already exists" error:
- The migration handles this automatically
- It drops existing policies before creating new ones
- Just run the migration again

### If tables already exist:
- The migration uses `CREATE TABLE IF NOT EXISTS`
- It will not overwrite existing data
- Safe to run multiple times

### If storage buckets exist:
- Uses `ON CONFLICT DO NOTHING`
- Will not create duplicates
- Existing buckets are preserved

## ✅ Success Indicators:

After running the migration, you should see:
1. **15+ tables created** in your database
2. **2 storage buckets** created
3. **Default departments** inserted
4. **Church settings** configured
5. **No error messages** in SQL Editor

Your database is now **100% production-ready**! 🎉