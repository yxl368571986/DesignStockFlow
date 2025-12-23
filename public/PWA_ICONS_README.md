# PWA Icons Requirements

## Required Icons

The PWA configuration requires the following icon files to be placed in the `public` directory:

### 1. pwa-192x192.png
- **Size**: 192x192 pixels
- **Format**: PNG
- **Purpose**: Standard PWA icon for mobile devices
- **Design**: Should contain the "星潮设计" logo with clear visibility at small sizes

### 2. pwa-512x512.png
- **Size**: 512x512 pixels
- **Format**: PNG
- **Purpose**: High-resolution PWA icon for larger displays and splash screens
- **Design**: Should contain the "星潮设计" logo with high quality

### 3. apple-touch-icon.png
- **Size**: 180x180 pixels (recommended)
- **Format**: PNG
- **Purpose**: iOS home screen icon
- **Design**: Should contain the "星潮设计" logo optimized for iOS

### 4. favicon.ico
- **Size**: 32x32 pixels (or multi-size)
- **Format**: ICO
- **Purpose**: Browser tab icon
- **Design**: Simplified version of the logo

## Design Guidelines

### Brand Colors
- **Primary**: #165DFF (Blue)
- **Secondary**: #FF7D00 (Orange)
- **Background**: White or gradient

### Logo Elements
- Include "星潮设计" text or stylized "ST" initials
- Optional: Star or wave graphic elements
- Ensure good contrast and visibility

### Icon Design Tips
1. Use simple, recognizable shapes
2. Avoid fine details that won't be visible at small sizes
3. Test icons at actual display sizes
4. Ensure icons work on both light and dark backgrounds
5. Consider using a solid background color for better visibility

## Temporary Placeholder

Until the actual icons are created, you can use placeholder images or generate simple icons with the brand colors.

### Quick Generation Options
1. Use online tools like [Favicon Generator](https://realfavicongenerator.net/)
2. Use design tools like Figma, Sketch, or Adobe Illustrator
3. Use icon generation services

## Installation

Once the icons are created, place them in the `public` directory:

```
public/
├── pwa-192x192.png
├── pwa-512x512.png
├── apple-touch-icon.png
├── favicon.ico
└── offline.html
```

The Vite PWA plugin will automatically include these files in the build.
