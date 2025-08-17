import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

fal.config({
  credentials: process.env.FAL_KEY,
});

// Utility function to compress image
async function compressImage(imageBuffer: Buffer, maxWidth: number = 1024, quality: number = 80): Promise<Buffer> {
  try {
    const compressed = await sharp(imageBuffer)
      .resize(maxWidth, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality })
      .toBuffer();
    
    console.log(`📦 Image compressed: ${imageBuffer.length} → ${compressed.length} bytes (${Math.round((1 - compressed.length / imageBuffer.length) * 100)}% reduction)`);
    return compressed;
  } catch (error) {
    console.error('❌ Image compression failed:', error);
    return imageBuffer; // Return original if compression fails
  }
}

// Utility function to convert buffer to data URL
function bufferToDataUrl(buffer: Buffer, mimeType: string = 'image/jpeg'): string {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

export async function POST(request: NextRequest) {
  // Handle both file uploads and image URLs
  let imageUrl: string;
  let style: string;
      let selectedModel: string = 'fal-ai/flux-pro/kontext'; // Default model
  
  try {
    // Check if it's a multipart form data (file upload)
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const imageFile = formData.get('image') as File;
      style = formData.get('style') as string;
      const modelParam = formData.get('model') as string;
      if (modelParam) selectedModel = modelParam;
      
      if (!imageFile) {
        return NextResponse.json(
          { status: 'error', message: 'Image file is required' },
          { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
      
      if (!style) {
        return NextResponse.json(
          { status: 'error', message: 'Style is required' },
          { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
      
      // Convert file to buffer
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      
      // Compress the image
      const compressedBuffer = await compressImage(buffer);
      
      // Convert to data URL for direct use
      imageUrl = bufferToDataUrl(compressedBuffer, imageFile.type);
      
    } else {
      // Handle JSON body (imageUrl + style)
      const body = await request.json();
      const { imageUrl: url, style: styleParam, model: modelParam } = body;
      if (modelParam) selectedModel = modelParam;
      
      if (!url) {
        return NextResponse.json(
          { status: 'error', message: 'imageUrl is required' },
          { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
      
      if (!styleParam) {
        return NextResponse.json(
          { status: 'error', message: 'style is required' },
          { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
      
      // If it's a data URL, compress it
      if (url.startsWith('data:')) {
        const base64Data = url.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const compressedBuffer = await compressImage(buffer);
        imageUrl = bufferToDataUrl(compressedBuffer);
      } else {
        imageUrl = url;
      }
      
      style = styleParam;
    }
    
    // Load dynamic prompts from admin
    let prompts = {
      'get-naked': "Transform this into a vintage oil painting of the pet wrapped in a fluffy white towel with a towel turban on its head, as if it's fresh out of a spa. Add a marble bathroom background with golden candlelight, subtle steam, and a foggy mirror. Soft vintage lighting with a cozy, luxurious feel. Keep the pet's face and pose intact.",
      'fluff-and-fabulous': "Transform this into a vintage oil painting of the pet lounging in a clawfoot bathtub, adorned with pearl necklaces, oversized sunglasses, and a martini glass on the edge of the tub. The scene should have warm vintage lighting, white marble tiles, and soft pink towels nearby. Keep the pet's original face and posture. Subtle glam, no photorealism.",
      'purr-my-bubbles': "Transform this into a vintage oil painting of the pet in a bubble bath with paws up, surrounded by floating bubbles and a rubber duck. Use a light pastel background with golden fixtures and soft candlelight. Add a vintage glow and visible bath foam. Keep the pet's real face and expression untouched."
    };

    // Load models configuration
      let models: Record<string, {
    name: string;
    provider: string;
    cost: number;
    costUnit: string;
    description: string;
    status: string;
    features: string[];
  }> = {
    'fal-ai/flux-pro/kontext': {
      name: 'FLUX.1 Kontext [pro]',
      provider: 'Fal.ai',
      cost: 0.05,
      costUnit: 'per image',
      description: 'Frontier image editing model with context understanding',
      status: 'active',
      features: ['Context understanding', 'Targeted edits', 'Complex transformations']
    }
  };

    // Try to load dynamic prompts and models
    try {
      const promptsData = await fs.readFile(path.join(process.cwd(), 'data', 'prompts.json'), 'utf-8');
      const promptsConfig = JSON.parse(promptsData);
      prompts = { ...prompts, ...promptsConfig.prompts };
    } catch (error) {
      console.log('Using default prompts');
    }

    try {
      const modelsData = await fs.readFile(path.join(process.cwd(), 'data', 'models.json'), 'utf-8');
      const modelsConfig = JSON.parse(modelsData);
      models = { ...models, ...modelsConfig };
    } catch (error) {
      console.log('Using default models');
    }

    // Get the prompt for the selected style
    const prompt = prompts[style as keyof typeof prompts];
    if (!prompt) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: `Unknown style: ${style}` 
        },
        { 
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // Get model configuration
    const modelConfig = models[selectedModel];
    if (!modelConfig) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: `Unknown model: ${selectedModel}` 
        },
        { 
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    console.log('🎭 Style:', style);
    console.log('📝 Prompt:', prompt);
    console.log('🤖 Model:', selectedModel);
    console.log('💰 Cost:', `$${modelConfig.cost} ${modelConfig.costUnit}`);
    console.log('📏 Image size:', imageUrl.length, 'characters');

    // Validate image size (Fal.ai has limits)
    if (imageUrl.length > 10000000) { // 10MB limit
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Image too large. Please use a smaller image (under 10MB)' 
        },
        { 
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }
    
    // Check if we should use mock mode (when Fal.ai models are not available)
    const useMockMode = process.env.USE_MOCK_MODE === 'true' || !process.env.FAL_KEY || process.env.FAL_KEY === 'your_fal_ai_key_here';
    
    if (useMockMode) {
      // Mock mode - generate a fake image URL for testing
      console.log('🎭 Using mock mode for testing');
      
      // Create a more realistic mock image based on the style
      let mockImageContent;
      
      if (style === 'get-naked') {
        mockImageContent = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#f8f9fa"/><circle cx="150" cy="120" r="40" fill="#8B4513"/><ellipse cx="150" cy="200" rx="60" ry="40" fill="#8B4513"/><circle cx="140" cy="110" r="5" fill="black"/><circle cx="160" cy="110" r="5" fill="black"/><ellipse cx="150" cy="125" rx="8" ry="4" fill="pink"/><rect x="100" y="80" width="100" height="20" fill="white" stroke="#ddd" stroke-width="2"/><text x="150" y="280" font-family="Arial" font-size="16" fill="#333" text-anchor="middle">Vintage Spa Style</text></svg>`;
      } else if (style === 'fluff-and-fabulous') {
        mockImageContent = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#fff5f5"/><circle cx="150" cy="120" r="40" fill="#8B4513"/><ellipse cx="150" cy="200" rx="60" ry="40" fill="#8B4513"/><circle cx="140" cy="110" r="5" fill="black"/><circle cx="160" cy="110" r="5" fill="black"/><ellipse cx="150" cy="125" rx="8" ry="4" fill="pink"/><ellipse cx="150" cy="250" rx="80" ry="30" fill="white" stroke="#fed7d7" stroke-width="3"/><text x="150" y="280" font-family="Arial" font-size="16" fill="#333" text-anchor="middle">Glamorous Spa Style</text></svg>`;
      } else if (style === 'purr-my-bubbles') {
        mockImageContent = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#f0fff4"/><circle cx="150" cy="120" r="40" fill="#8B4513"/><ellipse cx="150" cy="200" rx="60" ry="40" fill="#8B4513"/><circle cx="140" cy="110" r="5" fill="black"/><circle cx="160" cy="110" r="5" fill="black"/><ellipse cx="150" cy="125" rx="8" ry="4" fill="pink"/><ellipse cx="150" cy="250" rx="80" ry="30" fill="white" stroke="#c6f6d5" stroke-width="3"/><circle cx="100" cy="180" r="8" fill="white" opacity="0.7"/><circle cx="200" cy="160" r="6" fill="white" opacity="0.6"/><circle cx="120" cy="140" r="10" fill="white" opacity="0.8"/><text x="150" y="280" font-family="Arial" font-size="16" fill="#333" text-anchor="middle">Bubble Bath Style</text></svg>`;
      } else {
        // Default mock for unknown styles
        mockImageContent = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#ff6b6b"/><text x="150" y="150" font-family="Arial" font-size="24" fill="white" text-anchor="middle">${style.toUpperCase()}</text><text x="150" y="180" font-family="Arial" font-size="16" fill="white" text-anchor="middle">MOCK IMAGE</text></svg>`;
      }
      
      // Convert SVG to data URL - use encodeURIComponent for better compatibility
      const encodedSvg = encodeURIComponent(mockImageContent);
      const mockImageUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
      
      console.log('🎨 Generated mock image URL:', mockImageUrl.substring(0, 100) + '...');
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return NextResponse.json(
        {
          status: 'success',
          imageUrl: mockImageUrl,
          method: 'mock',
          modelUsed: selectedModel,
          modelName: modelConfig.name,
          modelCost: modelConfig.cost,
          modelProvider: modelConfig.provider,
          requestId: 'mock-' + Date.now(),
          style: style,
          settings: {
            guidance_scale: 0.5,
            image_url: imageUrl.substring(0, 50) + '...'
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
    }
    
    // Validate API key (only if not in mock mode)
    if (!process.env.FAL_KEY || process.env.FAL_KEY === 'your_fal_ai_key_here') {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'FAL_KEY not configured. Please add your Fal.ai API key to .env.local',
          error: 'Missing or invalid FAL_KEY environment variable'
        },
        { 
          status: 500,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }
    
    // Call AI API with selected model
    let result;
    
    if (selectedModel === 'fal-ai/flux/krea') {
      // Handle Flux Krea model (text-to-image)
      console.log('🤖 Calling Fal.ai API with model:', selectedModel);
      console.log('📝 Using prompt:', prompt);
      
      try {
        result = await fal.run(selectedModel, {
          input: {
            prompt: prompt,
            num_inference_steps: 20,
            guidance_scale: 7.5
          }
        });
        
        console.log('✅ Fal.ai API call successful');
        console.log('🖼️ Result data:', JSON.stringify(result, null, 2));
        console.log('🖼️ Generated image URL:', result.data?.image?.url);
        
      } catch (falError) {
        console.error('❌ Fal.ai API call failed:', falError);
        throw falError;
      }
    } else if (selectedModel.startsWith('fal-ai/')) {
      // Handle Fal.ai models
      console.log('🤖 Calling Fal.ai API with model:', selectedModel);
      console.log('📝 Using prompt:', prompt);
      
      try {
        // For Bytedance SeedEdit, we need both prompt and image
        console.log('🖼️ Input image size:', imageUrl.length, 'characters');
        
        // Convert data URL to buffer for upload
        let imageBuffer: Buffer;
        if (imageUrl.startsWith('data:')) {
          const base64Data = imageUrl.split(',')[1];
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
          // If it's a URL, we'll use it directly
          result = await fal.subscribe(selectedModel, {
            input: {
              prompt: prompt,
              image_url: imageUrl
            },
            logs: true,
            onQueueUpdate: (update) => {
              if (update.status === "IN_PROGRESS") {
                update.logs.map((log) => log.message).forEach(console.log);
              }
            },
          });
          
          console.log('✅ Fal.ai API call successful');
          console.log('🖼️ Result data:', JSON.stringify(result, null, 2));
          
          // Handle different response formats for different models
          let directImageUrl: string;
          if (selectedModel === 'fal-ai/flux-pro/kontext') {
            // Flux Pro Kontext returns images array
            directImageUrl = result.data?.images?.[0]?.url;
            console.log('🖼️ Generated image URL (Flux Pro):', directImageUrl);
          } else {
            // Bytedance and other models return single image object
            directImageUrl = result.data?.image?.url;
            console.log('🖼️ Generated image URL (Other):', directImageUrl);
          }
          
          return NextResponse.json(
            {
              status: 'success',
              imageUrl: directImageUrl,
              method: selectedModel,
              modelUsed: selectedModel,
              modelName: modelConfig.name,
              modelCost: modelConfig.cost,
              modelProvider: modelConfig.provider,
              requestId: result.requestId,
              style: style,
              settings: {
                guidance_scale: selectedModel === 'fal-ai/flux-pro/kontext' ? 3.5 : 0.5,
                image_url: imageUrl.substring(0, 50) + '...'
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
        }
        
        // Upload image to Fal.ai storage first
        console.log('📤 Uploading image to Fal.ai storage...');
        const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
        const uploadedUrl = await fal.storage.upload(blob);
        console.log('✅ Image uploaded:', uploadedUrl);
        
        // Now call the Flux Pro Kontext model with the uploaded image URL
        result = await fal.subscribe(selectedModel, {
          input: {
            prompt: prompt,
            image_url: uploadedUrl,
            guidance_scale: 3.5 // Default guidance scale for Flux Pro
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              update.logs.map((log) => log.message).forEach(console.log);
            }
          },
        });
        
        console.log('✅ Fal.ai API call successful');
        console.log('🖼️ Result data:', JSON.stringify(result, null, 2));
        
        // Handle different response formats for different models
        let generatedImageUrl: string;
        if (selectedModel === 'fal-ai/flux-pro/kontext') {
          // Flux Pro Kontext returns images array
          generatedImageUrl = result.data?.images?.[0]?.url;
          console.log('🖼️ Generated image URL (Flux Pro):', generatedImageUrl);
        } else {
          // Bytedance and other models return single image object
          generatedImageUrl = result.data?.image?.url;
          console.log('🖼️ Generated image URL (Other):', generatedImageUrl);
        }
        
      } catch (falError) {
        console.error('❌ Fal.ai API call failed:', falError);
        throw falError;
      }
    } else if (selectedModel.startsWith('replicate/')) {
      // Handle Replicate models (you'll need to implement this)
      throw new Error('Replicate models not yet implemented');
    } else {
      throw new Error('Unknown model provider');
    }

    console.log(`✅ ${modelConfig.name} generation completed successfully`);
    
    // Handle different response formats for different models
    let finalImageUrl: string;
    if (selectedModel === 'fal-ai/flux-pro/kontext') {
      // Flux Pro Kontext returns images array
      finalImageUrl = result.data?.images?.[0]?.url;
    } else {
      // Bytedance and other models return single image object
      finalImageUrl = result.data?.image?.url;
    }
    
    console.log('🖼️ Final result URL:', finalImageUrl);
    console.log('🖼️ Result object keys:', Object.keys(result));
    console.log('🖼️ Result data keys:', Object.keys(result.data || {}));

    // Return the result
    return NextResponse.json(
      {
        status: 'success',
        imageUrl: finalImageUrl,
        method: selectedModel,
        modelUsed: selectedModel,
        modelName: modelConfig.name,
        modelCost: modelConfig.cost,
        modelProvider: modelConfig.provider,
        requestId: result.requestId,
        style: style,
        settings: {
          guidance_scale: selectedModel === 'fal-ai/flux-pro/kontext' ? 3.5 : 0.5,
          image_url: imageUrl.substring(0, 50) + '...'
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
    console.error('❌ Fal.ai generation failed:', error);
    let errorMessage = 'Image generation failed';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    // Log more details for debugging
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'No message',
      stack: error instanceof Error ? error.stack : 'No stack',
      name: error instanceof Error ? error.name : 'No name'
    });
    
    if (errorDetails.includes('Not Found')) {
      errorMessage = 'Model not found. Please check the model ID in your Fal.ai dashboard';
    } else if (errorDetails.includes('Invalid app id')) {
      errorMessage = 'Invalid model ID. Please use the correct format: <appOwner>/<appId>';
    } else if (errorDetails.includes('Unauthorized')) {
      errorMessage = 'Invalid API key. Please check your FAL_KEY in .env.local';
    } else if (errorDetails.includes('ValidationError') || errorDetails.includes('Unprocessable Entity')) {
      errorMessage = 'Invalid input. The image might be too large or in an unsupported format. Try a smaller image.';
    }
    
    return NextResponse.json(
      {
        status: 'error',
        message: errorMessage,
        error: errorDetails,
        modelUsed: selectedModel,
        help: 'To use this API: 1. Get a Fal.ai API key from https://fal.ai 2. Add FAL_KEY=your_key to .env.local'
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
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