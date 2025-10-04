@@ .. @@
 ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

+-- Drop existing policies if they exist
+DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
+DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
+DROP POLICY IF EXISTS "User can insert task assigned by or to them" ON tasks;
+
 CREATE POLICY "Users can view assigned tasks"
   ON tasks
@@ .. @@
 ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

+-- Drop existing policies if they exist
+DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
+DROP POLICY IF EXISTS "Users can insert own attendance" ON attendance;
+
 CREATE POLICY "Users can view own attendance"
   ON attendance