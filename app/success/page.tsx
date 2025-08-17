'use client';

import { useEffect, useState } from 'react';
import Stripe from 'stripe';

interface GeneratedImage {
  style: string;
  imageUrl: string;
  displayName: string;
}

export default function SuccessPage() {
  const [session, setSession] = useState<any>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    // Retrieve session and generate images
    handleSuccess(sessionId);
  }, []);

  const handleSuccess = async (sessionId: string) => {
    try {
      // Get session data from our API
      const sessionResponse = await fetch('/api/get-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to retrieve session');
      }

      const sessionData = await sessionResponse.json();
      setSession(sessionData);

      // Generate images based on product type
      if (sessionData.metadata.productType === 'single') {
        await generateSingleImage(sessionData.metadata);
      } else if (sessionData.metadata.productType === 'bundle') {
        await generateBundleImages(sessionData.metadata);
      }

    } catch (err) {
      console.error('Success page error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateSingleImage = async (metadata: any) => {
    try {
      const response = await fetch('/api/edit-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: metadata.imageUrl,
          style: metadata.style,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        setGeneratedImages([{
          style: metadata.style,
          imageUrl: result.imageUrl,
          displayName: getStyleDisplayName(metadata.style)
        }]);
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setError('Failed to generate image');
    }
  };

  const generateBundleImages = async (metadata: any) => {
    const styles = ['get-naked', 'fluff-and-fabulous', 'purr-my-bubbles'];
    const images: GeneratedImage[] = [];

    try {
      for (const style of styles) {
        const response = await fetch('/api/edit-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: metadata.imageUrl,
            style: style,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate ${style} image`);
        }

        const result = await response.json();
        
        if (result.status === 'success') {
          images.push({
            style: style,
            imageUrl: result.imageUrl,
            displayName: getStyleDisplayName(style)
          });
        }
      }

      setGeneratedImages(images);
    } catch (err) {
      console.error('Bundle generation error:', err);
      setError('Failed to generate bundle images');
    }
  };

  const getStyleDisplayName = (style: string) => {
    const names = {
      'get-naked': 'Get Naked',
      'fluff-and-fabulous': 'Fluff & Fabulous',
      'purr-my-bubbles': 'Purr My Bubbles'
    };
    return names[style as keyof typeof names] || style;
  };

  const downloadImage = (imageUrl: string, style: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `bougie-pet-${style}.png`;
    link.click();
  };

  const prepareForPrint = async (imageUrl: string, style: string, orientation: 'portrait' | 'landscape') => {
    try {
      const response = await fetch('/api/prepare-for-print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
          orientation: orientation
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to prepare image for printing');
      }

      const result = await response.json();
      
      if (result.success) {
        const link = document.createElement('a');
        link.href = result.processedImageUrl;
        link.download = `bougie-pet-${style}-${orientation}.jpg`;
        link.click();
      }
    } catch (err) {
      console.error('Print preparation error:', err);
      alert('Failed to prepare image for printing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Processing your order...</h2>
          <p className="text-gray-600 mt-2">Generating your pet portraits</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <a href="/pet-styles.html" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
            Try Again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-400 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">
              Thank you for your purchase! Your {session?.metadata?.productType === 'bundle' ? 'bundle' : 'portrait'} is ready.
            </p>
          </div>

          {session && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Order Details:</h3>
              <p className="text-sm text-gray-600">
                <strong>Product:</strong> {session.metadata.productType === 'bundle' ? 'Bougie Bundle (All 3 Styles)' : 'Bougie Pet Portrait'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Amount:</strong> ${(session.amount_total / 100).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Status:</strong> <span className="text-green-600">Paid</span>
              </p>
            </div>
          )}

          {generatedImages.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Your Pet Portraits
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedImages.map((image, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <img 
                      src={image.imageUrl} 
                      alt={image.displayName}
                      className="w-full h-64 object-cover rounded-lg mb-4"
                    />
                    <h3 className="font-semibold text-gray-800 mb-3">{image.displayName}</h3>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => downloadImage(image.imageUrl, image.style)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        📥 Download Original
                      </button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => prepareForPrint(image.imageUrl, image.style, 'portrait')}
                          className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 text-xs"
                        >
                          📄 Portrait
                        </button>
                        <button
                          onClick={() => prepareForPrint(image.imageUrl, image.style, 'landscape')}
                          className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 text-xs"
                        >
                          🖼️ Landscape
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <a 
            href="/pet-styles.html" 
            className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 inline-block"
          >
            🎨 Create More Portraits
          </a>
        </div>
      </div>
    </div>
  );
} 