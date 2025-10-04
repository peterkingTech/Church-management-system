@@ .. @@
 ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

+-- Drop existing policies if they exist
+DROP POLICY IF EXISTS "Users can manage own notes" ON notes;
+
 CREATE POLICY "Users can manage own notes"
   ON notes
@@ .. @@
 ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

+-- Drop existing policies if they exist
+DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
+DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
+DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
+
 CREATE POLICY "Users can view own notifications"
   ON notifications