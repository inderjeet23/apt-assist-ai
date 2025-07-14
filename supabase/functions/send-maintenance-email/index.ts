import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MaintenanceEmailRequest {
  tenantName: string;
  unit: string;
  contactInfo: string;
  issueType: string;
  description: string;
  urgency: string;
  recipientEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      tenantName, 
      unit, 
      contactInfo, 
      issueType, 
      description, 
      urgency,
      recipientEmail 
    }: MaintenanceEmailRequest = await req.json();

    const timestamp = new Date().toLocaleString();

    const emailResponse = await resend.emails.send({
      from: "Property Assistant <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `New Maintenance Request from ${tenantName || 'Tenant'} (${unit || 'Unit not provided'})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #e1e5e9; padding-bottom: 10px;">
            🔔 New Maintenance Request Submitted
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; width: 120px;">Tenant:</td>
                <td style="padding: 8px 0; color: #333;">${tenantName || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Unit:</td>
                <td style="padding: 8px 0; color: #333;">${unit || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Contact:</td>
                <td style="padding: 8px 0; color: #333;">${contactInfo || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Issue Type:</td>
                <td style="padding: 8px 0; color: #333;">${issueType || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Urgency:</td>
                <td style="padding: 8px 0; color: #333;">
                  <span style="background-color: ${urgency?.includes('urgent') ? '#dc3545' : '#28a745'}; 
                               color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${urgency || 'Not provided'}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; vertical-align: top;">Description:</td>
                <td style="padding: 8px 0; color: #333;">${description || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Submitted at:</td>
                <td style="padding: 8px 0; color: #333;">${timestamp}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #e1e5e9; padding-top: 15px;">
            This maintenance request was submitted through the Property Assistant system.
          </p>
        </div>
      `,
    });

    console.log("Maintenance email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-maintenance-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);