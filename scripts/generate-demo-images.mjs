import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join, dirname } from "path"

const OUT = join(import.meta.dirname, "..", "public", "demo")

const files = {
  // ── Clothing theme ──────────────────────────────────────
  "clothing/logo.svg": svgLogo("ATTOR"),
  "clothing/hero.jpg": svgPlaceholder("clothing-hero", "#1a1a2e", "#16213e", "HERO"),
  "clothing/cat-men.jpg": svgPlaceholder("cat-men", "#2d4059", "#1a1a2e", "MEN"),
  "clothing/cat-women.jpg": svgPlaceholder("cat-women", "#2d4059", "#ea5455", "WOMEN"),
  "clothing/cat-accessories.jpg": svgPlaceholder("cat-accessories", "#2d4059", "#f07b3f", "ACCESSORIES"),
  "clothing/about.jpg": svgPlaceholder("about", "#16213e", "#0f3460", "ABOUT"),

  "clothing/products/blazer-1.jpg": svgProduct("Heritage Wool", "#2d4059"),
  "clothing/products/blazer-2.jpg": svgProduct("Wool Blazer", "#1a1a2e"),
  "clothing/products/blazer-3.jpg": svgProduct("Blazer Detail", "#16213e"),
  "clothing/products/dress-1.jpg": svgProduct("Silk Midi", "#ea5455"),
  "clothing/products/dress-2.jpg": svgProduct("Midi Dress", "#c0392b"),
  "clothing/products/dress-3.jpg": svgProduct("Dress Detail", "#e74c3c"),
  "clothing/products/bag-1.jpg": svgProduct("Weekender", "#8b5a2b"),
  "clothing/products/bag-2.jpg": svgProduct("Bag Detail", "#6b3f1f"),
  "clothing/products/oxford-1.jpg": svgProduct("Oxford", "#e8e8e8"),
  "clothing/products/oxford-2.jpg": svgProduct("Oxford Detail", "#d4d4d4"),
  "clothing/products/coat-1.jpg": svgProduct("Overcoat", "#5d4e37"),
  "clothing/products/coat-2.jpg": svgProduct("Coat Detail", "#4a3e2c"),
  "clothing/products/trouser-1.jpg": svgProduct("Trousers", "#2c3e50"),
  "clothing/products/trouser-2.jpg": svgProduct("Trouser Detail", "#34495e"),
  "clothing/products/belt-1.jpg": svgProduct("Belt", "#4a2c0a"),
  "clothing/products/turtleneck-1.jpg": svgProduct("Turtleneck", "#dcdfe0"),
  "clothing/products/turtleneck-2.jpg": svgProduct("Neck Detail", "#c4c7c8"),

  "clothing/avatar-1.jpg": svgAvatar("SC", "#ea5455"),
  "clothing/avatar-2.jpg": svgAvatar("MJ", "#2d4059"),
  "clothing/avatar-3.jpg": svgAvatar("ER", "#f07b3f"),
  "clothing/avatar-4.jpg": svgAvatar("JP", "#0f3460"),

  // ── Eyewear theme ───────────────────────────────────────
  "eyewear/logo.svg": svgLogo("ATTOR\nOPTICS"),
  "eyewear/hero.jpg": svgPlaceholder("eyewear-hero", "#0a0a23", "#1a1a4e", "HERO"),
  "eyewear/cat-sunglasses.jpg": svgPlaceholder("cat-sunglasses", "#1a1a4e", "#2d2d6b", "SUNGLASSES"),
  "eyewear/cat-optical.jpg": svgPlaceholder("cat-optical", "#1a1a4e", "#3a3a8c", "OPTICAL"),
  "eyewear/cat-kids.jpg": svgPlaceholder("cat-kids", "#1a1a4e", "#4a4aad", "KIDS"),
  "eyewear/about.jpg": svgPlaceholder("about-eyewear", "#0f0f3d", "#1a1a5e", "ABOUT"),
}

for (const [relPath, content] of Object.entries(files)) {
  const abs = join(OUT, relPath)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content, "utf-8")
  console.log("✓", relPath)
}

console.log("\nDone -", Object.keys(files).length, "images generated")

// ── Helpers ───────────────────────────────────────────────

function svg(name, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${content.c1}" />
      <stop offset="100%" stop-color="${content.c2}" />
    </linearGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#bg)" />
  ${content.inner}
</svg>`
}

function svgPlaceholder(label, c1, c2, text) {
  return svg(label, {
    c1, c2,
    inner: `
    <rect x="0" y="0" width="800" height="1000" fill="url(#bg)" opacity="0.3"/>
    <circle cx="400" cy="400" r="200" fill="rgba(255,255,255,0.05)" />
    <text x="400" y="420" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-family="system-ui" font-size="80" font-weight="bold">${text}</text>
    <text x="400" y="520" text-anchor="middle" fill="rgba(255,255,255,0.15)" font-family="system-ui" font-size="24">Demo placeholder image</text>
    <rect x="300" y="600" width="200" height="4" rx="2" fill="rgba(255,255,255,0.1)"/>`,
  })
}

function svgProduct(title, accent) {
  return svg("product-" + title, {
    c1: "#f5f5f0", c2: "#e8e5de",
    inner: `
    <rect x="150" y="200" width="500" height="600" rx="20" fill="${accent}" opacity="0.15"/>
    <rect x="200" y="250" width="400" height="500" rx="12" fill="${accent}" opacity="0.08"/>
    <text x="400" y="540" text-anchor="middle" fill="${accent}" font-family="system-ui" font-size="32" font-weight="bold" opacity="0.4">${title}</text>
    <text x="400" y="580" text-anchor="middle" fill="${accent}" font-family="system-ui" font-size="16" opacity="0.25">Demo Product Image</text>`,
  })
}

function svgAvatar(initials, color) {
  return svg("avatar-" + initials, {
    c1: color, c2: adjustBrightness(color, -30),
    inner: `
    <circle cx="400" cy="400" r="400" fill="rgba(255,255,255,0.1)"/>
    <text x="400" y="440" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="system-ui" font-size="200" font-weight="bold">${initials}</text>`,
  })
}

function svgLogo(text) {
  const lines = text.split("\n")
  const fontSize = lines.length > 1 ? 48 : 64
  const lineHeight = lines.length > 1 ? 60 : 0
  const startY = lines.length > 1 ? 460 : 480
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">
  <rect width="400" height="600" fill="transparent"/>
  <rect x="120" y="180" width="160" height="160" rx="32" fill="currentColor" opacity="0.9"/>
  ${lines
    .map(
      (line, i) =>
        `<text x="200" y="${startY + i * lineHeight}" text-anchor="middle" fill="currentColor" font-family="system-ui" font-size="${fontSize}" font-weight="bold" letter-spacing="4">${line}</text>`,
    )
    .join("\n  ")}
</svg>`
}

function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + percent))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent))
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent))
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`
}
