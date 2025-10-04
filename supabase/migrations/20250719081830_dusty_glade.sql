/*
  # Fix permissions table relationship

  1. Changes
    - Add foreign key constraint between permissions.user_id and users.id
    - Ensure proper relationship exists for user permissions query
  
  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with foreign key constraint
*/

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'permissions_user_id_fkey' 
    AND table_name = 'permissions'
  ) THEN
    ALTER TABLE permissions 
    ADD CONSTRAINT permissions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;