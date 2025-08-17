import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, style, productType } = body;

    if (!imageUrl || !style || !productType) {
      return NextResponse.json(
        { status: 'error', message: 'imageUrl, style, and productType are required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Define product details
    const products = {
      'single': {
        name: 'Bougie Pet Portrait',
        price: 1200, // $12.00 in cents
        description: 'One AI-generated pet portrait in your chosen style'
      },
      'bundle': {
        name: 'Bougie Bundle (All 3 Styles)',
        price: 2400, // $24.00 in cents
        description: 'Three AI-generated pet portraits in all available styles'
      }
    };

    const product = products[productType as keyof typeof products];
    if (!product) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid productType. Use "single" or "bundle"' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

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
        imageUrl: imageUrl,
        style: style,
        productType: productType,
        timestamp: new Date().toISOString()
      },
    });

    return NextResponse.json(
      { 
        status: 'success', 
        sessionId: session.id,
        url: session.url 
      },
      { 
        headers: { 'Access-Control-Allow-Origin': '*' } 
      }
    );

  } catch (error) {
    console.error('❌ Checkout failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Checkout failed',
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