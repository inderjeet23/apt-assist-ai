import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TriageRequest {
  description: string;
  media_url?: string;
  tenant_urgency: string;
  permission_to_enter: boolean;
  tenant_id: string;
}

interface LLMResponse {
  specialty: string;
  priority: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, media_url, tenant_urgency, permission_to_enter, tenant_id }: TriageRequest = await req.json();

    console.log('Triaging request:', { description, tenant_urgency, permission_to_enter });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Single LLM call for specialty and priority extraction
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const llmPrompt = `You are a maintenance triage specialist. Based on the following maintenance request description, return a JSON object with exactly two fields:

1. "specialty": The category of work needed. Choose EXACTLY one from: "Plumbing", "Electrical", "HVAC", "General"
2. "priority": The verified priority level. Choose EXACTLY one from: "Low", "Medium", "High", "Urgent"

Consider both the description content and the tenant's self-assessed urgency: "${tenant_urgency}"

Description: "${description}"

Return ONLY valid JSON with no additional text or formatting.`;

    const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that returns only valid JSON responses.' },
          { role: 'user', content: llmPrompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!llmResponse.ok) {
      throw new Error(`OpenAI API error: ${llmResponse.statusText}`);
    }

    const llmData = await llmResponse.json();
    const llmContent = llmData.choices[0].message.content;
    
    let aiTriage: LLMResponse;
    try {
      aiTriage = JSON.parse(llmContent);
    } catch (parseError) {
      console.error('Failed to parse LLM response:', llmContent);
      // Fallback to deterministic logic
      aiTriage = {
        specialty: 'General',
        priority: tenant_urgency === 'high' ? 'High' : tenant_urgency === 'low' ? 'Low' : 'Medium'
      };
    }

    console.log('AI Triage result:', aiTriage);

    // Create maintenance request record
    const { data: maintenanceRequest, error: insertError } = await supabase
      .from('maintenance_requests')
      .insert({
        title: `${aiTriage.specialty} Issue`,
        description,
        request_type: aiTriage.specialty,
        priority: aiTriage.priority,
        status: 'New',
        tenant_name: 'Demo Tenant', // In real app, get from tenant_id
        property_address: '123 Demo St', // In real app, get from tenant_id
        unit_number: 'A1', // In real app, get from tenant_id
        tenant_email: 'demo@example.com', // In real app, get from tenant_id
        tenant_phone: '555-0123', // In real app, get from tenant_id
        images: media_url ? [media_url] : null,
        property_manager_id: 'demo-pm-123', // In real app, get from tenant relationship
        notes: `Initial triage: ${aiTriage.specialty} work, ${aiTriage.priority} priority. Permission to enter: ${permission_to_enter ? 'Yes' : 'No'}.`
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating maintenance request:', insertError);
      throw insertError;
    }

    let requestStatus = 'New';

    // Auto-dispatch for High/Urgent priority
    if (aiTriage.priority === 'High' || aiTriage.priority === 'Urgent') {
      console.log('High/Urgent priority detected, attempting auto-dispatch...');
      
      // Query vendors table for matching specialty
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('specialty', aiTriage.specialty)
        .limit(1);

      if (!vendorError && vendors && vendors.length > 0) {
        const selectedVendor = vendors[0];
        console.log('Found vendor for dispatch:', selectedVendor.name);

        // Update request status to scheduled
        const { error: updateError } = await supabase
          .from('maintenance_requests')
          .update({ 
            status: 'Scheduled',
            assigned_to: selectedVendor.name,
            notes: `${maintenanceRequest.notes} Auto-dispatched to ${selectedVendor.name} (${selectedVendor.email}).`
          })
          .eq('id', maintenanceRequest.id);

        if (!updateError) {
          requestStatus = 'Scheduled';
          console.log('Request auto-dispatched successfully');
          
          // TODO: Send notification to vendor (Twilio/SendGrid integration)
          // This would be implemented based on your preferred service
        } else {
          console.error('Error updating request status:', updateError);
        }
      } else {
        console.log('No available vendor found for specialty:', aiTriage.specialty);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      request_id: maintenanceRequest.id,
      specialty: aiTriage.specialty,
      priority: aiTriage.priority,
      status: requestStatus
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in triage-request function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});