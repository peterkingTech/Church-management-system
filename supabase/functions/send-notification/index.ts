import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  user_ids: string[]
  title: string
  message: string
  notification_type: string
  related_entity_type?: string
  related_entity_id?: string
  action_url?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  send_push?: boolean
  send_email?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const notificationData: NotificationRequest = await req.json()

    // Get user's church_id
    const { data: userData } = await supabaseClient
      .from('users')
      .select('church_id')
      .eq('id', user.id)
      .single()

    if (!userData?.church_id) {
      throw new Error('User not associated with a church')
    }

    // Create notifications for each user
    const notifications = notificationData.user_ids.map(userId => ({
      church_id: userData.church_id,
      user_id: userId,
      title: notificationData.title,
      message: notificationData.message,
      notification_type: notificationData.notification_type,
      related_entity_type: notificationData.related_entity_type,
      related_entity_id: notificationData.related_entity_id,
      action_url: notificationData.action_url,
      priority: notificationData.priority || 'normal',
      is_push_sent: notificationData.send_push || false,
      is_email_sent: notificationData.send_email || false
    }))

    const { data, error } = await supabaseClient
      .from('notifications')
      .insert(notifications)
      .select()

    if (error) {
      throw error
    }

    // TODO: Implement actual push notification and email sending
    if (notificationData.send_push) {
      console.log('Would send push notifications to:', notificationData.user_ids)
    }

    if (notificationData.send_email) {
      console.log('Would send email notifications to:', notificationData.user_ids)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_created: data.length,
        notification_ids: data.map(n => n.id)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Send notification error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})