// Regenerate the raster favicons from public/favicon.svg (the source of truth).
//   node scripts/gen-favicons.cjs
// Produces:
//   public/apple-touch-icon.png  (180x180, for iOS home screen)
//   public/favicon.ico           (16/32/48 PNG-in-ICO, legacy fallback)
// sharp rasterizes the SVG without a prefers-color-scheme context, so it renders
// the light variant (ink tile, light mark) — the right look for a fixed icon.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SVG = fs.readFileSync(path.join(ROOT, 'public/favicon.svg'));

const renderPng = (size) =>
  sharp(SVG, { density: 512 }).resize(size, size, { fit: 'contain' }).png().toBuffer();

// Pack one-or-more PNG buffers into a (PNG-in-)ICO container.
function buildIco(items) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(items.length, 4);
  let offset = 6 + 16 * items.length;
  const dir = items.map(({ size, png }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // color planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    return e;
  });
  return Buffer.concat([header, ...dir, ...items.map((i) => i.png)]);
}

(async () => {
  fs.writeFileSync(path.join(ROOT, 'public/apple-touch-icon.png'), await renderPng(180));

  const sizes = [16, 32, 48];
  const items = await Promise.all(sizes.map(async (size) => ({ size, png: await renderPng(size) })));
  fs.writeFileSync(path.join(ROOT, 'public/favicon.ico'), buildIco(items));

  console.log('Wrote public/apple-touch-icon.png and public/favicon.ico');
})();
