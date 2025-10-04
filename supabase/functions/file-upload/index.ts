import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get user's church_id
    const { data: userData } = await supabaseClient
      .from('users')
      .select('church_id')
      .eq('id', user.id)
      .single()

    if (!userData?.church_id) {
      throw new Error('User not associated with a church')
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entity_type') as string
    const entityId = formData.get('entity_id') as string
    const accessLevel = formData.get('access_level') as string || 'church'

    if (!file) {
      throw new Error('No file provided')
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('File size exceeds 50MB limit')
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed')
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`
    const filePath = `${userData.church_id}/${entityType || 'general'}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('church-files')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    // Record file metadata in database
    const { data: fileRecord, error: dbError } = await supabaseClient
      .from('file_uploads')
      .insert({
        church_id: userData.church_id,
        uploaded_by: user.id,
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        file_type: fileExt || 'unknown',
        mime_type: file.type,
        entity_type: entityType,
        entity_id: entityId,
        access_level: accessLevel
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabaseClient.storage
        .from('church-files')
        .remove([uploadData.path])
      
      throw dbError
    }

    // Get public URL for the file
    const { data: { publicUrl } } = supabaseClient.storage
      .from('church-files')
      .getPublicUrl(uploadData.path)

    return new Response(
      JSON.stringify({ 
        success: true,
        file_id: fileRecord.id,
        file_path: uploadData.path,
        public_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('File upload error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})