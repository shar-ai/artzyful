# Bougie Pet Portraits 🐾✨

Transform your pet photos into stunning luxury portraits using AI style transfer with Replicate's SDXL IP-Adapter model.

## Features

- **🎨 True Image-to-Image**: Uses Replicate's SDXL IP-Adapter for authentic style transfer
- **📸 Pet Photo Upload**: Upload any pet photo and maintain likeness
- **🎭 Four Bougie Themes**: Choose from luxury spa styles
- **⚡ Fast Generation**: Real-time AI processing
- **📱 Responsive Design**: Works on desktop and mobile
- **🎯 Professional Results**: High-quality, watermark-free portraits

## Bougie Themes

1. **Get Naked** 🛁 - Towel wrap and shower cap in spa setting
2. **Fluff & Fabulous** 💎 - Pearls and sunglasses by clawfoot tub  
3. **Purr My Bubbles** 🦆 - Bubble bath with rubber duck
4. **Stay Classy** 👑 - Velvet stool beside gold sink

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **AI**: Replicate SDXL IP-Adapter
- **Deployment**: Vercel-ready

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo>
cd bougie-pet-portraits
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Replicate API Token (get from https://replicate.com)
REPLICATE_API_TOKEN=your_replicate_api_token_here

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Get Replicate API Token

1. Go to [Replicate](https://replicate.com)
2. Sign up/login and get your API token
3. Add it to your `.env.local` file

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your Bougie Pet Portrait generator!

## API Endpoint

The `/api/generate` endpoint accepts:

```json
{
  "imageUrl": "data:image/jpeg;base64,...",
  "theme": "get-naked",
  "prompt": "optional custom prompt"
}
```

Returns:

```json
{
  "image": "https://replicate.delivery/...",
  "prompt": "A luxurious pet portrait...",
  "theme": "get-naked",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## How It Works

1. **Upload**: User uploads a pet photo
2. **Theme Selection**: Choose from 4 luxury spa themes
3. **AI Processing**: Replicate's SDXL IP-Adapter processes the image
4. **Style Transfer**: Maintains pet likeness while applying bougie aesthetic
5. **Result**: High-quality portrait with luxury spa styling

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

```env
REPLICATE_API_TOKEN=your_production_token
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## Customization

### Adding New Themes

Edit `app/api/generate/route.ts`:

```typescript
const themeDescriptions = {
  'your-theme': "your theme description here",
  // ... existing themes
}
```

### Modifying Prompts

Update the prompt generation in the API route:

```typescript
const finalPrompt = prompt || `Your custom prompt template ${themeDescriptions[theme]}`;
```

## Troubleshooting

### Common Issues

1. **"Replicate API token not configured"**
   - Check your `.env.local` file
   - Ensure `REPLICATE_API_TOKEN` is set

2. **"Failed to generate image"**
   - Check your Replicate account credits
   - Verify the image URL is accessible

3. **Image not loading**
   - Check Next.js image domains in `next.config.js`
   - Ensure Replicate delivery URLs are allowed

### Development Tips

- Use browser dev tools to check network requests
- Check Vercel/Next.js logs for API errors
- Test with different image formats (JPG, PNG)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this for your own projects!

---

**Made with ❤️ for bougie pets everywhere** 🐕🐱✨ 