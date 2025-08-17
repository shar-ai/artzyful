'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

const themeDescriptions = {
  'get-naked': "wrapped in a fluffy white towel with a shower cap, sitting in a luxurious spa bathroom with steam, mirror lights, and candles.",
  'fluff-fabulous': "wearing pearls and sunglasses, lounging glamorously beside a vintage clawfoot tub with dramatic lighting and a martini glass nearby.",
  'purr-bubbles': "in a warm bubble bath, surrounded by floating bubbles and a rubber duck, inside a marble spa tub with candles around.",
  'stay-classy': "sitting on a velvet stool next to a gold sink in a luxury bathroom with moody lighting and marble walls, looking sophisticated."
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<string>('get-naked')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    
    // For demo purposes, we'll use a placeholder URL
    // In production, you'd upload to your own server or a service like Cloudinary
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(reader.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  const generatePortrait = async () => {
    if (!selectedFile) {
      setError('Please select an image first')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Upload image and get URL
      const imageUrl = await uploadImage(selectedFile)
      
      // Call the API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
          theme: selectedTheme,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate portrait')
      }

      setGeneratedImage(data.image)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate portrait')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Bougie Pet Portraits
          </h1>
          <p className="text-xl text-gray-600">
            Transform your pet into a luxury portrait with AI style transfer
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-semibold mb-6 text-center">Upload Your Pet Photo</h2>
            
            <div className="flex flex-col items-center">
              <label className="w-full max-w-md h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </label>
              
              {selectedFile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-center"
                >
                  <p className="text-sm text-gray-600">
                    Selected: {selectedFile.name}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Theme Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-semibold mb-6 text-center">Choose Your Bougie Style</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(themeDescriptions).map(([key, description]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTheme(key)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedTheme === key
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <h3 className="font-semibold mb-2 capitalize">
                    {key.replace('-', ' ')}
                  </h3>
                  <p className="text-sm text-gray-600">{description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Generate Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <button
              onClick={generatePortrait}
              disabled={!selectedFile || isGenerating}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
                selectedFile && !isGenerating
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                  Generating...
                </div>
              ) : (
                'Generate Bougie Portrait'
              )}
            </button>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-center"
            >
              <p className="text-red-600">{error}</p>
            </motion.div>
          )}

          {/* Generated Image */}
          {generatedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-semibold mb-6 text-center">Your Bougie Portrait</h2>
              <div className="flex justify-center">
                <div className="relative">
                  <Image
                    src={generatedImage}
                    alt="Generated pet portrait"
                    width={512}
                    height={512}
                    className="rounded-lg shadow-lg"
                  />
                  <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    Artzyful
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <button
                  onClick={() => window.open(generatedImage, '_blank')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors mr-4"
                >
                  Download Portrait
                </button>
                <button
                  onClick={() => setGeneratedImage(null)}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Generate Another
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
} 