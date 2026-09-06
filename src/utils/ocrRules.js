import { createWorker } from "tesseract.js";

export async function runOCR(imageFile, onProgress) {
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (onProgress && m.status === "recognizing text") {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const { data } = await worker.recognize(imageFile);
  await worker.terminate();

  const rawText = data.text || "";
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return { rawText, lines };
}

/* ───────────── Search current + adjacent lines for a field's value ───────────── */

function findNearValue(lines, labelRegex, valueRegex, options = {}) {
  const excludeRegex = options.exclude || null;

  for (let i = 0; i < lines.length; i++) {
    if (excludeRegex && excludeRegex.test(lines[i])) continue;
    if (!labelRegex.test(lines[i])) continue;

    const candidates = [lines[i], lines[i + 1], lines[i - 1]].filter(Boolean);

    for (const line of candidates) {
      const match = line.match(valueRegex);
      if (match) {
        return match;
      }
    }
  }
  return null;
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
  const valueRegex = /(?:by|for)?\s*[:\-]?\s*([A-Za-z][A-Za-z0-9&.,\s]{5,60})/i;

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
  const valueRegex = /(\d+(?:\.\d+)?)\s*(g|kg|ml|l|gm|litre|liter)\b/i;

  const match = findNearValue(rows, labelRegex, valueRegex);
  if (match) {
    return { found: true, value: `${match[1]} ${match[2]}`, confidence: "high", rule: "Rule 6(1)(c)" };
  }

  const fallbackMatch = fallbackText.match(
    /Net\s*(?:Qty|Quantity|Wt\.?|Weight)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|kg|ml|l|gm|litre|liter)/i
  );
  if (fallbackMatch) {
    return { found: true, value: `${fallbackMatch[1]} ${fallbackMatch[2]}`, confidence: "medium", rule: "Rule 6(1)(c)" };
  }

  return { found: false, value: null, confidence: "none", rule: "Rule 6(1)(c)" };
}

/* ───────────── Rule 6(1)(e) — Month & Year of Manufacture/Packing ───────────── */

function detectDate(rows, fallbackText) {
  const labelRegex = /date/i;
  const excludeRegex = /use\s*by|exp|best\s*before/i;
  const valueRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}[\/\-]\d{4})/;

  const match = findNearValue(rows, labelRegex, valueRegex, { exclude: excludeRegex });
  if (match) {
    return { found: true, value: match[1], confidence: "high", rule: "Rule 6(1)(e)" };
  }

  const fallbackMatch = fallbackText.match(
    /(?:Mfg|Mfd|Packed|Packing)\.?\s*(?:Date|On)?\s*[:\-]?\s*(\d{1,2}[\/\-]\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
  );
  if (fallbackMatch) {
    return { found: true, value: fallbackMatch[1], confidence: "medium", rule: "Rule 6(1)(e)" };
  }

  return { found: false, value: null, confidence: "none", rule: "Rule 6(1)(e)" };
}

/* ───────────── Rule 6(1)(f) — Retail Sale Price (MRP, incl. of taxes) ───────────── */

function detectMRP(rows, fallbackText) {
  const labelRegex = /M\.?R\.?P\.?/i;
  const valueRegex = /(?:Rs\.?|₹|INR)\s*(\d+(?:[.,]\d{1,2})?)/i;

  const inclusiveOfTaxes = /inclusive\s*of\s*(?:all\s*)?taxes|incl\.?\s*of\s*(?:all\s*)?tax/i.test(fallbackText);

  const match = findNearValue(rows, labelRegex, valueRegex);
  if (match) {
    return {
      found: true,
      value: `₹${match[1]}${inclusiveOfTaxes ? " (incl. of taxes)" : ""}`,
      confidence: inclusiveOfTaxes ? "high" : "medium",
      rule: "Rule 6(1)(f)",
      warning: !inclusiveOfTaxes ? '"Inclusive of all taxes" wording not detected alongside MRP' : null,
    };
  }

  const fallbackMatch = fallbackText.match(
    /M\.?R\.?P\.?\s*[:\-]?\s*(?:Rs\.?|₹|INR)?\s*(\d+(?:[.,]\d{1,2})?)/i
  );
  if (fallbackMatch) {
    return {
      found: true,
      value: `₹${fallbackMatch[1]}${inclusiveOfTaxes ? " (incl. of taxes)" : ""}`,
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