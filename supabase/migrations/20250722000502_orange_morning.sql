@@ .. @@
 ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

+-- Drop existing policies if they exist
+DROP POLICY IF EXISTS "All users can view departments" ON departments;
+
 CREATE POLICY "All users can view departments"
   ON departments
   FOR SELECT
@@ .. @@
 ALTER TABLE users ENABLE ROW LEVEL SECURITY;

+-- Drop existing policies if they exist
+DROP POLICY IF EXISTS "Users can read own data" ON users;
+DROP POLICY IF EXISTS "Users can update own data" ON users;
+
 CREATE POLICY "Users can read own data"
   ON users
   FOR SELECT