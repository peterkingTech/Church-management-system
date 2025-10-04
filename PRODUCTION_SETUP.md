# Production Setup Instructions

## 🚀 Complete Production Setup for Church Data Log Management System

### 1. Supabase Project Setup

#### A. Create New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and enter project details
4. Wait for project to be created

#### B. Get Your Keys
1. Go to Project Settings → API
2. Copy your Project URL and anon/public key
3. Create `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Database Setup

#### A. Run Migration
1. In Supabase Dashboard, go to SQL Editor
2. Copy and paste the entire content from `supabase/migrations/reset_for_production.sql`
3. Click "Run" to execute the migration
4. This will:
   - Clean all demo data
   - Set up proper RLS policies
   - Create storage bucket for avatars
   - Add default departments and church settings

#### B. Verify Tables
Check that these tables exist with proper RLS:
- ✅ users
- ✅ departments
- ✅ user_departments
- ✅ tasks
- ✅ attendance
- ✅ finance_records
- ✅ notifications
- ✅ notes
- ✅ church_settings
- ✅ And all other tables from your schema

### 3. Storage Setup

#### A. Avatars Bucket
The migration creates an `avatars` bucket automatically. Verify:
1. Go to Storage in Supabase Dashboard
2. Check that `avatars` bucket exists
3. Verify it's set to public
4. Check that RLS policies are applied

#### B. Storage Policies
These policies are automatically created:
- Users can upload their own avatar
- Users can update their own avatar
- Users can delete their own avatar
- Avatar images are publicly accessible

### 4. Authentication Setup

#### A. Email Settings
1. Go to Authentication → Settings
2. Configure email templates (optional)
3. Set up SMTP (optional, or use Supabase's default)

#### B. Auth Policies
All auth policies are automatically configured for:
- User registration
- Profile management
- Role-based access

### 5. Security Configuration

#### A. RLS Policies
All tables have proper RLS policies:
- Users can only see their own data
- Admins/Pastors can manage all data
- Workers can manage their department data
- Proper role-based access control

#### B. API Keys
- Use the anon/public key for client-side
- Never expose service role key in frontend
- All operations use RLS for security

### 6. First User Setup

#### A. Create Admin User
1. Use the registration form to create first user
2. Set role as "pastor" or "admin"
3. This user will have full access to manage others

#### B. Church Settings
1. Login as admin
2. Go to Church Settings
3. Update church information:
   - Church name
   - Address, phone, email
   - Colors and branding
   - Timezone and language

### 7. Production Checklist

#### ✅ Environment Variables
- [ ] VITE_SUPABASE_URL set correctly
- [ ] VITE_SUPABASE_ANON_KEY set correctly
- [ ] No demo/test keys in production

#### ✅ Database
- [ ] Migration executed successfully
- [ ] All tables have RLS enabled
- [ ] Demo data completely removed
- [ ] Default departments created

#### ✅ Storage
- [ ] Avatars bucket created and public
- [ ] Storage policies configured
- [ ] File upload working

#### ✅ Authentication
- [ ] User registration working
- [ ] Login/logout working
- [ ] Email verification (if enabled)
- [ ] Password reset (if needed)

#### ✅ Security
- [ ] RLS policies tested
- [ ] Role-based access working
- [ ] No unauthorized data access
- [ ] API keys secure

#### ✅ Features
- [ ] User management working
- [ ] Department management working
- [ ] All CRUD operations working
- [ ] File uploads working
- [ ] Notifications working

### 8. Testing Your Setup

#### A. Test User Registration
1. Go to `/register`
2. Create a new user with "pastor" role
3. Verify email confirmation (if enabled)
4. Login with new credentials

#### B. Test Core Features
1. Create departments
2. Add users to departments
3. Test attendance marking
4. Test file uploads
5. Test notifications

#### C. Test Security
1. Try accessing data as different roles
2. Verify RLS is working
3. Test unauthorized access attempts

### 9. Common Issues & Solutions

#### Issue: "Missing Supabase environment variables"
**Solution**: Check your `.env` file has correct variables

#### Issue: "Row Level Security policy violation"
**Solution**: Run the migration again to set up policies

#### Issue: "Storage bucket not found"
**Solution**: Create avatars bucket manually in Supabase Dashboard

#### Issue: "User registration fails"
**Solution**: Check auth settings and email configuration

### 10. Support

If you encounter issues:
1. Check Supabase logs in Dashboard
2. Check browser console for errors
3. Verify environment variables
4. Ensure migration ran successfully

Your app is now ready for production use! 🎉

## 🔐 Security Notes

- All user data is protected by RLS
- File uploads are scoped to user folders
- Role-based access is enforced
- No demo data remains in production
- All operations are authenticated

## 📱 Features Ready

- ✅ User Management
- ✅ Department Management  
- ✅ Attendance Tracking
- ✅ Task Management
- ✅ Finance Records
- ✅ Notifications
- ✅ File Uploads
- ✅ Multi-language Support
- ✅ Dark/Light Theme
- ✅ Mobile Responsive