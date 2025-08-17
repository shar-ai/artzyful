import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, orientation } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    if (!orientation || !['portrait', 'landscape'].includes(orientation)) {
      return NextResponse.json(
        { error: 'Orientation must be "portrait" or "landscape"' },
        { status: 400 }
      );
    }

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to download image' },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Define dimensions based on orientation - optimized for printing
    const dimensions = orientation === 'portrait' 
      ? { width: 2400, height: 3600 }  // 2:3 aspect ratio (like 4x6, 8x12, etc.)
      : { width: 3600, height: 2400 }; // 3:2 aspect ratio (like 6x4, 12x8, etc.)

    // Process the image with sharp - optimized for printing
    const processedImage = await sharp(imageBuffer)
      .resize(dimensions.width, dimensions.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ 
        quality: 95,  // Higher quality for printing
        progressive: true  // Better compression for photos
      })
      .toBuffer();

    // Convert to base64 for response
    const base64Image = `data:image/jpeg;base64,${processedImage.toString('base64')}`;

    return NextResponse.json({
      success: true,
      processedImageUrl: base64Image,
      dimensions: dimensions,
      orientation: orientation
    });

  } catch (error) {
    console.error('Print preparation error:', error);
    return NextResponse.json(
      { error: 'Failed to process image for printing' },
      { status: 500 }
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