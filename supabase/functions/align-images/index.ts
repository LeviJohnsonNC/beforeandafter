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
    const { referenceImage, imageToAlign } = await req.json();
    
    if (!referenceImage || !imageToAlign) {
      return new Response(
        JSON.stringify({ error: 'Both referenceImage and imageToAlign are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Aligning images using Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert image alignment tool. I'm providing you with two images that show the same scene but may have different perspectives, rotations, or scales.

Your task: Warp and align the SECOND image to perfectly match the perspective, rotation, and scale of the FIRST (reference) image. This is for a before/after comparison slider, so accurate alignment is critical.

Requirements:
- Maintain the same perspective and angle as the reference image
- Match the scale and zoom level
- Correct any rotation differences
- Preserve image quality and details
- Ensure key features (buildings, objects, landmarks) line up between images

Return ONLY the aligned version of the second image. Do not modify the first image.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: referenceImage
                }
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageToAlign
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const alignedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!alignedImageUrl) {
      throw new Error('No aligned image returned from AI');
    }

    console.log('Image alignment successful');

    return new Response(
      JSON.stringify({ alignedImage: alignedImageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in align-images function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});