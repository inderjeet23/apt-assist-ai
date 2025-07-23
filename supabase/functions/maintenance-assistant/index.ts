import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, conversationHistory = [] } = await req.json();

    console.log('Received maintenance request:', { description, conversationHistory });

    const messages = [
      {
        role: 'system',
        content: `You are a maintenance assistant for a property management company. Your job is to ask ONE specific, relevant follow-up question to better understand the maintenance issue. 

Guidelines:
- Ask only ONE clarifying question
- Be specific and helpful
- Focus on understanding urgency, location, or technical details
- Keep responses under 50 words
- Be empathetic and professional

Examples:
- For "broken faucet": "Is the faucet completely not working, or is it dripping/leaking? This helps us determine if it's an emergency repair."
- For "heating issue": "Is there no heat at all, or is it not heating to the right temperature? Also, which rooms are affected?"
- For "electrical problem": "Are any outlets not working, or are lights flickering? Is this affecting multiple rooms or just one area?"`
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: `Initial maintenance issue description: ${description}. Please ask ONE specific follow-up question to better understand this issue.`
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const followUpQuestion = data.choices[0].message.content;

    console.log('Generated follow-up question:', followUpQuestion);

    return new Response(JSON.stringify({ 
      followUpQuestion,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in maintenance-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});