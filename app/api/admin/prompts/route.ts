import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// File to store prompts
const PROMPTS_FILE = path.join(process.cwd(), 'data', 'prompts.json');
const SITE_CONTENT_FILE = path.join(process.cwd(), 'data', 'site-content.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Default prompts
const defaultPrompts = {
  'get-naked': "Transform this into a vintage oil painting of the pet wrapped in a fluffy white towel with a towel turban on its head, as if it's fresh out of a spa. Add a marble bathroom background with golden candlelight, subtle steam, and a foggy mirror. Soft vintage lighting with a cozy, luxurious feel. Keep the pet's face and pose intact.",
  'fluff-and-fabulous': "Transform this into a vintage oil painting of the pet lounging in a clawfoot bathtub, adorned with pearl necklaces, oversized sunglasses, and a martini glass on the edge of the tub. The scene should have warm vintage lighting, white marble tiles, and soft pink towels nearby. Keep the pet's original face and posture. Subtle glam, no photorealism.",
  'purr-my-bubbles': "Transform this into a vintage oil painting of the pet in a bubble bath with paws up, surrounded by floating bubbles and a rubber duck. Use a light pastel background with golden fixtures and soft candlelight. Add a vintage glow and visible bath foam. Keep the pet's real face and expression untouched."
};

// Default site content
const defaultSiteContent = {
  heroTitle: "Transform Your Pet Into Art",
  heroSubtitle: "Upload your pet's photo and choose from our vintage-inspired styles",
  logo: "/images/logo.png",
  heroImage: "/images/hero-banner.jpg",
  styleNames: {
    'get-naked': "Get Naked",
    'fluff-and-fabulous': "Fluff & Fabulous", 
    'purr-my-bubbles': "Purr My Bubbles"
  },
  styleDescriptions: {
    'get-naked': "Spa day vibes with fluffy towels",
    'fluff-and-fabulous': "Glamorous bathtub luxury",
    'purr-my-bubbles': "Bubble bath fun with rubber duck"
  }
};

// GET - Retrieve prompts and site content
export async function GET() {
  try {
    await ensureDataDir();
    
    let prompts = defaultPrompts;
    let siteContent = defaultSiteContent;
    
    // Try to load existing data
    try {
      const promptsData = await fs.readFile(PROMPTS_FILE, 'utf-8');
      prompts = { ...defaultPrompts, ...JSON.parse(promptsData) };
    } catch (error) {
      // Use defaults if file doesn't exist
      await fs.writeFile(PROMPTS_FILE, JSON.stringify(defaultPrompts, null, 2));
    }
    
    try {
      const siteData = await fs.readFile(SITE_CONTENT_FILE, 'utf-8');
      siteContent = { ...defaultSiteContent, ...JSON.parse(siteData) };
    } catch (error) {
      // Use defaults if file doesn't exist
      await fs.writeFile(SITE_CONTENT_FILE, JSON.stringify(defaultSiteContent, null, 2));
    }
    
    return NextResponse.json({
      prompts,
      siteContent
    });
    
  } catch (error) {
    console.error('Admin GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load admin data' },
      { status: 500 }
    );
  }
}

// POST - Update prompts and site content
export async function POST(request: NextRequest) {
  try {
    const { prompts, siteContent } = await request.json();
    
    await ensureDataDir();
    
    // Save prompts
    if (prompts) {
      await fs.writeFile(PROMPTS_FILE, JSON.stringify(prompts, null, 2));
    }
    
    // Save site content
    if (siteContent) {
      await fs.writeFile(SITE_CONTENT_FILE, JSON.stringify(siteContent, null, 2));
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Admin POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save admin data' },
      { status: 500 }
    );
  }
} 