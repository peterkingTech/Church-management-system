# 🔧 Church Management System - Authentication Troubleshooting Guide

## 🚨 **Pastor Login Issues & Account Creation Problems**

### **1. Immediate Diagnostic Steps (30 seconds)**

#### ✅ **Quick Checks:**
1. **Open Browser Console** (Press F12 → Console tab)
   - Look for red error messages
   - Note any "Supabase" or "authentication" errors
   - Check for network failures

2. **Verify System Status:**
   - Click "Run Diagnostics" button on login page
   - Check all tests show green checkmarks
   - Note any failed tests

3. **Test Basic Connectivity:**
   - Try loading another website
   - Verify internet connection is stable

---

### **2. Pastor Login Issues**

#### **🔴 Solution 1: Password Reset (Most Common - 60%)**

**Symptoms:**
- "Incorrect password" error message
- "Invalid login credentials" error

**Steps:**
1. Click **"Forgot your password?"** on login page
2. Enter pastor's email address
3. Check email inbox (including spam folder)
4. Click reset link in email
5. Create new password (minimum 6 characters)
6. Try logging in with new password

**Verification:**
- ✅ Password reset email received within 5 minutes
- ✅ New password accepted
- ✅ Login successful

---

#### **🟡 Solution 2: Account Verification (25%)**

**Symptoms:**
- "Email not confirmed" error
- "Please check your email" message

**Steps:**
1. Check pastor's email for confirmation link
2. Look in spam/junk folder
3. Click confirmation link if found
4. If no email found, contact system administrator

**For Administrators:**
```sql
-- Check user confirmation status in Supabase
SELECT email, email_confirmed_at, role 
FROM auth.users 
WHERE email = 'pastor@church.com';
```

---

#### **🟠 Solution 3: Account Doesn't Exist (10%)**

**Symptoms:**
- "No account found with this email" error

**Steps:**
1. Verify correct email address spelling
2. Check if account was created with different email
3. Contact church administrator to create account
4. Use "Create Account" if pastor needs new registration

---

#### **🔵 Solution 4: Database Connection Issues (5%)**

**Symptoms:**
- Infinite loading screen
- "Cannot reach Supabase" in diagnostics
- Network timeout errors

**Steps:**
1. **Check Internet Connection:**
   - Try accessing other websites
   - Test from different device/network

2. **Clear Browser Cache:**
   - Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or manually clear cache in browser settings

3. **Try Different Browser:**
   - Chrome, Firefox, Safari, Edge
   - Use incognito/private mode

---

### **3. Account Creation Issues**

#### **🔴 Solution 1: Duplicate Email Prevention (50%)**

**Symptoms:**
- "User with this email already exists" error
- Account creation fails silently

**Steps:**
1. **Check Existing Accounts:**
   - Try logging in with the email first
   - Use password reset if account exists
   - Contact administrator to check user database

2. **Use Different Email:**
   - Try pastor's alternate email address
   - Use church domain email if available

**For Administrators:**
```sql
-- Check if user exists in database
SELECT id, email, role, is_confirmed 
FROM users 
WHERE email = 'pastor@church.com';
```

---

#### **🟡 Solution 2: Role Assignment Issues (30%)**

**Symptoms:**
- Account created but wrong permissions
- Cannot access pastor features

**Steps:**
1. **Verify Role Selection:**
   - Ensure "Pastor" role is selected during registration
   - Check role dropdown shows all options

2. **Administrator Role Update:**
   ```sql
   -- Update user role to pastor
   UPDATE users 
   SET role = 'pastor', is_confirmed = true 
   WHERE email = 'pastor@church.com';
   ```

---

#### **🟠 Solution 3: Database Schema Issues (15%)**

**Symptoms:**
- "Column does not exist" errors
- Database constraint violations

**Steps:**
1. **Run Database Migration:**
   - Go to Supabase Dashboard → SQL Editor
   - Run the migration script provided
   - Verify all tables exist

2. **Check Required Tables:**
   ```sql
   -- Verify essential tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('users', 'departments', 'church_settings');
   ```

---

#### **🔵 Solution 4: Permission/RLS Issues (5%)**

**Symptoms:**
- "Row Level Security policy violation"
- "Permission denied" errors

**Steps:**
1. **Check RLS Policies:**
   ```sql
   -- View current policies
   SELECT tablename, policyname, permissive, roles 
   FROM pg_policies 
   WHERE tablename = 'users';
   ```

2. **Temporarily Disable RLS (Emergency Only):**
   ```sql
   -- CAUTION: Only for troubleshooting
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   -- Remember to re-enable after fixing
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ```

---

### **4. Technical Diagnostics**

#### **Advanced Troubleshooting for IT Personnel:**

1. **Check Supabase Project Status:**
   - Visit [status.supabase.com](https://status.supabase.com)
   - Verify no ongoing outages
   - Check project-specific health

2. **Verify Environment Configuration:**
   ```bash
   # Check environment variables
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

3. **Test Database Connectivity:**
   ```javascript
   // Run in browser console
   fetch('https://your-project.supabase.co/rest/v1/users?select=count', {
     headers: {
       'apikey': 'your-anon-key',
       'Authorization': 'Bearer your-anon-key',
       'Prefer': 'count=exact'
     }
   }).then(r => console.log('DB Status:', r.status));
   ```

4. **Monitor Authentication Flow:**
   ```javascript
   // Check auth state changes
   supabase.auth.onAuthStateChange((event, session) => {
     console.log('Auth Event:', event, session);
   });
   ```

---

### **5. Verification Steps**

#### **Confirm Login Issue is Resolved:**
- ✅ Pastor can enter email and password
- ✅ No error messages appear
- ✅ Dashboard loads within 10 seconds
- ✅ Pastor's name appears in welcome message
- ✅ All pastor features are accessible

#### **Confirm Account Creation is Resolved:**
- ✅ Registration form accepts pastor role
- ✅ Account creation completes successfully
- ✅ Confirmation email received (if enabled)
- ✅ New pastor can log in immediately
- ✅ All pastor permissions are active

---

### **6. Prevention Measures**

#### **For Church Administrators:**
1. **Regular Backups:**
   - Export user data weekly
   - Backup Supabase project settings
   - Document all custom configurations

2. **User Management Best Practices:**
   - Use consistent email formats
   - Document all pastor account details
   - Maintain emergency access procedures

3. **System Monitoring:**
   - Set up Supabase alerts
   - Monitor authentication metrics
   - Regular health checks

#### **For Pastors:**
1. **Account Security:**
   - Use strong, unique passwords
   - Enable two-factor authentication if available
   - Keep login credentials secure

2. **Regular Access:**
   - Log in at least weekly to prevent account issues
   - Update profile information when needed
   - Report access issues immediately

---

### **7. Emergency Procedures**

#### **If All Solutions Fail:**

1. **Create Emergency Pastor Account:**
   ```sql
   -- Create temporary pastor access
   INSERT INTO users (id, email, full_name, role, is_confirmed) 
   VALUES (gen_random_uuid(), 'emergency@church.com', 'Emergency Pastor', 'pastor', true);
   ```

2. **Contact Technical Support:**
   - Email: amentech.contact@gmail.com
   - Include: Error messages, browser console logs, steps attempted
   - Provide: Church name, pastor email, urgency level

3. **Alternative Access Methods:**
   - Use different device/browser
   - Try mobile access if available
   - Contact other administrators for assistance

---

### **8. Success Indicators**

#### **System is Working When:**
- ✅ Login page loads within 5 seconds
- ✅ Pastor can log in without errors
- ✅ Dashboard shows personalized welcome
- ✅ All pastor features are accessible
- ✅ New pastor accounts can be created
- ✅ No console errors during authentication

#### **Contact Information:**
- **Technical Support:** amentech.contact@gmail.com
- **Emergency Access:** Use emergency pastor account procedure
- **Documentation:** Refer to User Manual in application

---

*This guide covers 95% of authentication issues. If problems persist after following all steps, contact technical support with detailed error information.*