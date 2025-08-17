import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import sharp from 'sharp';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }

    const { imageUrl, style, productType } = await request.json();

    console.log('Checkout request received:', {
      style,
      productType,
      imageUrlLength: imageUrl ? imageUrl.length : 0
    });

    // For very large images, we might need to compress them further for Stripe metadata
    let finalImageUrl = imageUrl;
    if (imageUrl.length > 500) {
      // If it's a data URL, try to compress it more
      if (imageUrl.startsWith('data:')) {
        try {
          const base64Data = imageUrl.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Compress to very small size for metadata
          const compressed = await sharp(buffer)
            .resize(400, null, { withoutEnlargement: true, fit: 'inside' })
            .jpeg({ quality: 60 })
            .toBuffer();
          
          const compressedDataUrl = `data:image/jpeg;base64,${compressed.toString('base64')}`;
          finalImageUrl = compressedDataUrl.length > 500 ? compressedDataUrl.substring(0, 490) + '...' : compressedDataUrl;
          
          console.log('📦 Compressed for metadata:', {
            originalLength: imageUrl.length,
            compressedLength: compressedDataUrl.length,
            finalLength: finalImageUrl.length
          });
        } catch (error) {
          console.error('❌ Metadata compression failed:', error);
          finalImageUrl = imageUrl.substring(0, 490) + '...';
        }
      } else {
        finalImageUrl = imageUrl.substring(0, 490) + '...';
      }
    }
    
    console.log('Metadata length check:', {
      originalLength: imageUrl.length,
      truncatedLength: finalImageUrl.length,
      truncatedPreview: finalImageUrl.substring(0, 50) + '...'
    });

    if (!imageUrl || !style || !productType) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, style, productType' },
        { status: 400 }
      );
    }

    if (!['single', 'bundle'].includes(productType)) {
      return NextResponse.json(
        { error: 'productType must be "single" or "bundle"' },
        { status: 400 }
      );
    }

    if (!['get-naked', 'fluff-and-fabulous', 'purr-my-bubbles'].includes(style)) {
      return NextResponse.json(
        { error: 'Invalid style' },
        { status: 400 }
      );
    }

    // Define product details
    const products = {
      single: {
        name: 'Bougie Pet Portrait',
        description: 'Transform your pet into a vintage masterpiece',
        price: 1200, // $12.00 in cents
        image: 'https://via.placeholder.com/300x300/667eea/ffffff?text=Portrait'
      },
      bundle: {
        name: 'Bougie Bundle (All 3 Styles)',
        description: 'Get all three vintage styles for your pet',
        price: 2400, // $24.00 in cents
        image: 'https://via.placeholder.com/300x300/764ba2/ffffff?text=Bundle'
      }
    };

    const product = products[productType as keyof typeof products];

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: product.description,
              images: [product.image],
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
                success_url: `https://artzyful.com/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `https://artzyful.com/pet-styles.html`,
      metadata: {
        imageUrl: finalImageUrl,
        style: style,
        productType: productType,
        timestamp: new Date().toISOString()
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    // More detailed error response
    let errorMessage = 'Failed to create checkout session';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
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