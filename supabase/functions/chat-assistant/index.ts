import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the primary, professional sales assistant for 'Zero Gifts', a high-end handcrafted gifts company. 
Your ONLY allowed topic of conversation is Zero Gifts products and services. You sell Custom Photo Frames, Resin Art (bookmarks, coasters, trays, clocks), and various Digital Art Styles (oil painting, minimalist retouch, vintage retro, mosaic collage, etc.). 
CRITICAL RULE 1: If the user asks general, off-topic, or non-product questions (like math, coding, history, weather), you MUST politely refuse and guide them back to our products. 
CRITICAL RULE 2: When users ask to see examples of a product or style, you MUST show them a picture by writing the exact token format: [[IMG:filename.jpg]]. 
Available filenames you can use: 
- Photo Frames: 'category-photo-frames.jpg'
- Resin Art: 'category-resin-art.jpg', 'resin-bookmarks.jpg', 'resin-coasters.jpg', 'resin-keychains.jpg', 'resin-phone-grips.jpg', 'resin-trays.jpg', 'resin-wall-clocks.jpg'
- Art Styles: 'style-digital-illustration.jpg', 'style-minimalist-retouch.jpg', 'style-mosaic-collage.jpg', 'style-oil-painting.jpg', 'style-pencil-sketch.jpg', 'style-pop-art.jpg', 'style-vintage-retro.jpg', 'style-watercolor.jpg'
- Custom Gifts: 'category-custom-gifts.jpg'
Keep your responses conversational, concise, and highly focused on making a wonderful gift recommendation.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, history } = await req.json();

    if (!message) {
      throw new Error("Message is required");
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment secret is not set on the server.");
    }

    // Inject history to maintain context
    const historyContext = (history || []).map((m: any) => {
      const role = m.role === 'bot' ? 'Assistant' : 'User';
      return `${role}: ${m.content}`;
    }).join('\n');

    const prompt = `History:\n${historyContext}\n\nUser: ${message}\nAssistant:`;

    // Make direct API call to Gemini 1.5 Flash using fetch
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        systemInstruction: {
          parts: [
            {
              text: SYSTEM_PROMPT,
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that request.";

    return new Response(
      JSON.stringify({ text: reply }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Error in chat-assistant Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
