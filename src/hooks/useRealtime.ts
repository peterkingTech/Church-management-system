import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { 
  subscribeToNotifications,
  subscribeToAnnouncements,
  subscribeToTasks,
  subscribeToAttendance,
  unsubscribeFromChannel
 } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UseRealtimeOptions {
  enabled?: boolean;
  onNotification?: (payload: any) => void;
  onAnnouncement?: (payload: any) => void;
  onTask?: (payload: any) => void;
  onAttendance?: (payload: any) => void;
  onEvent?: (payload: any) => void;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { userProfile } = useAuth();
  const subscriptionsRef = useRef<RealtimeChannel[]>([]);
  const {
    enabled = true,
    onNotification,
    onAnnouncement,
    onTask,
    onAttendance,
    onEvent
  } = options;

  useEffect(() => {
    if (!enabled || !userProfile?.id) {
      return;
    }

    const subscriptions: RealtimeChannel[] = [];

    // Subscribe to notifications
    if (onNotification) {
      const notificationSub = subscribeToNotifications(
        userProfile.id,
        (payload) => {
          console.log('New notification:', payload);
          onNotification(payload);
        }
      );
      subscriptions.push(notificationSub);
    }

    // Subscribe to announcements
    if (onAnnouncement && userProfile.church?.id) {
      const announcementSub = subscribeToAnnouncements(
        userProfile.church.id,
        (payload) => {
          console.log('New announcement:', payload);
          onAnnouncement(payload);
        }
      );
      subscriptions.push(announcementSub);
    }

    // Subscribe to tasks
    if (onTask) {
      const taskSub = subscribeToTasks(
        userProfile.id,
        (payload) => {
          console.log('Task update:', payload);
          onTask(payload);
        }
      );
      subscriptions.push(taskSub);
    }

    // Subscribe to attendance updates
    if (onAttendance && userProfile.church?.id) {
      const attendanceSub = subscribeToAttendance(
        userProfile.church.id,
        (payload) => {
          console.log('Attendance update:', payload);
          onAttendance(payload);
        }
      );
      subscriptions.push(attendanceSub);
    }
    subscriptionsRef.current = subscriptions;

    // Cleanup function
    return () => {
      subscriptions.forEach(sub => {
        unsubscribeFromChannel(sub);
      });
      subscriptionsRef.current = [];
    };
  }, [enabled, userProfile?.id, userProfile?.church?.id, onNotification, onAnnouncement, onTask, onAttendance]);

  // Manual cleanup function
  const cleanup = () => {
    subscriptionsRef.current.forEach(sub => {
      unsubscribeFromChannel(sub);
    });
    subscriptionsRef.current = [];
  };

  return {
    cleanup,
    isConnected: subscriptionsRef.current.length > 0
  };
}

// Specific hooks for different real-time features
export function useNotificationRealtime(onNotification: (payload: any) => void) {
  return useRealtime({ onNotification });
}

export function useAnnouncementRealtime(onAnnouncement: (payload: any) => void) {
  return useRealtime({ onAnnouncement });
}

export function useTaskRealtime(onTask: (payload: any) => void) {
  return useRealtime({ onTask });
}