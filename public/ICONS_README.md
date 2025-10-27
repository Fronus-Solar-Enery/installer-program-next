# Icon Files Required

The following icon files need to be generated from the favicon.svg:

## Required Files:

1. **favicon.ico** (48x48)
   - Legacy browser favicon
   - ICO format

2. **icon-192.png** (192x192)
   - PWA icon for Android
   - PNG format

3. **icon-512.png** (512x512)
   - PWA icon for high-resolution displays
   - PNG format

## How to Generate:

### Option 1: Using Online Tools
1. Visit https://realfavicongenerator.net/
2. Upload the `favicon.svg` file
3. Download the generated package
4. Extract and place files in the `/public` directory

### Option 2: Using ImageMagick (CLI)
```bash
# Install ImageMagick first
# Then run these commands in the /public directory:

# Generate PNG files
convert favicon.svg -resize 192x192 icon-192.png
convert favicon.svg -resize 512x512 icon-512.png

# Generate ICO file
convert favicon.svg -resize 48x48 favicon.ico
```

### Option 3: Using Node.js (sharp library)
```bash
npm install -g sharp-cli
sharp -i favicon.svg -o icon-192.png resize 192 192
sharp -i favicon.svg -o icon-512.png resize 512 512
sharp -i favicon.svg -o favicon.ico resize 48 48
```

## Current Status:
- ✅ favicon.svg (created)
- ❌ favicon.ico (needs to be generated)
- ❌ icon-192.png (needs to be generated)
- ❌ icon-512.png (needs to be generated)

The SVG favicon will work in modern browsers, but the PNG and ICO files are needed for:
- PWA installation
- Legacy browser support
- iOS home screen icons
- Android app icons
