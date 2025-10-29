import { $ } from "bun";
import { existsSync, mkdirSync } from "fs";

// Ensure public directory exists
if (!existsSync("public")) {
  mkdirSync("public", { recursive: true });
}

// Create a simple canvas-based icon generator
const generateIcon = (size: number) => {
  const canvas = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0a0a0a"/>
  <text x="256" y="200" font-family="Arial, sans-serif" font-size="120" font-weight="bold" text-anchor="middle" fill="#10b981">미성</text>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="100" font-weight="bold" text-anchor="middle" fill="#ffffff">E&C</text>
  <text x="256" y="420" font-family="Arial, sans-serif" font-size="60" text-anchor="middle" fill="#6b7280">CRM</text>
</svg>`;

  return canvas;
};

// Generate icons
const sizes = [192, 512];

for (const size of sizes) {
  const svg = generateIcon(size);
  await Bun.write(`public/icon-${size}.svg`, svg);
  console.log(`✅ Generated icon-${size}.svg`);
}

// Since we can't easily convert SVG to PNG in Bun without external tools,
// we'll use SVGs directly (modern browsers support SVG icons in manifest)
// Update the manifest to use SVG icons
const manifest = {
  "name": "미성 E&C CRM",
  "short_name": "미성CRM",
  "description": "미성 E&C 영업 및 현장 관리 시스템",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#10b981",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ],
  "categories": ["business", "productivity"],
  "lang": "ko-KR"
};

await Bun.write("public/manifest.json", JSON.stringify(manifest, null, 2));
console.log("✅ Updated manifest.json with SVG icons");