import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, style } = body;

    if (!imageUrl || !style) {
      return NextResponse.json(
        { status: 'error', message: 'imageUrl and style are required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Define prompts based on style
    const prompts = {
      'get-naked': 'Vintage oil painting of the animal wearing a robe and sunglasses in elegant bathroom.',
      'fluff-and-fabulous': 'Vintage oil painting of the animal wearing a robe and sunglasses in elegant bathroom.',
      'purr-my-bubbles': 'Vintage oil painting of the animal wearing a robe and sunglasses in elegant bathroom.'
    };

    const prompt = prompts[style as keyof typeof prompts] || prompts['get-naked'];

    console.log('🤖 Calling Fal.ai API with Flux Pro Kontext');
    console.log('📝 Using prompt:', prompt);

    // Call Fal.ai API
    const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
      input: {
        prompt: prompt,
        image_url: imageUrl,
        guidance_scale: 3.5
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log('✅ Fal.ai API call successful');
    
    // Get the image URL from the response
    const generatedImageUrl = result.data?.images?.[0]?.url;
    
    if (!generatedImageUrl) {
      throw new Error('No image URL returned from Fal.ai');
    }

    return NextResponse.json(
      {
        status: 'success',
        imageUrl: generatedImageUrl,
        method: 'fal-ai/flux-pro/kontext',
        modelUsed: 'fal-ai/flux-pro/kontext',
        style: style,
        settings: {
          guidance_scale: 3.5,
          prompt: prompt
        }
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );

  } catch (error) {
    console.error('❌ API call failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      },
      { 
        status: 500, 
        headers: { 'Access-Control-Allow-Origin': '*' } 
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 