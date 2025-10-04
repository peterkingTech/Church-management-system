import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  type: string
  table: string
  record: any
  schema: string
  old_record?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: WebhookPayload = await req.json()
    
    // Handle user creation from auth.users
    if (payload.table === 'users' && payload.type === 'INSERT') {
      const authUser = payload.record
      
      // Extract church_id from user metadata
      const churchId = authUser.user_metadata?.church_id;
      
      if (!churchId) {
        console.error('No church_id found in user metadata');
        throw new Error('Church ID is required for user creation');
      }
      
      // Create user profile in public.users table
      const { error: profileError } = await supabaseClient
        .from('users')
        .insert({
          id: authUser.id,
          church_id: churchId,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          role: authUser.user_metadata?.role || 'newcomer',
          language: authUser.user_metadata?.language || 'en',
          phone: authUser.user_metadata?.phone,
          is_confirmed: authUser.email_confirmed_at ? true : false,
          created_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        throw profileError
      }

      // Send welcome notification
      await supabaseClient
        .from('notifications')
        .insert({
          church_id: churchId,
          user_id: authUser.id,
          title: 'Welcome to the Church!',
          message: 'Welcome to our church management system. We\'re excited to have you join our community!',
          type: 'announcement'
        })
    }

    // Handle user updates
    if (payload.table === 'users' && payload.type === 'UPDATE') {
      const authUser = payload.record
      
      // Update last_login_at when user signs in
      if (authUser.last_sign_in_at !== payload.old_record?.last_sign_in_at) {
        await supabaseClient
          .from('users')
          .update({ 
            created_at: new Date().toISOString()
          })
          .eq('id', authUser.id)
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})