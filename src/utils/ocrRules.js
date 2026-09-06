import { createWorker } from "tesseract.js";

/* ─────────────────────────────────────────────────────────
   IMAGE PREPROCESSING — this is the single biggest lever for
   OCR accuracy on phone photos of shiny/curved packaging:
   - grayscale
   - contrast boost
   - upscale small images (tiny text needs more pixels)
   ───────────────────────────────────────────────────────── */

async function preprocessImage(file) {
  const imgUrl = URL.createObjectURL(file);

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = imgUrl;
  });

  const MAX_DIM = 2200;
  let { width, height } = img;

  // Upscale small/medium photos (helps Tesseract read small print),
  // but cap so huge phone photos don't blow up memory/time.
  let scale = 1;
  if (Math.max(width, height) < 1600) {
    scale = 1.6;
  }
  scale = Math.min(scale, MAX_DIM / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // grayscale
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // contrast stretch around midpoint — makes printed text pop against background
    let val = (gray - 128) * 1.4 + 128;
    val = Math.max(0, Math.min(255, val));
    data[i] = data[i + 1] = data[i + 2] = val;
  }

  ctx.putImageData(imageData, 0, 0);
  URL.revokeObjectURL(imgUrl);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
}

export async function runOCR(imageFile, onProgress) {
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (onProgress && m.status === "recognizing text") {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  // Auto page segmentation handles mixed layouts (front-of-pack + tables) best.
  await worker.setParameters({
    tessedit_pageseg_mode: "3", // PSM.AUTO
  });

  const processedBlob = await preprocessImage(imageFile);
  const { data } = await worker.recognize(processedBlob);
  await worker.terminate();

  const rawText = data.text || "";
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return { rawText, lines };
}

/* ───────────── OCR digit-confusion cleanup ─────────────
   Tesseract commonly confuses O/0, l/I/1, S/5 in printed
   numbers on packaging. Only applied to captures we already
   know SHOULD be numeric (price, quantity), so it's safe. */

function normalizeOcrDigits(str) {
  return str
    .replace(/[oO]/g, "0")
    .replace(/[lI]/g, "1")
    .replace(/[Ss](?=\d|$)/g, "5");
}

/* ───────────── Search current + adjacent lines for a field's value ───────────── */

function findNearValue(lines, labelRegex, valueRegex, options = {}) {
  const excludeRegex = options.exclude || null;
  // NEW: optional validate(match) => bool. If a match fails validation
  // (e.g. an implausible date), keep searching instead of accepting it.
  const validate = options.validate || (() => true);

  for (let i = 0; i < lines.length; i++) {
    if (excludeRegex && excludeRegex.test(lines[i])) continue;
    if (!labelRegex.test(lines[i])) continue;

    // FIX: strip the label text out of the current line first, so the value
    // regex can't accidentally match part of the label itself as the value.
    const sameLineRemainder = lines[i].replace(labelRegex, " ").trim();

    const candidates = [sameLineRemainder, lines[i + 1], lines[i - 1]].filter(Boolean);

    for (const line of candidates) {
      const match = line.match(valueRegex);
      if (match && validate(match)) {
        return match;
      }
    }
  }
  return null;
}

/* Rejects OCR "dates" that can't be real — e.g. a license/batch number that
   happens to look like d/d/dd but resolves to an impossible or absurd date. */
function isPlausibleDate(str) {
  const monthMap = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  const currentYear = new Date().getFullYear();

  const textMatch = str.match(new RegExp(`(${Object.keys(monthMap).join("|")})[a-z]*\\.?\\s*'?(\\d{2,4})`, "i"));
  if (textMatch) {
    let year = parseInt(textMatch[2], 10);
    if (year < 100) year += 2000;
    return year >= 2015 && year <= currentYear + 1;
  }

  const parts = str.split(/[\/\-]/).map((p) => parseInt(p, 10));
  if (parts.length === 3) {
    const [d, m, yRaw] = parts;
    let y = yRaw;
    if (y < 100) y += 2000;
    if (Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(y)) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    if (y < 2015 || y > currentYear + 1) return false;
    return true;
  }
  if (parts.length === 2) {
    const [m, yRaw] = parts;
    let y = yRaw;
    if (y < 100) y += 2000;
    if (Number.isNaN(m) || Number.isNaN(y)) return false;
    if (m < 1 || m > 12) return false;
    if (y < 2015 || y > currentYear + 1) return false;
    return true;
  }
  return false;
}

export function extractDeclarations({ rawText, lines }) {
  const text = (rawText || "").replace(/\s+/g, " ").trim();
  const rows = lines || [];

  return {
    manufacturer: detectManufacturer(rows, text),
    genericName: detectGenericName(text),
    netQuantity: detectNetQuantity(rows, text),
    mfgDate: detectDate(rows, text),
    mrp: detectMRP(rows, text),
    consumerCare: detectConsumerCare(text),
    countryOfOrigin: detectCountryOfOrigin(rows, text),
  };
}

/* ───────────── Garbage-match filter ───────────── */

const COMMON_WORDS = new Set([
  "and", "for", "the", "with", "from", "see", "below", "above",
  "net", "wt", "no", "date", "best", "before", "use", "by",
  "made", "product", "origin", "country", "of", "packed", "manufactured",
]);

function isLikelyGarbage(value) {
  const cleaned = value.trim();
  if (cleaned.replace(/[^A-Za-z0-9]/g, "").length < 4) return true;
  const lower = cleaned.toLowerCase();
  if (COMMON_WORDS.has(lower)) return true;
  if (!/[A-Za-z]{3,}/.test(cleaned)) return true;
  return false;
}

/* ───────────── Rule 6(1)(a) — Manufacturer/Packer/Importer ───────────── */

function detectManufacturer(rows, fallbackText) {
  const labelRegex = /(anufactur|marketed|packed\s*by|imported\s*by|mfd\s*by)/i;
  // FIX: value regex no longer needs an optional "by/for" prefix, since
  // findNearValue already strips the label (incl. "by"/"for") before this runs.
  const valueRegex = /([A-Za-z][A-Za-z0-9&.,\s]{5,60})/i;

  const match = findNearValue(rows, labelRegex, valueRegex);
  if (match) {
    const value = match[1].trim().split(/\s{2,}/)[0];
    if (!isLikelyGarbage(value)) {
      return { found: true, value, confidence: "medium", rule: "Rule 6(1)(a)" };
    }
  }

  const fallbackMatch = fallbackText.match(
    /(?:Manufactured|Mfd|Marketed|Packed|Imported)\s*(?:by|for)?\s*[:\-]?\s*([A-Za-z0-9&.,\s]{5,60})/i
  );
  if (fallbackMatch) {
    const value = fallbackMatch[1].trim().split(/\s{2,}/)[0];
    if (!isLikelyGarbage(value)) {
      return { found: true, value, confidence: "medium", rule: "Rule 6(1)(a)" };
    }
  }

  return { found: false, value: null, confidence: "none", rule: "Rule 6(1)(a)" };
}

/* ───────────── Rule 6(1)(b) — Common/Generic Name ───────────── */

function detectGenericName(text) {
  const knownTypes = /(chips|namkeen|biscuit|rice|atta|flour|oil|soap|shampoo|detergent|tea|coffee|salt|snack|noodles|juice|drink)/i;
  const match = text.match(knownTypes);

  if (match) {
    return { found: true, value: match[1], confidence: "low", rule: "Rule 6(1)(b)" };
  }

  return { found: false, value: null, confidence: "none", rule: "Rule 6(1)(b)" };
}

/* ───────────── Rule 6(1)(c) — Net Quantity ───────────── */

function detectNetQuantity(rows, fallbackText) {
  const labelRegex = /quantity|net\s*wt/i;
  // FIX: tolerate OCR digit confusion (O/l/I/S <-> 0/1/5), normalize after match.
  const valueRegex = /([0-9oOlIsS]+(?:[.,][0-9oOlIsS]+)?)\s*(g|kg|ml|l|gm|litre|liter)\b/i;

  const match = findNearValue(rows, labelRegex, valueRegex);
  if (match) {
    const num = normalizeOcrDigits(match[1]);
    return { found: true, value: `${num} ${match[2]}`, confidence: "high", rule: "Rule 6(1)(c)" };
  }

  const fallbackMatch = fallbackText.match(
    /Net\s*(?:Qty|Quantity|Wt\.?|Weight)\s*[:\-]?\s*([0-9oOlIsS]+(?:[.,][0-9oOlIsS]+)?)\s*(g|kg|ml|l|gm|litre|liter)/i
  );
  if (fallbackMatch) {
    const num = normalizeOcrDigits(fallbackMatch[1]);
    return { found: true, value: `${num} ${fallbackMatch[2]}`, confidence: "medium", rule: "Rule 6(1)(c)" };
  }

  return { found: false, value: null, confidence: "none", rule: "Rule 6(1)(c)" };
}

/* ───────────── Rule 6(1)(e) — Month & Year of Manufacture/Packing ───────────── */

const MONTH_NAMES = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";

function detectDate(rows, fallbackText) {
  const labelRegex = /date/i;
  const excludeRegex = /use\s*by|exp|best\s*before/i;
  // Numeric OR textual-month formats, e.g. "01/2026", "05-2026", "JAN 2026", "JAN'26"
  const valueRegex = new RegExp(
    `(\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4}|\\d{1,2}[\\/\\-]\\d{4}|(?:${MONTH_NAMES})[a-z]*\\.?\\s*'?\\d{2,4})`,
    "i"
  );

  const match = findNearValue(rows, labelRegex, valueRegex, {
    exclude: excludeRegex,
    validate: (m) => isPlausibleDate(m[1]),
  });
  if (match) {
    return { found: true, value: match[1], confidence: "high", rule: "Rule 6(1)(e)" };
  }

  const fallbackMatch = fallbackText.match(
    new RegExp(
      `(?:Mfg|Mfd|Packed|Packing)\\.?\\s*(?:Date|On)?\\s*[:\\-]?\\s*(\\d{1,2}[\\/\\-]\\d{4}|\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4}|(?:${MONTH_NAMES})[a-z]*\\.?\\s*'?\\d{2,4})`,
      "i"
    )
  );
  if (fallbackMatch && isPlausibleDate(fallbackMatch[1])) {
    return { found: true, value: fallbackMatch[1], confidence: "medium", rule: "Rule 6(1)(e)" };
  }

  return { found: false, value: null, confidence: "none", rule: "Rule 6(1)(e)" };
}

/* ───────────── Rule 6(1)(f) — Retail Sale Price (MRP, incl. of taxes) ───────────── */

function detectMRP(rows, fallbackText) {
  const labelRegex = /M\.?R\.?P\.?/i;
  // FIX: currency symbol is now optional — Tesseract very often fails to read
  // ₹ correctly, which was causing MRP to be missed entirely even when the
  // number was clearly printed right next to "MRP".
  const valueRegex = /(?:Rs\.?|₹|INR)?\s*[:\-]?\s*([0-9oOlIsS]{1,6}(?:[.,][0-9oOlIsS]{1,2})?)\s*\/?-?/i;

  const inclusiveOfTaxes = /inclusive\s*of\s*(?:all\s*)?taxes|incl\.?\s*of\s*(?:all\s*)?tax/i.test(fallbackText);

  const match = findNearValue(rows, labelRegex, valueRegex);
  if (match) {
    const amount = normalizeOcrDigits(match[1]);
    return {
      found: true,
      value: `₹${amount}${inclusiveOfTaxes ? " (incl. of taxes)" : ""}`,
      confidence: inclusiveOfTaxes ? "high" : "medium",
      rule: "Rule 6(1)(f)",
      warning: !inclusiveOfTaxes ? '"Inclusive of all taxes" wording not detected alongside MRP' : null,
    };
  }

  const fallbackMatch = fallbackText.match(
    /M\.?R\.?P\.?\s*[:\-]?\s*(?:Rs\.?|₹|INR)?\s*([0-9oOlIsS]{1,6}(?:[.,][0-9oOlIsS]{1,2})?)/i
  );
  if (fallbackMatch) {
    const amount = normalizeOcrDigits(fallbackMatch[1]);
    return {
      found: true,
      value: `₹${amount}${inclusiveOfTaxes ? " (incl. of taxes)" : ""}`,
      confidence: inclusiveOfTaxes ? "high" : "medium",
      rule: "Rule 6(1)(f)",
      warning: !inclusiveOfTaxes ? '"Inclusive of all taxes" wording not detected alongside MRP' : null,
    };
  }

  return { found: false, value: null, confidence: "none", rule: "Rule 6(1)(f)" };
}

/* ───────────── Rule 6(1)(g) — Consumer Care Details ───────────── */

function detectConsumerCare(text) {
  const phone = text.match(/\b[6-9]\d{9}\b/);
  const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const keyword = /consumer\s*care|customer\s*care|toll[\s-]?free|call\s*us|e-?mail\s*us/i.test(text);

  if (phone || email || keyword) {
    return {
      found: true,
      value: phone ? phone[0] : email ? email[0] : "Mentioned on label",
      confidence: phone || email ? "high" : "low",
      rule: "Rule 6(1)(g)",
    };
  }
  return { found: false, value: null, confidence: "none", rule: "Rule 6(1)(g)" };
}

/* ───────────── Rule 6(1) — Country of Origin (imported products only) ───────────── */

function detectCountryOfOrigin(rows, fallbackText) {
  const labelRegex = /country\s*of\s*origin|made\s*in|product\s*of/i;
  const valueRegex = /([A-Za-z]{3,20})/;

  const match = findNearValue(rows, labelRegex, valueRegex);
  if (match && !isLikelyGarbage(match[1])) {
    return { found: true, value: match[1].trim(), confidence: "medium", rule: "Rule 6(1) — Country of Origin" };
  }

  const fallbackMatch = fallbackText.match(
    /(?:Country\s*of\s*Origin|Made\s*in|Product\s*of)\s*[:\-]?\s*([A-Za-z\s]{3,30})/i
  );
  if (fallbackMatch) {
    const value = fallbackMatch[1].trim().split(/\s{2,}/)[0];
    if (!isLikelyGarbage(value)) {
      return { found: true, value, confidence: "medium", rule: "Rule 6(1) — Country of Origin" };
    }
  }

  return { found: false, value: null, confidence: "none", rule: "Rule 6(1) — Country of Origin" };
}