import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReportRequest {
  report_type: 'attendance' | 'financial' | 'ministry' | 'event' | 'custom'
  title: string
  period_start?: string
  period_end?: string
  parameters?: Record<string, any>
  format?: 'pdf' | 'excel' | 'csv'
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

    const reportData: ReportRequest = await req.json()

    // Get user's church_id
    const { data: userData } = await supabaseClient
      .from('users')
      .select('church_id')
      .eq('id', user.id)
      .single()

    if (!userData?.church_id) {
      throw new Error('User not associated with a church')
    }

    // Create report record
    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .insert({
        church_id: userData.church_id,
        title: reportData.title,
        report_type: reportData.report_type,
        parameters: reportData.parameters || {},
        generated_by: user.id,
        period_start: reportData.period_start,
        period_end: reportData.period_end,
        status: 'generating'
      })
      .select()
      .single()

    if (reportError) {
      throw reportError
    }

    // Generate report data based on type
    let reportContent: any = {}

    switch (reportData.report_type) {
      case 'attendance':
        const { data: attendanceData } = await supabaseClient
          .from('attendance')
          .select(`
            *,
            user:users(full_name, email),
            event:events(title)
          `)
          .eq('church_id', userData.church_id)
          .gte('attendance_date', reportData.period_start || '2024-01-01')
          .lte('attendance_date', reportData.period_end || new Date().toISOString().split('T')[0])
          .order('attendance_date', { ascending: false })

        reportContent = {
          type: 'attendance',
          data: attendanceData,
          summary: {
            total_records: attendanceData?.length || 0,
            present_count: attendanceData?.filter(a => a.was_present).length || 0,
            absent_count: attendanceData?.filter(a => !a.was_present).length || 0,
            unique_attendees: new Set(attendanceData?.map(a => a.user_id)).size
          }
        }
        break

      case 'financial':
        const { data: financialData } = await supabaseClient
          .from('financial_records')
          .select(`
            *,
            recorded_by_user:users!financial_records_recorded_by_fkey(full_name)
          `)
          .eq('church_id', userData.church_id)
          .gte('transaction_date', reportData.period_start || '2024-01-01')
          .lte('transaction_date', reportData.period_end || new Date().toISOString().split('T')[0])
          .order('transaction_date', { ascending: false })

        const income = financialData?.filter(r => ['offering', 'tithe', 'donation'].includes(r.transaction_type))
          .reduce((sum, r) => sum + Number(r.amount), 0) || 0
        const expenses = financialData?.filter(r => r.transaction_type === 'expense')
          .reduce((sum, r) => sum + Math.abs(Number(r.amount)), 0) || 0

        reportContent = {
          type: 'financial',
          data: financialData,
          summary: {
            total_transactions: financialData?.length || 0,
            total_income: income,
            total_expenses: expenses,
            net_amount: income - expenses
          }
        }
        break

      case 'ministry':
        const { data: departmentData } = await supabaseClient
          .from('departments')
          .select(`
            *,
            leader:users(full_name),
            user_departments(
              user:users(full_name, email)
            )
          `)
          .eq('church_id', userData.church_id)
          .eq('is_active', true)

        reportContent = {
          type: 'ministry',
          data: departmentData,
          summary: {
            total_departments: departmentData?.length || 0,
            total_members: departmentData?.reduce((sum, dept) => sum + (dept.user_departments?.length || 0), 0) || 0,
            departments_with_leaders: departmentData?.filter(d => d.leader_id).length || 0
          }
        }
        break

      case 'event':
        const { data: eventData } = await supabaseClient
          .from('events')
          .select(`
            *,
            creator:users(full_name),
            event_registrations(
              user:users(full_name),
              registration_status
            )
          `)
          .eq('church_id', userData.church_id)
          .gte('event_date', reportData.period_start || '2024-01-01')
          .lte('event_date', reportData.period_end || new Date().toISOString().split('T')[0])
          .order('event_date', { ascending: false })

        reportContent = {
          type: 'event',
          data: eventData,
          summary: {
            total_events: eventData?.length || 0,
            total_registrations: eventData?.reduce((sum, event) => sum + (event.event_registrations?.length || 0), 0) || 0,
            completed_events: eventData?.filter(e => e.status === 'completed').length || 0
          }
        }
        break

      default:
        throw new Error('Unsupported report type')
    }

    // Generate file URL (in production, you would generate actual files)
    const fileUrl = `reports/${report.id}.json`

    // Update report status
    await supabaseClient
      .from('reports')
      .update({
        status: 'completed',
        file_url: fileUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', report.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        report_id: report.id,
        file_url: fileUrl,
        content: reportContent
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Generate report error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})