import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image1Base64, image2Base64 } = await req.json();
    
    if (!image1Base64 || !image2Base64) {
      return new Response(
        JSON.stringify({ error: 'Both images are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling Lovable AI for scene verification...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing before/after photos to determine scene matching and proper ordering. Your task: Compare two images and determine: 1) Whether they depict the SAME physical location (same room/space/area). 2) Which image is the "BEFORE" state (typically dirtier, messier, or in need of work). 3) Which image is the "AFTER" state (typically cleaner, tidier, or shows completed work). Look for: Room layout, fixture types, spatial characteristics, wall features, permanent fixtures (for scene matching). Cleanliness, clutter, dust, stains, organization level (for before/after ordering). Work completion signs: paint, repairs, cleaning, organization. Respond with valid JSON only: {"match": true/false, "confidence": 0-100, "reasoning": "brief explanation of key features", "image1IsBefore": true/false}. match: TRUE if same physical location. image1IsBefore: TRUE if image1 is the before state, FALSE if image1 is the after state. Only provide image1IsBefore if match is true.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Image 1:'
              },
              {
                type: 'image_url',
                image_url: { url: image1Base64 }
              },
              {
                type: 'text',
                text: 'Image 2:'
              },
              {
                type: 'image_url',
                image_url: { url: image2Base64 }
              },
              {
                type: 'text',
                text: 'Are these the same location? If yes, which image is BEFORE and which is AFTER?'
              }
            ]
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);
    
    console.log('AI verification result:', aiResponse);

    return new Response(
      JSON.stringify(aiResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-scene-match:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
