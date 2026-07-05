import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buffers) {
  let c = 0xffffffff;
  for (const buffer of buffers) {
    for (const byte of buffer) {
      c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type);
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  typeBuffer.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32([typeBuffer, data]), 8 + data.length);
  return output;
}

function createImage(width, height) {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
  };
}

function color(hex, alpha = 255) {
  const value = hex.replace('#', '');
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
    alpha,
  ];
}

function setPixel(image, x, y, rgba) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) {
    return;
  }
  const offset = (y * image.width + x) * 4;
  image.data[offset] = rgba[0];
  image.data[offset + 1] = rgba[1];
  image.data[offset + 2] = rgba[2];
  image.data[offset + 3] = rgba[3];
}

function fill(image, rgba) {
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      setPixel(image, x, y, rgba);
    }
  }
}

function fillRect(image, x, y, width, height, rgba) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      setPixel(image, xx, yy, rgba);
    }
  }
}

function fillCircle(image, cx, cy, radius, rgba) {
  const radiusSq = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radiusSq) {
        setPixel(image, x, y, rgba);
      }
    }
  }
}

function fillEllipse(image, cx, cy, radiusX, radiusY, rgba) {
  for (let y = Math.floor(cy - radiusY); y <= Math.ceil(cy + radiusY); y += 1) {
    for (let x = Math.floor(cx - radiusX); x <= Math.ceil(cx + radiusX); x += 1) {
      const dx = (x - cx) / radiusX;
      const dy = (y - cy) / radiusY;
      if (dx * dx + dy * dy <= 1) {
        setPixel(image, x, y, rgba);
      }
    }
  }
}

function drawLine(image, x1, y1, x2, y2, width, rgba) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let index = 0; index <= steps; index += 1) {
    const t = steps === 0 ? 0 : index / steps;
    fillCircle(
      image,
      Math.round(x1 + (x2 - x1) * t),
      Math.round(y1 + (y2 - y1) * t),
      Math.max(1, width / 2),
      rgba,
    );
  }
}

function drawQuadratic(image, x1, y1, cx, cy, x2, y2, width, rgba) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), Math.abs(cx - x1), Math.abs(cy - y1));
  let previousX = x1;
  let previousY = y1;
  for (let index = 1; index <= steps; index += 1) {
    const t = index / steps;
    const inv = 1 - t;
    const x = inv * inv * x1 + 2 * inv * t * cx + t * t * x2;
    const y = inv * inv * y1 + 2 * inv * t * cy + t * t * y2;
    drawLine(image, Math.round(previousX), Math.round(previousY), Math.round(x), Math.round(y), width, rgba);
    previousX = x;
    previousY = y;
  }
}

function pseudoNoise(x, y, seed) {
  let value = x * 374761393 + y * 668265263 + seed * 982451653;
  value = (value ^ (value >>> 13)) * 1274126177;
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function writePng(filePath, image) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(image.width, 0);
  header.writeUInt32BE(image.height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = image.width * 4;
  const raw = Buffer.alloc((stride + 1) * image.height);
  for (let y = 0; y < image.height; y += 1) {
    const rawOffset = y * (stride + 1);
    raw[rawOffset] = 0;
    Buffer.from(image.data.buffer, y * stride, stride).copy(raw, rawOffset + 1);
  }

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(
    filePath,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', header),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND'),
    ]),
  );
}

function noisyTile(baseHex, accentHex, seed) {
  const image = createImage(64, 64);
  const base = color(baseHex);
  const accent = color(accentHex);
  for (let y = 0; y < 64; y += 1) {
    for (let x = 0; x < 64; x += 1) {
      const n = pseudoNoise(x, y, seed);
      const mix = 0.15 + n * 0.22;
      setPixel(image, x, y, [
        Math.round(base[0] + (accent[0] - base[0]) * mix),
        Math.round(base[1] + (accent[1] - base[1]) * mix),
        Math.round(base[2] + (accent[2] - base[2]) * mix),
        255,
      ]);
    }
  }
  return image;
}

function floorTile() {
  const image = noisyTile('#0C1222', '#17223A', 17);
  fillRect(image, 0, 0, 64, 1, color('#253654', 150));
  fillRect(image, 0, 63, 64, 1, color('#050813', 170));
  fillRect(image, 0, 0, 1, 64, color('#253654', 150));
  fillRect(image, 63, 0, 1, 64, color('#050813', 170));
  return image;
}

function wallTile() {
  const image = noisyTile('#23304A', '#3A496C', 29);
  fillRect(image, 0, 0, 64, 5, color('#7382AD'));
  fillRect(image, 0, 0, 5, 64, color('#5C6D99'));
  fillRect(image, 0, 59, 64, 5, color('#0B1020'));
  fillRect(image, 59, 0, 5, 64, color('#0B1020'));
  fillRect(image, 8, 21, 48, 3, color('#101729'));
  fillRect(image, 30, 0, 3, 22, color('#101729'));
  fillRect(image, 17, 24, 3, 36, color('#101729'));
  fillRect(image, 44, 24, 3, 36, color('#101729'));
  return image;
}

function graveTile() {
  const image = createImage(128, 128);
  fill(image, color('#000000', 0));
  fillEllipse(image, 64, 105, 48, 10, color('#020505', 120));
  fillRect(image, 29, 103, 70, 7, color('#111815', 180));
  fillRect(image, 35, 56, 58, 51, color('#57615E', 244));
  fillEllipse(image, 64, 56, 29, 24, color('#6E7873', 245));
  fillRect(image, 39, 55, 50, 49, color('#6E7873', 245));
  fillRect(image, 35, 84, 5, 21, color('#2D3533', 210));
  fillRect(image, 88, 61, 5, 44, color('#303936', 210));
  fillRect(image, 40, 104, 51, 5, color('#222B28', 225));
  fillRect(image, 32, 110, 65, 5, color('#121A17', 210));
  fillRect(image, 44, 62, 38, 2, color('#9EA8A0', 105));
  fillRect(image, 44, 67, 38, 1, color('#323B38', 105));
  fillRect(image, 57, 45, 14, 31, color('#2A3330', 145));
  fillRect(image, 49, 57, 30, 9, color('#2A3330', 145));
  fillRect(image, 60, 48, 8, 25, color('#88928C', 55));
  fillRect(image, 52, 59, 24, 3, color('#88928C', 45));
  drawLine(image, 81, 77, 72, 88, 2, color('#222B29', 150));
  drawLine(image, 72, 88, 79, 96, 2, color('#222B29', 135));
  drawLine(image, 48, 80, 55, 88, 2, color('#222B29', 120));
  drawLine(image, 55, 88, 50, 98, 2, color('#222B29', 115));
  drawLine(image, 38, 48, 46, 39, 2, color('#AAB2AC', 75));
  drawLine(image, 42, 74, 50, 74, 2, color('#232B29', 150));
  drawLine(image, 42, 74, 42, 90, 2, color('#232B29', 150));
  drawLine(image, 44, 82, 50, 90, 2, color('#232B29', 145));
  drawLine(image, 56, 74, 56, 91, 2, color('#232B29', 150));
  drawLine(image, 56, 74, 65, 74, 2, color('#232B29', 150));
  drawLine(image, 56, 82, 63, 82, 2, color('#232B29', 135));
  drawLine(image, 56, 91, 65, 91, 2, color('#232B29', 150));
  drawLine(image, 72, 74, 72, 91, 2, color('#232B29', 150));
  drawLine(image, 72, 74, 81, 74, 2, color('#232B29', 150));
  drawLine(image, 81, 74, 81, 82, 2, color('#232B29', 140));
  drawLine(image, 72, 82, 81, 82, 2, color('#232B29', 135));
  drawLine(image, 76, 82, 83, 92, 2, color('#232B29', 145));
  fillRect(image, 34, 99, 10, 8, color('#435442', 185));
  fillRect(image, 42, 96, 4, 10, color('#5D7754', 170));
  fillRect(image, 82, 100, 11, 7, color('#435442', 185));
  fillRect(image, 88, 94, 4, 12, color('#5B754F', 160));
  fillRect(image, 50, 108, 7, 4, color('#1D2B20', 170));
  fillRect(image, 70, 108, 9, 4, color('#1D2B20', 170));
  return image;
}

function spiderWebTile() {
  const image = createImage(128, 128);
  fill(image, color('#000000', 0));
  const anchor = [10, 9];
  const web = color('#E5ECE4', 128);
  const brightWeb = color('#FFFFFF', 150);
  const softWeb = color('#DCE3DA', 72);
  const strands = [
    [126, 7],
    [126, 35],
    [121, 68],
    [94, 102],
    [56, 124],
    [20, 127],
    [0, 114],
    [0, 74],
    [0, 34],
    [0, 0],
  ];

  for (const [x, y] of strands) {
    drawLine(image, anchor[0], anchor[1], x, y, 2, softWeb);
  }
  drawLine(image, 0, 0, 127, 0, 3, color('#FFFFFF', 100));
  drawLine(image, 0, 0, 0, 127, 3, color('#FFFFFF', 100));

  drawQuadratic(image, 28, 0, 20, 24, 0, 29, 2, web);
  drawQuadratic(image, 53, 0, 42, 42, 0, 54, 2, softWeb);
  drawQuadratic(image, 83, 0, 62, 69, 0, 83, 2, softWeb);
  drawQuadratic(image, 113, 0, 83, 94, 8, 114, 2, color('#DCE3DA', 62));
  drawQuadratic(image, 127, 17, 88, 20, 60, 0, 2, web);
  drawQuadratic(image, 127, 44, 77, 49, 42, 6, 2, web);
  drawQuadratic(image, 124, 73, 70, 76, 24, 22, 2, softWeb);
  drawQuadratic(image, 101, 104, 60, 100, 10, 48, 2, softWeb);
  drawQuadratic(image, 63, 124, 39, 103, 0, 80, 2, color('#DCE3DA', 58));
  drawQuadratic(image, 15, 126, 17, 78, 0, 42, 2, color('#DCE3DA', 54));
  drawLine(image, 63, 8, 72, 20, 1, brightWeb);
  drawLine(image, 72, 20, 67, 29, 1, brightWeb);
  drawLine(image, 31, 36, 39, 47, 1, color('#FFFFFF', 118));
  drawLine(image, 39, 47, 33, 58, 1, color('#FFFFFF', 100));
  fillCircle(image, 58, 72, 3, color('#CDD6CE', 90));
  drawLine(image, 58, 72, 54, 78, 1, color('#CDD6CE', 88));
  drawLine(image, 58, 72, 64, 79, 1, color('#CDD6CE', 88));
  drawLine(image, 56, 73, 50, 73, 1, color('#CDD6CE', 88));
  drawLine(image, 60, 73, 67, 73, 1, color('#CDD6CE', 88));
  return image;
}

function coinTile() {
  const image = createImage(64, 64);
  fill(image, color('#000000', 0));
  fillCircle(image, 32, 32, 22, color('#B86E05', 230));
  fillCircle(image, 30, 29, 20, color('#FFD447'));
  fillCircle(image, 30, 29, 13, color('#FFB229'));
  fillRect(image, 28, 15, 7, 29, color('#FFF3A8', 160));
  fillRect(image, 21, 24, 27, 5, color('#FFF3A8', 120));
  return image;
}

function exitTile() {
  const image = createImage(64, 64);
  fill(image, color('#000000', 0));
  fillCircle(image, 32, 32, 27, color('#0D1730', 235));
  fillCircle(image, 32, 32, 20, color('#1A2F61', 240));
  fillCircle(image, 32, 32, 14, color('#44E5FF', 110));
  drawLine(image, 17, 45, 47, 45, 6, color('#FFD447'));
  drawLine(image, 20, 45, 20, 24, 6, color('#FFD447'));
  drawLine(image, 44, 45, 44, 24, 6, color('#FFD447'));
  drawLine(image, 20, 24, 32, 14, 6, color('#FFD447'));
  drawLine(image, 32, 14, 44, 24, 6, color('#FFD447'));
  return image;
}

function characterCanvas() {
  const image = createImage(64, 64);
  fill(image, color('#000000', 0));
  fillRect(image, 14, 48, 36, 7, color('#000000', 80));
  return image;
}

function blockFace(image, x, y, size, main, shade, eye, mouth = '#101010') {
  fillRect(image, x, y, size, size, color(shade));
  fillRect(image, x + 3, y + 3, size - 6, size - 6, color(main));
  fillRect(image, x + 10, y + 14, 8, 8, color(eye));
  fillRect(image, x + size - 18, y + 14, 8, 8, color(eye));
  fillRect(image, x + 20, y + 28, size - 40, 7, color(mouth));
}

function humanoid({ head, shade, body, eye, accent = '#FFFFFF', mouth = '#161616' }) {
  const image = characterCanvas();
  fillRect(image, 20, 39, 9, 16, color(body));
  fillRect(image, 35, 39, 9, 16, color(body));
  fillRect(image, 16, 29, 8, 18, color(body));
  fillRect(image, 40, 29, 8, 18, color(body));
  fillRect(image, 19, 31, 26, 21, color(body));
  blockFace(image, 15, 8, 34, head, shade, eye, mouth);
  fillRect(image, 18, 11, 13, 3, color(accent, 130));
  return image;
}

function zombie() {
  return humanoid({
    head: '#9EA3A8',
    shade: '#71777D',
    body: '#505761',
    eye: '#0D121A',
    accent: '#D4D7DA',
  });
}

function creeper() {
  const image = characterCanvas();
  fillRect(image, 22, 39, 7, 16, color('#2E8A38'));
  fillRect(image, 35, 39, 7, 16, color('#2E8A38'));
  fillRect(image, 18, 30, 28, 21, color('#3BBF4B'));
  blockFace(image, 14, 8, 36, '#51D65E', '#2E8A38', '#07120A', '#07120A');
  fillRect(image, 27, 28, 10, 15, color('#07120A'));
  fillRect(image, 21, 35, 8, 8, color('#07120A'));
  fillRect(image, 35, 35, 8, 8, color('#07120A'));
  return image;
}

function skeleton() {
  const image = humanoid({
    head: '#E1E0D2',
    shade: '#A7A899',
    body: '#C9C8BA',
    eye: '#151515',
    accent: '#FFFFFF',
  });
  fillRect(image, 25, 36, 14, 3, color('#808174'));
  fillRect(image, 28, 42, 8, 3, color('#808174'));
  return image;
}

function spider() {
  const image = characterCanvas();
  fillRect(image, 12, 29, 40, 18, color('#1C1730'));
  fillRect(image, 16, 24, 32, 17, color('#2B2148'));
  fillRect(image, 21, 28, 7, 6, color('#E12E39'));
  fillRect(image, 36, 28, 7, 6, color('#E12E39'));
  for (const y of [28, 36, 44]) {
    drawLine(image, 17, y, 4, y - 8, 4, color('#161126'));
    drawLine(image, 47, y, 60, y - 8, 4, color('#161126'));
  }
  return image;
}

function piglin(zombified = false) {
  const image = humanoid({
    head: zombified ? '#D0848D' : '#E0A09A',
    shade: zombified ? '#5C8F6A' : '#9C655F',
    body: zombified ? '#5C8F6A' : '#8B5F3E',
    eye: '#151515',
    accent: zombified ? '#97E0A0' : '#F2C1BA',
    mouth: '#5B2F2F',
  });
  fillRect(image, 25, 30, 14, 8, color(zombified ? '#7BCB82' : '#C77D75'));
  fillRect(image, 27, 32, 3, 3, color('#2A1717'));
  fillRect(image, 34, 32, 3, 3, color('#2A1717'));
  return image;
}

function enderman() {
  const image = characterCanvas();
  fillRect(image, 20, 34, 8, 25, color('#090912'));
  fillRect(image, 36, 34, 8, 25, color('#090912'));
  fillRect(image, 15, 24, 7, 28, color('#0B0A14'));
  fillRect(image, 42, 24, 7, 28, color('#0B0A14'));
  fillRect(image, 20, 24, 24, 30, color('#0D0B17'));
  fillRect(image, 15, 6, 34, 28, color('#0A0812'));
  fillRect(image, 21, 18, 10, 4, color('#B461FF'));
  fillRect(image, 34, 18, 10, 4, color('#B461FF'));
  return image;
}

function ironGolem() {
  const image = characterCanvas();
  fillRect(image, 15, 31, 34, 24, color('#CBC7B8'));
  fillRect(image, 10, 29, 9, 21, color('#AAA798'));
  fillRect(image, 45, 29, 9, 21, color('#AAA798'));
  blockFace(image, 14, 8, 36, '#D8D3C4', '#98958A', '#141414', '#8F3E3B');
  fillRect(image, 18, 42, 28, 5, color('#75A65F'));
  return image;
}

function warden() {
  const image = characterCanvas();
  fillRect(image, 16, 28, 32, 27, color('#17272A'));
  fillRect(image, 10, 16, 9, 21, color('#39A6A8'));
  fillRect(image, 45, 16, 9, 21, color('#39A6A8'));
  blockFace(image, 15, 7, 34, '#1A3033', '#0C181A', '#77F8FF', '#77F8FF');
  fillRect(image, 24, 33, 16, 12, color('#3BE2E5'));
  fillRect(image, 28, 36, 8, 6, color('#0C181A'));
  return image;
}

function enderDragon() {
  const image = characterCanvas();
  fillRect(image, 6, 22, 19, 24, color('#1B1730'));
  fillRect(image, 39, 22, 19, 24, color('#1B1730'));
  drawLine(image, 14, 24, 3, 11, 5, color('#2D2548'));
  drawLine(image, 50, 24, 61, 11, 5, color('#2D2548'));
  fillRect(image, 18, 28, 28, 21, color('#171226'));
  blockFace(image, 16, 8, 32, '#221A38', '#0D0A16', '#D66BFF', '#D66BFF');
  fillRect(image, 12, 7, 6, 9, color('#E7E4EF'));
  fillRect(image, 46, 7, 6, 9, color('#E7E4EF'));
  return image;
}

function ghostFace() {
  const image = createImage(512, 512);
  fill(image, color('#000000', 0));
  fillEllipse(image, 256, 273, 188, 190, color('#020506', 116));
  fillEllipse(image, 256, 242, 154, 164, color('#EFF6ED', 238));
  fillEllipse(image, 214, 210, 92, 122, color('#FFFFFF', 205));
  fillEllipse(image, 311, 224, 78, 116, color('#CAD6CE', 150));
  fillRect(image, 115, 286, 282, 90, color('#EFF6ED', 232));
  fillRect(image, 115, 370, 38, 58, color('#EFF6ED', 230));
  fillRect(image, 187, 370, 42, 78, color('#EFF6ED', 228));
  fillRect(image, 265, 370, 42, 74, color('#EFF6ED', 224));
  fillRect(image, 352, 370, 45, 56, color('#EFF6ED', 220));
  fillRect(image, 141, 420, 47, 23, color('#C7D4CC', 170));
  fillRect(image, 230, 432, 36, 24, color('#C7D4CC', 160));
  fillRect(image, 311, 424, 43, 25, color('#C7D4CC', 150));
  fillEllipse(image, 197, 214, 40, 50, color('#111719', 230));
  fillEllipse(image, 315, 214, 40, 50, color('#111719', 230));
  fillEllipse(image, 184, 196, 12, 16, color('#DFFFF4', 130));
  fillEllipse(image, 302, 196, 12, 16, color('#DFFFF4', 120));
  fillEllipse(image, 256, 305, 58, 54, color('#111719', 230));
  fillEllipse(image, 256, 293, 32, 25, color('#2A3838', 126));
  fillRect(image, 153, 154, 74, 11, color('#C1CBC4', 125));
  fillRect(image, 284, 154, 74, 11, color('#A9B6AE', 112));
  drawLine(image, 145, 286, 114, 330, 5, color('#B4C0B8', 110));
  drawLine(image, 368, 286, 403, 330, 5, color('#A7B4AC', 102));
  drawLine(image, 174, 342, 206, 358, 4, color('#B8C5BD', 112));
  drawLine(image, 338, 342, 304, 358, 4, color('#A8B5AD', 104));
  drawLine(image, 235, 100, 222, 156, 3, color('#DDE7DF', 120));
  drawLine(image, 337, 119, 318, 162, 3, color('#B8C6BD', 105));
  for (let index = 0; index < 56; index += 1) {
    const x = 132 + Math.floor(pseudoNoise(index, 3, 91) * 248);
    const y = 102 + Math.floor(pseudoNoise(index, 7, 97) * 268);
    const alpha = 16 + Math.floor(pseudoNoise(index, 11, 101) * 34);
    fillCircle(image, x, y, 1 + Math.floor(pseudoNoise(index, 13, 103) * 2), color('#17201C', alpha));
  }
  fillEllipse(image, 256, 462, 160, 20, color('#000000', 86));
  return image;
}

function iconBackground(size) {
  const image = createImage(size, size);
  const base = color('#08101F');
  const accent = color('#1F314E');
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = pseudoNoise(x, y, 71);
      const mix = 0.08 + n * 0.22;
      setPixel(image, x, y, [
        Math.round(base[0] + (accent[0] - base[0]) * mix),
        Math.round(base[1] + (accent[1] - base[1]) * mix),
        Math.round(base[2] + (accent[2] - base[2]) * mix),
        255,
      ]);
    }
  }
  return image;
}

function drawIconMaze(image, monochrome = false) {
  const size = image.width;
  const cell = Math.floor(size / 12);
  const startX = Math.floor((size - cell * 9) / 2);
  const startY = Math.floor((size - cell * 9) / 2);
  const maze = [
    '#########',
    '#...#...#',
    '#.#.#.#.#',
    '#.#...#.#',
    '#.#####.#',
    '#...#...#',
    '###.#.#.#',
    '#...#...#',
    '#########',
  ];
  const wall = monochrome ? color('#FFFFFF') : color('#677AA8');
  const floor = monochrome ? color('#000000', 0) : color('#111B2D');
  const route = monochrome ? color('#FFFFFF') : color('#39E7C3');
  fillRect(image, startX - cell, startY - cell, cell * 11, cell * 11, monochrome ? color('#000000', 0) : color('#060B16', 210));
  maze.forEach((row, rowIndex) => {
    [...row].forEach((tile, colIndex) => {
      const x = startX + colIndex * cell;
      const y = startY + rowIndex * cell;
      fillRect(image, x, y, cell - 2, cell - 2, tile === '#' ? wall : floor);
    });
  });
  drawLine(image, startX + cell * 1.5, startY + cell * 1.5, startX + cell * 7.5, startY + cell * 7.5, Math.floor(cell * 0.28), route);
  fillCircle(image, startX + cell * 3.5, startY + cell * 6.5, Math.floor(cell * 0.2), monochrome ? color('#FFFFFF') : color('#FFD447'));
}

function appIcon(size, monochrome = false) {
  const image = monochrome ? createImage(size, size) : iconBackground(size);
  if (monochrome) {
    fill(image, color('#000000', 0));
  }
  drawIconMaze(image, monochrome);
  return image;
}

writePng(join(rootDir, 'assets/tiles/floor.png'), floorTile());
writePng(join(rootDir, 'assets/tiles/wall.png'), wallTile());
writePng(join(rootDir, 'assets/tiles/coin.png'), coinTile());
writePng(join(rootDir, 'assets/tiles/exit.png'), exitTile());
writePng(join(rootDir, 'assets/tiles/grave.png'), graveTile());
writePng(join(rootDir, 'assets/tiles/spider-web.png'), spiderWebTile());
writePng(join(rootDir, 'assets/characters/zombie.png'), zombie());
writePng(join(rootDir, 'assets/characters/creeper.png'), creeper());
writePng(join(rootDir, 'assets/characters/skeleton.png'), skeleton());
writePng(join(rootDir, 'assets/characters/spider.png'), spider());
writePng(join(rootDir, 'assets/characters/zombie-piglin.png'), piglin(true));
writePng(join(rootDir, 'assets/characters/piglin.png'), piglin(false));
writePng(join(rootDir, 'assets/characters/enderman.png'), enderman());
writePng(join(rootDir, 'assets/characters/iron-golem.png'), ironGolem());
writePng(join(rootDir, 'assets/characters/warden.png'), warden());
writePng(join(rootDir, 'assets/characters/ender-dragon.png'), enderDragon());
writePng(join(rootDir, 'assets/effects/ghost-face.png'), ghostFace());
writePng(join(rootDir, 'assets/icon.png'), appIcon(1024));
writePng(join(rootDir, 'assets/favicon.png'), appIcon(256));
writePng(join(rootDir, 'assets/splash-icon.png'), appIcon(1024, true));
writePng(join(rootDir, 'assets/android-icon-background.png'), iconBackground(1024));
writePng(join(rootDir, 'assets/android-icon-foreground.png'), appIcon(1024, true));
writePng(join(rootDir, 'assets/android-icon-monochrome.png'), appIcon(432, true));
