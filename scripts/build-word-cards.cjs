/**
 * Builds the lesson word pictures from the Lin Go Gold flashcard sheets.
 *
 * The 19 source sheets live outside the repo (they are large scans). Drop them in
 * `WORD_SHEETS_DIR` and run `node scripts/build-word-cards.cjs` to regenerate
 * `public/images/words/*.webp` — the crop boxes below are measured against the
 * 700 px wide reference layout of each sheet.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SHEETS_DIR = process.env.WORD_SHEETS_DIR
  || 'C:/Users/hmach/OneDrive/Desktop/مجلد جديد';
const OUT_DIR = path.join(__dirname, '..', 'public', 'images', 'words');
const REF_W = 700;

// Reference sheet order = sorted file names in the folder.
const SHEETS = [
  { refH: 1244, cols: [55, 365], cw: 270, rows: [200, 395, 595, 785, 985], ch: 180,
    words: [['red', 'blue'], ['green', 'yellow'], ['pink', 'orange'], ['purple', 'black'], ['white', 'brown']] },
  { refH: 1244, cols: [45, 361], cw: 293, rows: [202, 400, 595, 794, 995], ch: 180,
    words: [['fish', 'shark'], ['whale', 'dolphin'], ['octopus', 'crab'], ['turtle', 'starfish'], ['jellyfish', 'seahorse']] },
  { refH: 1244, cols: [55, 370], cw: 275, rows: [220, 410, 600, 795, 990], ch: 175,
    words: [['ball', 'doll'], ['kite', 'puzzle'], ['teddy-bear', 'football'], ['basketball', 'tennis'], ['bicycle', 'swing']] },
  { refH: 1244, cols: [60, 370], cw: 265, rows: [200, 405, 600, 795, 995], ch: 180,
    words: [['bread', 'rice'], ['milk', 'cheese'], ['egg', 'roast-chicken'], ['fish', 'soup'], ['salad', 'cake']] },
  { refH: 1244, cols: [45, 258, 470], cw: 190, rows: [210, 450, 690, 930], ch: 215,
    words: [['head', 'eye', 'eye'], ['nose', 'mouth', 'mouth'], ['ear', 'hand', 'foot'], ['leg', 'leg', 'tooth']] },
  { refH: 1244, cols: [55, 365], cw: 275, rows: [205, 465, 715, 965], ch: 220,
    words: [['bee', 'ant'], ['butterfly', 'fly'], ['mosquito', 'spider'], ['worm', 'ladybug']] },
  { refH: 1244, cols: [50, 370], cw: 290, rows: [175, 390, 595, 800, 1005], ch: 195,
    words: [['shirt', 'pants'], ['dress', 'shoes'], ['hat', 'jacket'], ['socks', 'gloves'], ['scarf', 'skirt']] },
  { refH: 1244, cols: [50, 370], cw: 300, rows: [240, 480, 720, 960], ch: 215,
    words: [['plate', 'cup'], ['spoon', 'fork'], ['knife', 'pot'], ['pan', 'fridge']] },
  { refH: 1244, cols: [58, 371], cw: 270, rows: [160, 331, 486, 630, 757, 890, 1043], ch: 138, band: [0.26, 0.71], bands: { 3: [0.26, 0.62], 4: [0.26, 0.63] },
    words: [['pencil', 'pen'], ['pencil-case', 'crayon'], ['book', 'notebook'], ['ruler', 'sharpener'], ['scissors', 'school-bag'], ['eraser', 'glue'], ['desk', 'chair']] },
  { refH: 1244, cols: [45, 365], cw: 285, rows: [205, 400, 600, 795, 990], ch: 185,
    words: [['teacher', 'doctor'], ['farmer', 'cook'], ['driver', 'police'], ['firefighter', 'pilot'], ['nurse', 'painter']] },
  { refH: 1244, cols: [40, 203, 365, 528], cw: 130, rows: [195, 400, 605, 803, 1005], ch: 150,
    words: [['bed', 'table', 'table', 'chair'], ['chair', 'desk', 'window', 'door'], ['bedroom', 'window', 'living-room', 'living-room'], ['kitchen', 'kitchen', 'bathroom', 'bathroom'], ['garden', 'lamp', 'rug', 'mirror']] },
  { refH: 1244, cols: [35, 390], cw: 285, rows: [165, 395, 620, 815, 1000], ch: 200,
    words: [['car', 'bus'], ['taxi', 'truck'], ['ambulance', 'police-car'], ['fire-truck', 'motorcycle'], ['bicycle', 'train']] },
  { refH: 1244, cols: [55, 375], cw: 270, rows: [175, 386, 592, 801, 1016], ch: 180, band: [0.24, 0.70], wordBands: { orange: [0.24, 0.56] },
    words: [['apple', 'banana'], ['orange', 'grape'], ['strawberry', 'mango'], ['lemon', 'pear'], ['watermelon', 'peach']] },
  { refH: 1244, cols: [20, 194, 361, 529], cw: 140, rows: [315, 765], ch: 370,
    words: [['water', 'milk', 'juice', 'tea'], ['coffee', 'lemonade', 'soda', 'hot-chocolate']], band: [0.09, 0.82] },
  { refH: 1244, cols: [45, 365], cw: 290, rows: [198, 405, 582, 758, 972], ch: 170, band: [0.22, 0.72],
    words: [['happy', 'sad'], ['angry', 'scared'], ['tired', 'hungry'], ['thirsty', 'excited'], ['shy', 'brave']] },
  { refH: 1244, cols: [45, 465], cw: 190, rows: [235, 440, 610, 800, 985], ch: 180,
    words: [['carrot', 'potato'], ['tomato', 'onion'], ['cucumber', 'lettuce'], ['pepper', 'cabbage'], ['corn', 'pea']] },
  { refH: 1244, cols: [55, 370], cw: 275, rows: [200, 450, 695, 940], ch: 220,
    words: [['bird', 'roast-chicken'], ['rubber-duck', 'pigeon'], ['sparrow', 'owl'], ['eagle', 'parrot']] },
  { refH: 933, photos: [
    { y: 188, h: 88, boxes: [[15, 88, 'read'], [132, 92, 'write'], [250, 93, 'clean'], [372, 92, 'clap'], [490, 88, 'draw'], [592, 96, 'sit-down']] },
    { y: 318, h: 78, boxes: [[18, 95, 'color'], [155, 90, 'raise-your-hand'], [285, 95, 'open-your-book'], [425, 95, 'close-your-book'], [580, 93, 'stand-up']] },
  ] },
  { refH: 1244, cols: [20, 195, 355, 520], cw: 148, rows: [175, 425, 680, 935], ch: 235,
    words: [['dog', 'cat', 'cow', 'horse'], ['sheep', 'goat', 'chicken', 'duck'], ['lion', 'tiger', 'elephant', 'monkey'], ['bear', 'rabbit', 'fish', 'bird']] },
];

const OUT_SIDE = 448;
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

function components(mask, w, h) {
  const labels = new Int32Array(w * h).fill(-1);
  const out = [];
  const stack = [];
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i] || labels[i] !== -1) continue;
    const id = out.length;
    let area = 0; let minX = w; let minY = h; let maxX = -1; let maxY = -1;
    labels[i] = id; stack.push(i);
    while (stack.length) {
      const p = stack.pop();
      const x = p % w; const y = (p - x) / w;
      area += 1;
      if (x < minX) minX = x; if (y < minY) minY = y;
      if (x > maxX) maxX = x; if (y > maxY) maxY = y;
      if (x > 0 && mask[p - 1] && labels[p - 1] === -1) { labels[p - 1] = id; stack.push(p - 1); }
      if (x < w - 1 && mask[p + 1] && labels[p + 1] === -1) { labels[p + 1] = id; stack.push(p + 1); }
      if (y > 0 && mask[p - w] && labels[p - w] === -1) { labels[p - w] = id; stack.push(p - w); }
      if (y < h - 1 && mask[p + w] && labels[p + w] === -1) { labels[p + w] = id; stack.push(p + w); }
    }
    out.push({ area, minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 });
  }
  return out;
}

/** Largest non-line artwork component inside the given window, in window coordinates. */
function trimArt(data, winW, winH, channels) {
  // Card background = dominant colour in the window (cream paper, white card, ...).
  const counts = new Map();
  for (let i = 0; i < winW * winH; i += 7) {
    const o = i * channels;
    const key = `${data[o] >> 3},${data[o + 1] >> 3},${data[o + 2] >> 3}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let bestKey = '';
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) { bestCount = count; bestKey = key; }
  }
  const bg = bestKey.split(',').map((v) => (Number(v) << 3) + 4);
  let mask = new Uint8Array(winW * winH);
  for (let i = 0; i < winW * winH; i += 1) {
    const o = i * channels;
    const dist = Math.max(Math.abs(data[o] - bg[0]), Math.abs(data[o + 1] - bg[1]), Math.abs(data[o + 2] - bg[2]));
    mask[i] = dist > 14 ? 1 : 0;
  }
  // Vertical opening twice: breaks the thin ruled writing lines that touch the artwork.
  for (let pass = 0; pass < 2; pass += 1) {
    const next = new Uint8Array(mask);
    for (let y = 1; y < winH - 1; y += 1) {
      for (let x = 0; x < winW; x += 1) {
        const i = y * winW + x;
        if (mask[i] && !mask[i - winW] && !mask[i + winW]) next[i] = 0;
      }
    }
    mask = next;
  }
  // Horizontal opening once: drops thin vertical frame edges.
  {
    const next = new Uint8Array(mask);
    for (let y = 0; y < winH; y += 1) {
      for (let x = 1; x < winW - 1; x += 1) {
        const i = y * winW + x;
        if (mask[i] && !mask[i - 1] && !mask[i + 1]) next[i] = 0;
      }
    }
    mask = next;
  }
  const comps = components(mask, winW, winH).filter((c) => {
    if (c.area < winW * winH * 0.0025) return false;
    if (c.w > 0.98 * winW && c.h > 0.98 * winH) return false; // frame
    if (c.h < 0.055 * winH && c.w > 0.18 * winW) return false; // ruled writing lines
    if (c.w < 0.035 * winW && c.h > 0.3 * winH) return false;
    return true;
  });
  if (!comps.length) return { box: null, bg };

  const meanColor = (c) => {
    let r = 0; let g = 0; let b = 0; let n = 0;
    const stepX = Math.max(1, Math.round(c.w / 24));
    const stepY = Math.max(1, Math.round(c.h / 24));
    for (let y = c.minY; y <= c.maxY; y += stepY) {
      for (let x = c.minX; x <= c.maxX; x += stepX) {
        const p = y * winW + x;
        if (!mask[p]) continue;
        const o = p * channels;
        r += data[o]; g += data[o + 1]; b += data[o + 2]; n += 1;
      }
    }
    if (!n) return [255, 255, 255];
    return [r / n, g / n, b / n];
  };
  // Gold banner ribbons are wide, flat and sit at the top of the card.
  const pool = comps.filter((c) => {
    const [r, g, b] = meanColor(c);
    const gold = r > 145 && g > 105 && b < 155 && r - b > 40 && g - b > 12;
    return !(gold && c.minY < 0.3 * winH && c.w > 1.8 * c.h);
  });
  if (!pool.length) return { box: null, bg };

  pool.sort((a, b) => b.area - a.area);
  const main = pool[0];
  let box = { minX: main.minX, minY: main.minY, maxX: main.maxX, maxY: main.maxY };
  for (const c of pool.slice(1)) {
    if (c.area < main.area * 0.02) continue;
    const overlapsX = c.minX <= main.maxX + main.w * 0.12 && c.maxX >= main.minX - main.w * 0.12;
    const overlapsY = c.maxY >= main.minY && c.minY <= main.maxY;
    if (overlapsX && overlapsY) {
      box = {
        minX: Math.min(box.minX, c.minX), minY: Math.min(box.minY, c.minY),
        maxX: Math.max(box.maxX, c.maxX), maxY: Math.max(box.maxY, c.maxY),
      };
    }
  }
  if (box.maxY - box.minY < winH * 0.18 || box.maxX - box.minX < winW * 0.18) {
    box = { minX: 0, minY: 0, maxX: winW - 1, maxY: winH - 1 };
  }
  return { box, bg };
}

async function buildCard(source, rect, outName) {
  const meta = await sharp(source).metadata();
  const sx = meta.width / REF_W;
  const sy = meta.height / rect.refH;

  const left = Math.max(0, Math.round(rect.x * sx));
  const top = Math.max(0, Math.round(rect.y * sy));
  const width = Math.min(meta.width - left, Math.round(rect.w * sx));
  const height = Math.min(meta.height - top, Math.round(rect.h * sy));

  const cardBuf = await sharp(source).extract({ left, top, width, height }).png().toBuffer();
  const card = await sharp(cardBuf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const C = card.info.channels;
  const cw = card.info.width;
  const ch = card.info.height;

  let winTop;
  let winLeft;
  let winW;
  let winH;
  if (rect.photo) {
    winTop = Math.round(ch * 0.03);
    winLeft = Math.round(cw * 0.03);
    winW = cw - winLeft * 2;
    winH = Math.round(ch * 0.90);
  } else if (rect.band) {
    winTop = Math.round(ch * rect.band[0]);
    winLeft = Math.round(cw * 0.05);
    winW = cw - winLeft * 2;
    winH = Math.round(ch * (rect.band[1] - rect.band[0]));
  } else {
    // Find the gold banner band at the top of the card and start below it.
    const goldFrac = new Float32Array(ch);
    for (let y = 0; y < Math.round(ch * 0.22); y += 1) {
      let gold = 0;
      for (let x = 0; x < cw; x += 1) {
        const o = (y * cw + x) * C;
        const r = card.data[o]; const g = card.data[o + 1]; const b = card.data[o + 2];
        if (r > 140 && g > 100 && b < 150 && r - b > 40 && g - b > 12) gold += 1;
      }
      goldFrac[y] = gold / cw;
    }
    let bandStart = -1;
    let bandEnd = -1;
    for (let y = 0; y < goldFrac.length; y += 1) {
      if (goldFrac[y] > 0.25) { bandStart = y; break; }
    }
    if (bandStart > -1) {
      for (let y = bandStart; y < Math.min(goldFrac.length, Math.round(ch * 0.34)); y += 1) {
        if (goldFrac[y] > 0.10) bandEnd = y;
        else if (y - bandEnd > 3) break;
      }
    }
    winTop = bandEnd > -1 ? bandEnd + Math.max(4, Math.round(ch * 0.045)) : Math.round(ch * 0.06);
    winLeft = Math.round(cw * 0.07);
    winW = Math.round(cw * 0.86);
    winH = Math.round(ch * (rect.artBottom || 0.75)) - winTop;
  }
  winW = Math.max(4, Math.min(winW, cw - winLeft - 1));
  winH = Math.max(4, Math.min(winH, ch - winTop - 1));

  const win = await sharp(cardBuf)
    .extract({ left: winLeft, top: winTop, width: winW, height: winH })
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });

  let box;
  let bg = [255, 255, 255];
  if (rect.photo) {
    box = { minX: 0, minY: 0, maxX: win.info.width - 1, maxY: win.info.height - 1 };
  } else {
    const trimmed = trimArt(win.data, win.info.width, win.info.height, win.info.channels);
    bg = trimmed.bg;
    box = trimmed.box || { minX: 0, minY: 0, maxX: win.info.width - 1, maxY: win.info.height - 1 };
  }

  const artW = Math.max(1, box.maxX - box.minX + 1);
  const artH = Math.max(1, box.maxY - box.minY + 1);
  const artBuf = await sharp(win.data, { raw: { width: win.info.width, height: win.info.height, channels: win.info.channels } })
    .extract({ left: box.minX, top: box.minY, width: artW, height: artH })
    .png().toBuffer();

  const side = Math.max(artW, artH) * 1.18;
  const scale = OUT_SIDE / side;
  const drawW = Math.max(1, Math.round(artW * scale));
  const drawH = Math.max(1, Math.round(artH * scale));
  const artScaled = await sharp(artBuf).resize(drawW, drawH, { kernel: 'lanczos3' }).png().toBuffer();

  await sharp({
    create: {
      width: OUT_SIDE,
      height: OUT_SIDE,
      channels: 3,
      background: { r: bg[0], g: bg[1], b: bg[2] },
    },
  })
    .composite([{ input: artScaled, left: Math.round((OUT_SIDE - drawW) / 2), top: Math.round((OUT_SIDE - drawH) / 2) }])
    .webp({ quality: 90, effort: 5 })
    .toFile(path.join(OUT_DIR, `${outName}.webp`));
}

(async () => {
  if (require.main !== module) return;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs.readdirSync(SHEETS_DIR).filter((f) => /\.(jpg|jpeg|png)$/i.test(f)).sort();
  if (files.length < SHEETS.length) throw new Error(`expected ${SHEETS.length} sheets, found ${files.length}`);

  let count = 0;
  const seen = new Set();
  for (let i = 0; i < SHEETS.length; i += 1) {
    const sheet = SHEETS[i];
    const source = path.join(SHEETS_DIR, files[i]);
    const jobs = [];
    if (sheet.photos) {
      for (const row of sheet.photos) {
        for (const [x, w, word] of row.boxes) {
          jobs.push({ x, y: row.y, w, h: row.h, word, refH: sheet.refH, photo: true });
        }
      }
    } else {
      sheet.words.forEach((rowWords, r) => {
        rowWords.forEach((word, c) => {
          jobs.push({
            x: sheet.cols[c],
            y: sheet.rows[r],
            w: sheet.cw,
            h: sheet.ch,
            word,
            refH: sheet.refH,
            band: (sheet.wordBands && sheet.wordBands[word]) || (sheet.bands && sheet.bands[r]) || sheet.band,
            artBottom: sheet.artBottom,
          });
        });
      });
    }
    for (const job of jobs) {
      if (seen.has(job.word)) continue;
      seen.add(job.word);
      await buildCard(source, job, job.word);
      count += 1;
    }
    console.log(`sheet ${i}: ${jobs.length} cards`);
  }
  console.log(`done: ${count} word pictures in ${OUT_DIR}`);
})();

module.exports = { SHEETS };

