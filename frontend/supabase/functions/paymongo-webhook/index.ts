import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const signature = req.headers.get("paymongo-signature");
  const payload = await req.text();
  const event = JSON.parse(payload);

  // Check if payment was successful
  if (event.data.attributes.type === "payment.paid") {
    const referenceNumber = event.data.attributes.data.attributes.references[0];
    
    // Logic to update your Supabase database automatically
    // You would use the Supabase Admin Client here to change "UNPAID" to "PAID"
    console.log("Payment successful for:", referenceNumber);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});