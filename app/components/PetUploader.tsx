"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PetUploaderProps {
  className?: string;
  onImageGenerated?: (imageData: { imageUrl: string; prompt: string; timestamp: string }) => void;
}

interface GeneratedImage {
  imageUrl: string;
  prompt: string;
  timestamp: string;
  theme?: string;
  animalType?: string;
}

export default function PetUploader({ className = "", onImageGenerated }: PetUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("get-naked");
  const [animalType, setAnimalType] = useState("pet");

  const themes = [
    { id: "get-naked", name: "Get Naked", description: "Spa towel & shower cap" },
    { id: "fluff-fabulous", name: "Fluff & Fabulous", description: "Pearls & sunglasses" },
    { id: "purr-bubbles", name: "Purr Bubbles", description: "Bubble bath scene" },
    { id: "stay-classy", name: "Stay Classy", description: "Velvet stool & gold sink" }
  ];

  const animalTypes = [
    { id: "pet", name: "Pet" },
    { id: "cat", name: "Cat" },
    { id: "dog", name: "Dog" },
    { id: "bird", name: "Bird" },
    { id: "rabbit", name: "Rabbit" }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setImageUrl("");
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("theme", selectedTheme);
      formData.append("animalType", animalType);
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      
      if (data.imageUrl) {
        const url = data.imageUrl.startsWith("http")
          ? data.imageUrl
          : `http://localhost:3000${data.imageUrl}`;
        setImageUrl(url);
        
        // Notify parent component
        const newImage: GeneratedImage = {
          imageUrl: url,
          prompt: data.prompt || 'Custom upload',
          timestamp: data.timestamp,
          theme: data.theme,
          animalType: data.animalType
        };
        onImageGenerated?.(newImage);
      } else {
        throw new Error('No image URL returned');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `artzyful-portrait-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`w-full max-w-4xl mx-auto ${className}`}
    >
      {/* Theme Selection */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-4 text-center">
          Choose Your Theme
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {themes.map((theme) => (
            <motion.button
              key={theme.id}
              onClick={() => setSelectedTheme(theme.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedTheme === theme.id
                  ? "border-purple-400 bg-purple-100/20"
                  : "border-gray-300 hover:border-purple-300"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <h4 className="font-semibold text-white mb-1">{theme.name}</h4>
              <p className="text-sm text-gray-300">{theme.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Animal Type Selection */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-4 text-center">
          Pet Type
        </h3>
        <div className="flex flex-wrap justify-center gap-3">
          {animalTypes.map((animal) => (
            <motion.button
              key={animal.id}
              onClick={() => setAnimalType(animal.id)}
              className={`px-4 py-2 rounded-full border-2 transition-all duration-200 ${
                animalType === animal.id
                  ? "border-purple-400 bg-purple-600 text-white"
                  : "border-gray-300 text-gray-300 hover:border-purple-300"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {animal.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div className="mb-8">
        <motion.div
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
            dragActive
              ? "border-purple-400 bg-purple-50/20"
              : "border-gray-300 hover:border-purple-300"
          } ${loading ? "opacity-50 pointer-events-none" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            {imagePreview ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-purple-200">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm text-gray-300">
                  Image selected ✓
                </div>
              </div>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center"
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </motion.div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Upload Your Pet Photo
                  </h3>
                  <p className="text-gray-300">
                    Drag and drop your image here, or click to browse
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200"
          >
            <p className="text-green-800 font-medium">
              Selected: {selectedFile.name}
            </p>
          </motion.div>
        )}
      </div>

      {/* Generate Button */}
      <motion.button
        onClick={handleUpload}
        disabled={!selectedFile || loading}
        className={`w-full py-4 px-8 rounded-full font-semibold text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-300 ${
          !selectedFile || loading
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:scale-105"
        }`}
        whileHover={!selectedFile || loading ? {} : { scale: 1.05 }}
        whileTap={!selectedFile || loading ? {} : { scale: 0.95 }}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
            <span>Generating Portrait...</span>
          </div>
        ) : (
          "Generate Portrait"
        )}
      </motion.button>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200"
          >
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Image */}
      <AnimatePresence>
        {imageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mt-8"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                Your Artzyful Portrait
              </h3>
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Generated Pet Portrait"
                  className="w-full h-auto rounded-lg shadow-md"
                  onError={(e) => {
                    e.currentTarget.src = '/images/fallback.png';
                    e.currentTarget.alt = 'Image failed to load. Please try again.';
                  }}
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium"
                >
                  ✨ Artzyful
                </motion.div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <motion.button
                  onClick={downloadImage}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Download Watermarked Image
                </motion.button>
                <motion.button
                  className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Continue to Checkout
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 