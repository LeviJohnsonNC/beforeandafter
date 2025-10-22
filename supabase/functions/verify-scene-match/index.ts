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
            content: 'You are an expert at analyzing whether two photos show the exact same physical location/room. Focus on: room layout, wall positions, windows, doors, permanent fixtures. CRITICAL: Pay special attention to fixture TYPE - a sink is NOT the same as a bathtub, a toilet is NOT the same as a shower, even if both are white porcelain. Compare: drain placement, faucet configuration, fixture shape, tile patterns, wall corners, surrounding fixtures. Ignore: furniture placement, clutter, lighting, cleanliness, time of day.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Are these two photos of the EXACT same physical room/location AND same fixture type? Answer with a JSON object containing: {"match": true/false, "confidence": 0-100, "reasoning": "brief explanation focusing on: 1) fixture type match (sink vs tub, toilet vs shower), 2) spatial layout (tile patterns, corners, wall features), 3) fixture-specific features (drain position, faucet type, fixture shape)"}. Be VERY strict - a clean sink is NOT the same as a dirty bathtub. Only return true if you are highly confident they show the exact same fixture in the same space.'
              },
              {
                type: 'image_url',
                image_url: { url: image1Base64 }
              },
              {
                type: 'image_url',
                image_url: { url: image2Base64 }
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
