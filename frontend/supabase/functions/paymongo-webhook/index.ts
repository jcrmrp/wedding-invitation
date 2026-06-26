import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  req.headers.get("paymongo-signature");
  const payload = await req.text();
  const event = JSON.parse(payload);

  const developerEmail = Deno.env.get("DEVELOPER_EMAIL") || "";
  const backendUrl = Deno.env.get("BACKEND_URL") || "";

  // Check if payment was successful
  if (event.data.attributes.type === "payment.paid") {
    const referenceNumber = event.data.attributes.data.attributes.references[0];
    
    // Logic to update your Supabase database automatically
    // You would use the Supabase Admin Client here to change "UNPAID" to "PAID"
    console.log("Payment successful for:", referenceNumber);

    // Notify developer via backend
    if (backendUrl && developerEmail) {
      try {
        await fetch(`${backendUrl}/api/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "payment.paid",
            message: `New payment received - Ref: ${referenceNumber}`,
            reference: referenceNumber,
            developerEmail,
          }),
        });
      } catch (err) {
        console.error("Failed to notify developer:", err);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});