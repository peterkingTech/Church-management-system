# 🚀 Church Management System - API Documentation

## 📋 Overview

This document provides comprehensive documentation for the Church Management System API built on Supabase. The API follows RESTful principles and includes real-time capabilities, authentication, and role-based access control.

## 🔐 Authentication

### Base URL
```
Production: https://your-project.supabase.co
Development: http://localhost:54321
```

### Authentication Methods

#### 1. Email/Password Authentication
```typescript
// Sign Up
POST /auth/v1/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "data": {
    "full_name": "John Doe",
    "role": "Member",
    "language": "en",
    "church_id": "uuid"
  }
}
```

#### 2. OAuth Providers
```typescript
// Google OAuth
POST /auth/v1/authorize?provider=google

// GitHub OAuth  
POST /auth/v1/authorize?provider=github
```

#### 3. Password Reset
```typescript
POST /auth/v1/recover
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Authorization Headers
```typescript
Authorization: Bearer <jwt_token>
apikey: <supabase_anon_key>
```

## 🏛️ Core Entities

### Churches
Multi-tenant support with complete data isolation.

```typescript
interface Church {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  theme_colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  default_language: string;
  timezone: string;
  settings: Record<string, any>;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Users
Comprehensive user profiles with role-based access.

```typescript
interface User {
  id: string;
  church_id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  birthday?: string;
  birthday_month?: number;
  birthday_day?: number;
  address?: string;
  emergency_contact?: Record<string, any>;
  profile_photo_url?: string;
  language: string;
  timezone?: string;
  is_confirmed: boolean;
  is_active: boolean;
  last_login_at?: string;
  last_seen_at?: string;
  church_joined_at: string;
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

### Roles
Flexible role system with custom permissions.

```typescript
interface Role {
  id: string;
  church_id: string;
  name: string;
  display_name: string;
  description?: string;
  is_default: boolean;
  permissions: Record<string, any>;
  color: string;
  sort_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
```

## 📊 API Endpoints

### Church Management

#### Get Church Settings
```typescript
GET /rest/v1/churches?id=eq.{church_id}
Authorization: Bearer <token>

Response: Church
```

#### Update Church Settings
```typescript
PATCH /rest/v1/churches?id=eq.{church_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Church Name",
  "theme_colors": {
    "primary": "#3B82F6",
    "secondary": "#10B981"
  }
}
```

#### Get Church Statistics
```typescript
GET /functions/v1/church-stats
Authorization: Bearer <token>

Response: {
  "total_users": number,
  "active_users": number,
  "departments": number,
  "upcoming_events": number,
  "pending_tasks": number
}
```

### User Management

#### Get All Users
```typescript
GET /rest/v1/users?church_id=eq.{church_id}&select=*,user_roles(role:roles(*)),user_departments(department:departments(*))
Authorization: Bearer <token>

Response: User[]
```

#### Create User
```typescript
POST /rest/v1/users
Content-Type: application/json
Authorization: Bearer <token>

{
  "church_id": "uuid",
  "email": "newuser@example.com",
  "full_name": "New User",
  "language": "en",
  "is_confirmed": true
}
```

#### Update User
```typescript
PATCH /rest/v1/users?id=eq.{user_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "full_name": "Updated Name",
  "phone": "+1234567890"
}
```

#### Delete User
```typescript
DELETE /rest/v1/users?id=eq.{user_id}
Authorization: Bearer <token>
```

#### Assign Role to User
```typescript
POST /rest/v1/user_roles
Content-Type: application/json
Authorization: Bearer <token>

{
  "user_id": "uuid",
  "role_id": "uuid"
}
```

### Task Management

#### Get Tasks
```typescript
GET /rest/v1/tasks?church_id=eq.{church_id}&select=*,assignee:users(full_name),assigner:users(full_name)
Authorization: Bearer <token>

Response: Task[]
```

#### Create Task
```typescript
POST /rest/v1/tasks
Content-Type: application/json
Authorization: Bearer <token>

{
  "church_id": "uuid",
  "title": "Task Title",
  "description": "Task description",
  "assignee_id": "uuid",
  "due_date": "2024-12-31T23:59:59Z",
  "priority": "high",
  "status": "pending"
}
```

#### Update Task
```typescript
PATCH /rest/v1/tasks?id=eq.{task_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "completed",
  "completion_percentage": 100,
  "completed_at": "2024-01-25T10:30:00Z"
}
```

### Event Management

#### Get Events
```typescript
GET /rest/v1/events?church_id=eq.{church_id}&event_date=gte.{start_date}&event_date=lte.{end_date}
Authorization: Bearer <token>

Response: Event[]
```

#### Create Event
```typescript
POST /rest/v1/events
Content-Type: application/json
Authorization: Bearer <token>

{
  "church_id": "uuid",
  "title": "Sunday Service",
  "description": "Weekly worship service",
  "event_date": "2024-01-28",
  "start_time": "10:00:00",
  "end_time": "12:00:00",
  "location": "Main Sanctuary",
  "event_type": "service",
  "requires_registration": false
}
```

#### Register for Event
```typescript
POST /rest/v1/event_registrations
Content-Type: application/json
Authorization: Bearer <token>

{
  "event_id": "uuid",
  "user_id": "uuid",
  "plus_ones": 2,
  "dietary_requirements": "Vegetarian"
}
```

### Attendance Tracking

#### Mark Attendance
```typescript
POST /rest/v1/attendance
Content-Type: application/json
Authorization: Bearer <token>

{
  "church_id": "uuid",
  "user_id": "uuid",
  "attendance_date": "2024-01-28",
  "was_present": true,
  "arrival_time": "09:45:00",
  "attendance_type": "service"
}
```

#### Get Attendance Records
```typescript
GET /rest/v1/attendance?church_id=eq.{church_id}&attendance_date=gte.{start_date}&select=*,user:users(full_name)
Authorization: Bearer <token>

Response: Attendance[]
```

### Prayer Requests

#### Get Prayer Requests
```typescript
GET /rest/v1/prayer_requests?church_id=eq.{church_id}&status=eq.active
Authorization: Bearer <token>

Response: PrayerRequest[]
```

#### Create Prayer Request
```typescript
POST /rest/v1/prayer_requests
Content-Type: application/json
Authorization: Bearer <token>

{
  "church_id": "uuid",
  "title": "Prayer for Healing",
  "message": "Please pray for my family member's recovery",
  "is_anonymous": false,
  "is_urgent": false,
  "category": "health",
  "visibility": "church"
}
```

#### Respond to Prayer
```typescript
POST /rest/v1/prayer_responses
Content-Type: application/json
Authorization: Bearer <token>

{
  "prayer_request_id": "uuid",
  "user_id": "uuid",
  "response_type": "prayed",
  "message": "Praying for you and your family"
}
```

### Notifications

#### Get Notifications
```typescript
GET /rest/v1/notifications?user_id=eq.{user_id}&order=created_at.desc&limit=50
Authorization: Bearer <token>

Response: Notification[]
```

#### Create Notification
```typescript
POST /functions/v1/send-notification
Content-Type: application/json
Authorization: Bearer <token>

{
  "user_ids": ["uuid1", "uuid2"],
  "title": "New Announcement",
  "message": "Important church update",
  "notification_type": "announcement",
  "priority": "high",
  "send_push": true
}
```

#### Mark as Read
```typescript
PATCH /rest/v1/notifications?id=eq.{notification_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "is_read": true,
  "read_at": "2024-01-25T10:30:00Z"
}
```

### File Management

#### Upload File
```typescript
POST /functions/v1/file-upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
- file: File
- entity_type: string
- entity_id: string (optional)
- access_level: "public" | "church" | "role" | "private"
```

#### Get File
```typescript
GET /rest/v1/file_uploads?id=eq.{file_id}&select=*,uploaded_by_user:users(full_name)
Authorization: Bearer <token>

Response: FileUpload
```

#### Delete File
```typescript
DELETE /rest/v1/file_uploads?id=eq.{file_id}
Authorization: Bearer <token>
```

### Financial Records

#### Get Financial Records
```typescript
GET /rest/v1/financial_records?church_id=eq.{church_id}&transaction_date=gte.{start_date}
Authorization: Bearer <token>

Response: FinancialRecord[]
```

#### Create Financial Record
```typescript
POST /rest/v1/financial_records
Content-Type: application/json
Authorization: Bearer <token>

{
  "church_id": "uuid",
  "transaction_type": "offering",
  "amount": 1500.00,
  "currency": "USD",
  "description": "Sunday morning offering",
  "transaction_date": "2024-01-28",
  "category": "weekly_offering"
}
```

### Reports

#### Generate Report
```typescript
POST /functions/v1/generate-report
Content-Type: application/json
Authorization: Bearer <token>

{
  "report_type": "attendance",
  "title": "Monthly Attendance Report",
  "period_start": "2024-01-01",
  "period_end": "2024-01-31",
  "format": "pdf"
}
```

#### Get Reports
```typescript
GET /rest/v1/reports?church_id=eq.{church_id}&order=created_at.desc
Authorization: Bearer <token>

Response: Report[]
```

## 🔄 Real-time Subscriptions

### WebSocket Connection
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
```

### Subscribe to Notifications
```typescript
const channel = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('New notification:', payload);
  })
  .subscribe();
```

### Subscribe to Announcements
```typescript
const channel = supabase
  .channel('announcements')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'announcements',
    filter: `church_id=eq.${churchId}`
  }, (payload) => {
    console.log('New announcement:', payload);
  })
  .subscribe();
```

### Subscribe to Task Updates
```typescript
const channel = supabase
  .channel('tasks')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: `assignee_id=eq.${userId}`
  }, (payload) => {
    console.log('Task update:', payload);
  })
  .subscribe();
```

## 🔒 Security & Permissions

### Row Level Security (RLS)
All tables have RLS enabled with church-scoped access control.

#### Example Policies
```sql
-- Users can only see data from their church
CREATE POLICY "Church data isolation" ON users
  FOR SELECT TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

-- Role-based access for sensitive data
CREATE POLICY "Financial access" ON financial_records
  FOR SELECT TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND (r.permissions->>'financial_access')::boolean = true
    )
  );
```

### Permission Checking
```typescript
// Check if user has specific permission
const hasPermission = await supabase.rpc('user_has_permission', {
  permission_name: 'financial_access'
});
```

## 📊 Rate Limiting

### API Rate Limits
- **Authentication**: 60 requests per minute
- **General API**: 100 requests per minute
- **File Upload**: 10 requests per minute
- **Real-time**: 100 events per second

### Headers
```typescript
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🚨 Error Handling

### Standard Error Response
```typescript
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": "Additional error details",
    "hint": "Suggestion for resolution"
  }
}
```

### Common Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

### Error Examples
```typescript
// Validation Error
{
  "error": {
    "message": "Invalid input data",
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "Invalid email format",
      "phone": "Phone number too long"
    }
  }
}

// Permission Error
{
  "error": {
    "message": "Insufficient permissions",
    "code": "PERMISSION_DENIED",
    "details": "User does not have financial_access permission"
  }
}
```

## 📈 Performance Guidelines

### Query Optimization
- Use `select` parameter to limit returned fields
- Implement pagination with `limit` and `offset`
- Use filters to reduce data transfer
- Leverage indexes for complex queries

### Best Practices
```typescript
// Good: Specific field selection
GET /rest/v1/users?select=id,full_name,email&limit=50

// Good: Filtered queries
GET /rest/v1/tasks?assignee_id=eq.{user_id}&status=eq.pending

// Good: Pagination
GET /rest/v1/events?limit=20&offset=40&order=event_date.desc
```

### Caching
- Use ETags for conditional requests
- Implement client-side caching for static data
- Cache user permissions and roles
- Use real-time subscriptions to invalidate cache

## 🧪 Testing

### Test Environment
```bash
# Start local Supabase
npx supabase start

# Run tests
npm run test

# Run integration tests
npm run test:integration
```

### Test Data Setup
```typescript
// Create test church
const testChurch = await ChurchService.createChurch({
  name: 'Test Church',
  email: 'test@example.com'
});

// Create test user
const testUser = await UserService.createUser({
  church_id: testChurch.id,
  email: 'testuser@example.com',
  full_name: 'Test User'
});
```

## 📚 SDK Examples

### JavaScript/TypeScript
```typescript
import { createClient } from '@supabase/supabase-js';
import { AuthService, UserService } from './services/supabaseService';

// Initialize client
const supabase = createClient(url, key);

// Authenticate
const { data: user } = await AuthService.signIn(email, password);

// Get users
const { data: users } = await UserService.getAllUsers(churchId);

// Real-time subscription
const subscription = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications'
  }, handleNotification)
  .subscribe();
```

### React Hook Example
```typescript
import { useEffect, useState } from 'react';
import { UserService } from '../services/supabaseService';

export function useUsers(churchId: string) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await UserService.getAllUsers(churchId);
        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [churchId]);

  return { users, loading, error };
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_APP_NAME="Church Management System"
VITE_ENVIRONMENT=production
```

### Supabase Configuration
```toml
# supabase/config.toml
[auth]
site_url = "https://yourdomain.com"
additional_redirect_urls = ["http://localhost:3000"]

[auth.external.google]
enabled = true
client_id = "your_google_client_id"
secret = "your_google_client_secret"
```

## 📞 Support

### Documentation
- **API Reference**: This document
- **User Guide**: Available in application
- **Video Tutorials**: Coming soon

### Contact
- **Technical Support**: support@amentech.com
- **Bug Reports**: GitHub Issues
- **Feature Requests**: GitHub Discussions

---

*This API documentation is automatically updated with each release. For the latest version, please check the official documentation.*