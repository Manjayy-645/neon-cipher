import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const baseDir = 'C:/Users/HP/Desktop/CIPHER/neon-cipher';
const publicIconsDir = path.join(baseDir, 'apps/web/public/icons');
const backupDir = path.join(baseDir, 'assets-src/icons-original');

// 1. Ensure backup directory exists and backup original files without overwriting
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

function getMaskBBox(pngBuffer) {
  let pos = 8;
  const idatChunks = [];
  while (pos < pngBuffer.length) {
    const len = pngBuffer.readUInt32BE(pos);
    const type = pngBuffer.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') idatChunks.push(pngBuffer.subarray(pos + 8, pos + 8 + len));
    pos += 8 + len + 4;
  }
  const idat = Buffer.concat(idatChunks);
  const raw = zlib.inflateSync(idat);
  const width = 1264;
  const height = 1264;
  const stride = 1 + width; // grayscale 1 byte/pixel
  
  let minX = width, minY = height, maxX = 0, maxY = 0;
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride + 1;
    for (let x = 0; x < width; x++) {
      const val = raw[rowOffset + x];
      if (val > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function normalizeSvgFile(filePath) {
  const fileName = path.basename(filePath);
  const origContent = fs.readFileSync(filePath, 'utf8');

  // Backup original if not yet backed up
  const backupPath = path.join(backupDir, fileName);
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, origContent);
  }

  // Parse before info
  const svgMatch = origContent.match(/<svg([^>]*)>/i);
  const beforeAttrs = svgMatch ? svgMatch[1] : '';
  const beforeW = (beforeAttrs.match(/width="([^"]*)"/i) || [])[1] || 'none';
  const beforeH = (beforeAttrs.match(/height="([^"]*)"/i) || [])[1] || 'none';
  const beforeVB = (beforeAttrs.match(/viewBox="([^"]*)"/i) || [])[1] || 'none';

  let newContent = origContent;

  // 1. Remove metadata
  newContent = newContent.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');

  // 2. Remove background rectangles (e.g. rect with 100% width/height or background fill)
  newContent = newContent.replace(/<rect[^>]+width="(?:100%|948|1264)"[^>]+height="(?:100%|948|1264)"[^>]*\/>/gi, '');

  // 3. Calculate new square viewBox with ~8% padding
  let newViewBox = beforeVB;
  if (fileName.startsWith('glyph-')) {
    const maskMatch = origContent.match(/xlink:href="data:image\/png;base64,([^"]+)"/);
    if (maskMatch) {
      const maskBuf = Buffer.from(maskMatch[1], 'base64');
      const bbox = getMaskBBox(maskBuf);
      // Coordinate scale in SVG is 0.75 (1264 * 0.75 = 948)
      const scale = 0.75;
      const artMinX = bbox.minX * scale;
      const artMinY = bbox.minY * scale;
      const artMaxX = bbox.maxX * scale;
      const artMaxY = bbox.maxY * scale;
      const artW = bbox.w * scale;
      const artH = bbox.h * scale;
      const centerX = (artMinX + artMaxX) / 2;
      const centerY = (artMinY + artMaxY) / 2;
      const maxDim = Math.max(artW, artH);
      // With 8% padding on each side, artwork occupies 84% of square viewBox
      const boxSize = Math.round(maxDim / 0.84);
      const vbX = Math.round(centerX - boxSize / 2);
      const vbY = Math.round(centerY - boxSize / 2);
      newViewBox = `${vbX} ${vbY} ${boxSize} ${boxSize}`;
    }
  } else {
    // For icons like icon-check, icon-lock: ensure clean square viewBox
    if (beforeVB === 'none' && beforeW !== 'none' && beforeH !== 'none') {
      newViewBox = `0 0 ${parseFloat(beforeW)} ${parseFloat(beforeH)}`;
    } else if (beforeVB !== 'none') {
      newViewBox = beforeVB;
    } else {
      newViewBox = '0 0 24 24';
    }
  }

  // 4. Update <svg> tag:
  // Remove width, height, zoomAndPan, version
  // Add/ensure viewBox and preserveAspectRatio="xMidYMid meet"
  newContent = newContent.replace(/<svg([^>]*)>/i, (match, attrs) => {
    let cleanAttrs = attrs
      .replace(/\s*width="[^"]*"/gi, '')
      .replace(/\s*height="[^"]*"/gi, '')
      .replace(/\s*viewBox="[^"]*"/gi, '')
      .replace(/\s*preserveAspectRatio="[^"]*"/gi, '')
      .replace(/\s*zoomAndPan="[^"]*"/gi, '')
      .trim();

    return `<svg ${cleanAttrs} viewBox="${newViewBox}" preserveAspectRatio="xMidYMid meet">`;
  });

  fs.writeFileSync(filePath, newContent);

  return {
    file: fileName,
    beforeSize: `${beforeW} x ${beforeH}`,
    beforeVB,
    afterSize: 'none (scalable)',
    afterVB: newViewBox,
    bytesBefore: origContent.length,
    bytesAfter: newContent.length
  };
}

const table = [];
const files = fs.readdirSync(publicIconsDir).filter(f => f.endsWith('.svg'));
for (const f of files) {
  table.push(normalizeSvgFile(path.join(publicIconsDir, f)));
}

// Also normalize in Device icons subdirectory if present
const deviceIconsDir = path.join(publicIconsDir, 'Device icons');
if (fs.existsSync(deviceIconsDir)) {
  const dFiles = fs.readdirSync(deviceIconsDir).filter(f => f.endsWith('.svg'));
  for (const f of dFiles) {
    normalizeSvgFile(path.join(deviceIconsDir, f));
  }
}

// Also normalize in Status Plates subdirectory if present
const statusPlatesDir = path.join(publicIconsDir, 'Status Plates');
if (fs.existsSync(statusPlatesDir)) {
  const sFiles = fs.readdirSync(statusPlatesDir).filter(f => f.endsWith('.svg'));
  for (const f of sFiles) {
    normalizeSvgFile(path.join(statusPlatesDir, f));
  }
}

console.log(JSON.stringify(table, null, 2));
