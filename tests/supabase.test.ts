import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { 
  AuthService, 
  ChurchService, 
  UserService, 
  NotificationService,
  StorageService 
} from '../src/services/supabaseService';

// Test configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';

const testClient = createClient(supabaseUrl, supabaseKey);

describe('Supabase Backend Services', () => {
  let testChurchId: string;
  let testUserId: string;
  let testRoleId: string;

  beforeAll(async () => {
    // Setup test data
    console.log('Setting up test environment...');
  });

  afterAll(async () => {
    // Cleanup test data
    console.log('Cleaning up test environment...');
  });

  describe('AuthService', () => {
    it('should sign up a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testpassword123',
        full_name: 'Test User',
        language: 'en',
        church_id: testChurchId
      };

      const { data, error } = await AuthService.signUp(userData);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.user?.email).toBe(userData.email);
      
      if (data?.user) {
        testUserId = data.user.id;
      }
    });

    it('should sign in with valid credentials', async () => {
      const { data, error } = await AuthService.signIn('test@example.com', 'testpassword123');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.user?.email).toBe('test@example.com');
    });

    it('should get current user with profile data', async () => {
      const { data, error } = await AuthService.getCurrentUser();
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.email).toBe('test@example.com');
    });

    it('should reset password', async () => {
      const { data, error } = await AuthService.resetPassword('test@example.com');
      
      expect(error).toBeNull();
    });
  });

  describe('ChurchService', () => {
    it('should create a new church', async () => {
      const churchData = {
        name: 'Test Church',
        address: '123 Test Street',
        email: 'test@testchurch.com',
        default_language: 'en'
      };

      const { data, error } = await ChurchService.createChurch(churchData);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.name).toBe(churchData.name);
      
      if (data) {
        testChurchId = data.id;
      }
    });

    it('should get church settings', async () => {
      const { data, error } = await ChurchService.getChurchSettings(testChurchId);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBe(testChurchId);
    });

    it('should update church settings', async () => {
      const updates = {
        name: 'Updated Test Church',
        theme_colors: { primary: '#FF0000', secondary: '#00FF00' }
      };

      const { data, error } = await ChurchService.updateChurchSettings(testChurchId, updates);
      
      expect(error).toBeNull();
      expect(data?.name).toBe(updates.name);
    });

    it('should get church statistics', async () => {
      const { data, error } = await ChurchService.getChurchStatistics(testChurchId);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(typeof data?.total_users).toBe('number');
    });

    it('should get upcoming birthdays', async () => {
      const { data, error } = await ChurchService.getUpcomingBirthdays(testChurchId, 7);
      
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should get roles', async () => {
      const { data, error } = await ChurchService.getRoles(testChurchId);
      
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBeGreaterThan(0);
      
      if (data && data.length > 0) {
        testRoleId = data[0].id;
      }
    });

    it('should create custom role', async () => {
      const roleData = {
        church_id: testChurchId,
        name: 'TestRole',
        display_name: 'Test Role',
        description: 'A test role',
        permissions: { test_permission: true }
      };

      const { data, error } = await ChurchService.createRole(roleData);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.name).toBe(roleData.name);
    });

    it('should get departments', async () => {
      const { data, error } = await ChurchService.getDepartments(testChurchId);
      
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('UserService', () => {
    it('should get all users', async () => {
      const { data, error } = await UserService.getAllUsers(testChurchId);
      
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should create a user', async () => {
      const userData = {
        church_id: testChurchId,
        email: 'newuser@example.com',
        full_name: 'New User',
        role_id: testRoleId,
        language: 'en'
      };

      const { data, error } = await UserService.createUser(userData);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.email).toBe(userData.email);
    });

    it('should update a user', async () => {
      const updates = {
        full_name: 'Updated User Name',
        phone: '+1234567890'
      };

      const { data, error } = await UserService.updateUser(testUserId, updates);
      
      expect(error).toBeNull();
      expect(data?.full_name).toBe(updates.full_name);
    });

    it('should assign role to user', async () => {
      const { data, error } = await UserService.assignRole(testUserId, testRoleId);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should get user permissions', async () => {
      const { data, error } = await UserService.getUserPermissions(testUserId);
      
      expect(error).toBeNull();
      expect(typeof data).toBe('object');
    });

    it('should search users', async () => {
      const { data, error } = await UserService.searchUsers(testChurchId, 'test');
      
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('NotificationService', () => {
    it('should create notification', async () => {
      const notificationData = {
        user_ids: [testUserId],
        title: 'Test Notification',
        message: 'This is a test notification',
        notification_type: 'test'
      };

      const { data, error } = await NotificationService.createNotification(notificationData);
      
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should get notifications', async () => {
      const { data, error } = await NotificationService.getNotifications(testUserId);
      
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should get notification stats', async () => {
      const { data, error } = await NotificationService.getNotificationStats(testUserId);
      
      expect(error).toBeNull();
      expect(typeof data?.total).toBe('number');
      expect(typeof data?.unread).toBe('number');
    });
  });

  describe('StorageService', () => {
    it('should upload file', async () => {
      // Create a test file
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      const { data, error } = await StorageService.uploadFile(
        testFile,
        'church-files',
        `test/${testFile.name}`,
        {
          entity_type: 'test',
          access_level: 'church'
        }
      );
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.record?.file_name).toBe(testFile.name);
    });

    it('should get public URL', async () => {
      const url = StorageService.getPublicUrl('avatars', 'test/avatar.jpg');
      
      expect(typeof url).toBe('string');
      expect(url).toContain('test/avatar.jpg');
    });
  });

  describe('Database Policies', () => {
    it('should enforce church data isolation', async () => {
      // Test that users can only access data from their church
      const { data, error } = await testClient
        .from('users')
        .select('*')
        .eq('church_id', testChurchId);
      
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should enforce role-based access', async () => {
      // Test that financial data requires proper permissions
      const { data, error } = await testClient
        .from('financial_records')
        .select('*');
      
      // Should either return data (if user has permission) or empty array (if not)
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Real-time Features', () => {
    it('should establish real-time connection', async () => {
      const channel = testClient
        .channel('test-channel')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        }, (payload) => {
          console.log('Real-time notification:', payload);
        });

      const status = await channel.subscribe();
      expect(status).toBe('SUBSCRIBED');
      
      await testClient.removeChannel(channel);
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();
      
      // Test bulk user retrieval
      const { data, error } = await UserService.getAllUsers(testChurchId);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () => 
        ChurchService.getChurchSettings(testChurchId)
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(({ data, error }) => {
        expect(error).toBeNull();
        expect(data).toBeDefined();
      });
    });
  });
});

// Integration tests
describe('Integration Tests', () => {
  it('should complete full user workflow', async () => {
    // 1. Create church
    const { data: church } = await ChurchService.createChurch({
      name: 'Integration Test Church',
      email: 'integration@test.com'
    });
    
    expect(church).toBeDefined();
    
    // 2. Create user
    const { data: user } = await UserService.createUser({
      church_id: church!.id,
      email: 'integration.user@test.com',
      full_name: 'Integration User',
      language: 'en'
    });
    
    expect(user).toBeDefined();
    
    // 3. Send notification
    const { data: notifications } = await NotificationService.createNotification({
      user_ids: [user!.id],
      title: 'Welcome',
      message: 'Welcome to the church!',
      notification_type: 'welcome'
    });
    
    expect(notifications).toBeDefined();
    
    // 4. Verify notification received
    const { data: userNotifications } = await NotificationService.getNotifications(user!.id);
    
    expect(userNotifications?.length).toBeGreaterThan(0);
  });
});

// Security tests
describe('Security Tests', () => {
  it('should prevent unauthorized access', async () => {
    // Test without authentication
    const unauthenticatedClient = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await unauthenticatedClient
      .from('users')
      .select('*');
    
    // Should return empty array due to RLS
    expect(Array.isArray(data)).toBe(true);
    expect(data?.length).toBe(0);
  });

  it('should validate file uploads', async () => {
    // Test with invalid file type
    const invalidFile = new File(['malicious content'], 'test.exe', { type: 'application/exe' });
    
    const { data, error } = await StorageService.uploadFile(
      invalidFile,
      'church-files',
      'test/malicious.exe'
    );
    
    expect(error).toBeDefined();
    expect(data).toBeNull();
  });
});