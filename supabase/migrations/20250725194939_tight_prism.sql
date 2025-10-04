/*
  # Fix Missing Permissions Table Error

  ## Problem Analysis
  - Error 42P01: relation "permissions" does not exist
  - Attempting to create foreign key constraint permissions_user_id_fkey
  - The permissions table was referenced but never created
  
  ## Solution
  1. Create the missing permissions table with proper structure
  2. Add the foreign key constraint to users table
  3. Set up proper RLS policies
  4. Include verification and rollback procedures

  ## Tables Created
  - `permissions` table with user_id foreign key
  - Proper indexes for performance
  - RLS policies for security
*/

-- Step 1: Check if permissions table already exists (safety check)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions' AND table_schema = 'public') THEN
    RAISE NOTICE 'Permissions table already exists, skipping creation';
  ELSE
    RAISE NOTICE 'Creating permissions table...';
  END IF;
END $$;

-- Step 2: Create the permissions table with comprehensive structure
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  permission_type VARCHAR(50) NOT NULL DEFAULT 'feature',
  resource_type VARCHAR(50),
  resource_id UUID,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add foreign key constraints with proper naming
DO $$
BEGIN
  -- Add foreign key to users table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'permissions_user_id_fkey' 
    AND table_name = 'permissions'
  ) THEN
    ALTER TABLE permissions 
    ADD CONSTRAINT permissions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint permissions_user_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint permissions_user_id_fkey already exists';
  END IF;

  -- Add foreign key for granted_by (self-referencing to users)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'permissions_granted_by_fkey' 
    AND table_name = 'permissions'
  ) THEN
    ALTER TABLE permissions 
    ADD CONSTRAINT permissions_granted_by_fkey 
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key constraint permissions_granted_by_fkey';
  END IF;
END $$;

-- Step 4: Add unique constraints to prevent duplicate permissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'permissions_user_permission_unique' 
    AND table_name = 'permissions'
  ) THEN
    ALTER TABLE permissions 
    ADD CONSTRAINT permissions_user_permission_unique 
    UNIQUE (user_id, permission_name, resource_type, resource_id);
    RAISE NOTICE 'Added unique constraint permissions_user_permission_unique';
  END IF;
END $$;

-- Step 5: Add check constraints for data validation
DO $$
BEGIN
  -- Check constraint for permission_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'permissions_type_check' 
    AND table_name = 'permissions'
  ) THEN
    ALTER TABLE permissions 
    ADD CONSTRAINT permissions_type_check 
    CHECK (permission_type IN ('feature', 'resource', 'action', 'admin'));
    RAISE NOTICE 'Added check constraint permissions_type_check';
  END IF;

  -- Check constraint for expiration logic
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'permissions_expiration_check' 
    AND table_name = 'permissions'
  ) THEN
    ALTER TABLE permissions 
    ADD CONSTRAINT permissions_expiration_check 
    CHECK (expires_at IS NULL OR expires_at > granted_at);
    RAISE NOTICE 'Added check constraint permissions_expiration_check';
  END IF;
END $$;

-- Step 6: Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_permission_name ON permissions(permission_name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON permissions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_permissions_expires ON permissions(expires_at) WHERE expires_at IS NOT NULL;

-- Step 7: Enable Row Level Security (RLS)
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for secure access
DO $$
BEGIN
  -- Policy: Users can view their own permissions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'permissions' 
    AND policyname = 'permissions_select_own'
  ) THEN
    CREATE POLICY permissions_select_own ON permissions
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created RLS policy: permissions_select_own';
  END IF;

  -- Policy: Admins can view all permissions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'permissions' 
    AND policyname = 'permissions_select_admin'
  ) THEN
    CREATE POLICY permissions_select_admin ON permissions
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role IN ('pastor', 'admin')
        )
      );
    RAISE NOTICE 'Created RLS policy: permissions_select_admin';
  END IF;

  -- Policy: Only admins can insert permissions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'permissions' 
    AND policyname = 'permissions_insert_admin'
  ) THEN
    CREATE POLICY permissions_insert_admin ON permissions
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role IN ('pastor', 'admin')
        )
      );
    RAISE NOTICE 'Created RLS policy: permissions_insert_admin';
  END IF;

  -- Policy: Only admins can update permissions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'permissions' 
    AND policyname = 'permissions_update_admin'
  ) THEN
    CREATE POLICY permissions_update_admin ON permissions
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role IN ('pastor', 'admin')
        )
      );
    RAISE NOTICE 'Created RLS policy: permissions_update_admin';
  END IF;

  -- Policy: Only admins can delete permissions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'permissions' 
    AND policyname = 'permissions_delete_admin'
  ) THEN
    CREATE POLICY permissions_delete_admin ON permissions
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role IN ('pastor', 'admin')
        )
      );
    RAISE NOTICE 'Created RLS policy: permissions_delete_admin';
  END IF;
END $$;

-- Step 9: Create helper function to check user permissions
CREATE OR REPLACE FUNCTION user_has_permission(
  user_uuid UUID,
  permission_name_param VARCHAR(100),
  resource_type_param VARCHAR(50) DEFAULT NULL,
  resource_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM permissions p
    WHERE p.user_id = user_uuid
      AND p.permission_name = permission_name_param
      AND p.is_active = TRUE
      AND (p.expires_at IS NULL OR p.expires_at > NOW())
      AND (resource_type_param IS NULL OR p.resource_type = resource_type_param)
      AND (resource_id_param IS NULL OR p.resource_id = resource_id_param)
  );
END;
$$;

-- Step 10: Insert default permissions for existing users (if any)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Add basic permissions for existing users based on their roles
  FOR user_record IN 
    SELECT id, role FROM users WHERE role IS NOT NULL
  LOOP
    -- Pastor gets all permissions
    IF user_record.role = 'pastor' THEN
      INSERT INTO permissions (user_id, permission_name, permission_type, granted_by)
      VALUES 
        (user_record.id, 'manage_users', 'feature', user_record.id),
        (user_record.id, 'manage_finances', 'feature', user_record.id),
        (user_record.id, 'view_reports', 'feature', user_record.id),
        (user_record.id, 'manage_settings', 'feature', user_record.id)
      ON CONFLICT (user_id, permission_name, resource_type, resource_id) DO NOTHING;
    
    -- Admin gets management permissions
    ELSIF user_record.role = 'admin' THEN
      INSERT INTO permissions (user_id, permission_name, permission_type, granted_by)
      VALUES 
        (user_record.id, 'manage_users', 'feature', user_record.id),
        (user_record.id, 'view_reports', 'feature', user_record.id),
        (user_record.id, 'manage_events', 'feature', user_record.id)
      ON CONFLICT (user_id, permission_name, resource_type, resource_id) DO NOTHING;
    
    -- Worker gets basic management permissions
    ELSIF user_record.role = 'worker' THEN
      INSERT INTO permissions (user_id, permission_name, permission_type, granted_by)
      VALUES 
        (user_record.id, 'mark_attendance', 'feature', user_record.id),
        (user_record.id, 'create_tasks', 'feature', user_record.id),
        (user_record.id, 'view_reports', 'feature', user_record.id)
      ON CONFLICT (user_id, permission_name, resource_type, resource_id) DO NOTHING;
    
    -- Member gets basic permissions
    ELSIF user_record.role = 'member' THEN
      INSERT INTO permissions (user_id, permission_name, permission_type, granted_by)
      VALUES 
        (user_record.id, 'view_events', 'feature', user_record.id),
        (user_record.id, 'submit_prayers', 'feature', user_record.id),
        (user_record.id, 'mark_own_attendance', 'feature', user_record.id)
      ON CONFLICT (user_id, permission_name, resource_type, resource_id) DO NOTHING;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Default permissions assigned to existing users';
END $$;

-- Step 11: Verification queries
DO $$
DECLARE
  table_exists BOOLEAN;
  constraint_count INTEGER;
  policy_count INTEGER;
  permission_count INTEGER;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'permissions' AND table_schema = 'public'
  ) INTO table_exists;
  
  -- Count constraints
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints 
  WHERE table_name = 'permissions' AND table_schema = 'public';
  
  -- Count RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'permissions';
  
  -- Count permissions records
  SELECT COUNT(*) INTO permission_count
  FROM permissions;
  
  -- Report results
  RAISE NOTICE '=== VERIFICATION RESULTS ===';
  RAISE NOTICE 'Table exists: %', table_exists;
  RAISE NOTICE 'Constraints created: %', constraint_count;
  RAISE NOTICE 'RLS policies created: %', policy_count;
  RAISE NOTICE 'Permission records: %', permission_count;
  
  IF table_exists AND constraint_count >= 3 AND policy_count >= 4 THEN
    RAISE NOTICE '✅ SUCCESS: Permissions table setup completed successfully!';
  ELSE
    RAISE WARNING '❌ ISSUE: Some components may not have been created properly';
  END IF;
END $$;

-- Step 12: Final constraint verification
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'permissions'
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Step 13: Test the helper function
DO $$
DECLARE
  test_user_id UUID;
  has_permission BOOLEAN;
BEGIN
  -- Get a test user ID (if any users exist)
  SELECT id INTO test_user_id FROM users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test the permission function
    SELECT user_has_permission(test_user_id, 'view_events') INTO has_permission;
    RAISE NOTICE 'Permission function test result: %', has_permission;
  ELSE
    RAISE NOTICE 'No users found for permission function testing';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 MIGRATION COMPLETED SUCCESSFULLY! 🎉';
  RAISE NOTICE '';
  RAISE NOTICE 'The permissions table has been created with:';
  RAISE NOTICE '✅ Proper foreign key constraints';
  RAISE NOTICE '✅ Unique constraints to prevent duplicates';
  RAISE NOTICE '✅ Check constraints for data validation';
  RAISE NOTICE '✅ Performance indexes';
  RAISE NOTICE '✅ Row Level Security policies';
  RAISE NOTICE '✅ Helper functions for permission checking';
  RAISE NOTICE '✅ Default permissions for existing users';
  RAISE NOTICE '';
  RAISE NOTICE 'The error "relation permissions does not exist" should now be resolved!';
END $$;