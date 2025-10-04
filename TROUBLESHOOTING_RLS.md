# 🛡️ RLS Policy Conflict Troubleshooting Guide

## 1. Root Cause Analysis

### Why "policy already exists" error occurs:
- **Unique Constraint**: Policy names must be unique per table in PostgreSQL/Supabase
- **Failed Migrations**: Previous migration attempts may have partially created policies
- **Name Collisions**: Multiple migrations trying to create policies with identical names
- **Case Sensitivity**: PostgreSQL treats policy names as case-sensitive identifiers
- **Migration State**: Supabase doesn't automatically clean up failed migration artifacts

### Technical Details:
```sql
-- This fails if policy already exists:
CREATE POLICY "All users can view departments" ON departments...

-- Error: 42710 = duplicate_object error code
```

## 2. Immediate Solutions

### Solution A: Drop and Recreate (Recommended)
```sql
-- Safe approach - always works
DROP POLICY IF EXISTS "All users can view departments" ON departments;
CREATE POLICY "departments_select_all" ON departments
  FOR SELECT TO authenticated
  USING (true);
```

### Solution B: Check Before Creating
```sql
-- Conditional creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'departments' 
    AND policyname = 'All users can view departments'
  ) THEN
    EXECUTE 'CREATE POLICY "All users can view departments" ON departments FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;
```

### Solution C: Use Different Names
```sql
-- Use unique, descriptive names
CREATE POLICY "departments_public_read_v2" ON departments
  FOR SELECT TO authenticated
  USING (true);
```

## 3. Prevention Strategy

### Best Practices:

#### A. Consistent Naming Convention
```sql
-- Format: {table}_{operation}_{scope}
CREATE POLICY "users_select_own" ON users...
CREATE POLICY "departments_select_all" ON departments...
CREATE POLICY "tasks_insert_assigned" ON tasks...
```

#### B. Always Use IF EXISTS
```sql
-- For dropping
DROP POLICY IF EXISTS "policy_name" ON table_name;

-- For creating (use DO blocks)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE...) THEN
    -- Create policy
  END IF;
END $$;
```

#### C. Migration File Structure
```sql
-- 1. Drop existing policies
DROP POLICY IF EXISTS "old_policy" ON table_name;

-- 2. Create new policies
CREATE POLICY "new_policy" ON table_name...

-- 3. Verify creation
-- Add verification queries
```

#### D. Test Migrations
```sql
-- Always test in development first
-- Use transactions for rollback capability
BEGIN;
  -- Your migration code
  -- Test queries
ROLLBACK; -- or COMMIT if successful
```

## 4. Verification Steps

### Step 1: Check Policy Existence
```sql
-- List all policies for a table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'departments';
```

### Step 2: Verify RLS Status
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'departments', 'tasks');
```

### Step 3: Test Policy Functionality
```sql
-- Test as authenticated user
SET ROLE authenticated;
SELECT * FROM departments; -- Should work
RESET ROLE;
```

### Step 4: Check for Conflicts
```sql
-- Find duplicate policy names
SELECT tablename, policyname, COUNT(*) 
FROM pg_policies 
GROUP BY tablename, policyname 
HAVING COUNT(*) > 1;
```

## 5. Emergency Recovery

### If policies are completely broken:
```sql
-- Nuclear option - disable RLS temporarily
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
-- Fix policies
-- Re-enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
```

### If migration is stuck:
```sql
-- Check active connections
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Kill problematic connections if needed
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'active' AND query LIKE '%CREATE POLICY%';
```

## 6. Production Checklist

Before applying to production:
- [ ] Test migration in development environment
- [ ] Backup database before applying
- [ ] Use transactions for rollback capability
- [ ] Verify all policies work as expected
- [ ] Test with different user roles
- [ ] Monitor for performance impact
- [ ] Document all changes

## 7. Common Pitfalls

### Avoid These Mistakes:
1. **Recursive Policies**: Don't reference the same table in policy conditions
2. **Missing IF EXISTS**: Always use when dropping policies
3. **Hardcoded Values**: Use parameterized policies when possible
4. **No Testing**: Always test policies before production
5. **Complex Logic**: Keep policies simple and fast

### Example of What NOT to Do:
```sql
-- BAD: Recursive policy
CREATE POLICY "admin_access" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
  -- This creates infinite recursion!
```

### Example of What TO Do:
```sql
-- GOOD: Simple, non-recursive policy
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);
```

## 8. Monitoring and Maintenance

### Regular Checks:
```sql
-- Monthly policy audit
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
ORDER BY tablename, policyname;

-- Performance monitoring
SELECT 
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del
FROM pg_stat_user_tables 
WHERE schemaname = 'public';
```

This comprehensive approach ensures your RLS policies work correctly and your app loads without errors!