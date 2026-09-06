import jsPDF from "jspdf";

// Converts a blob/object URL image into a base64 data URL that jsPDF can embed
function loadImageAsDataUrl(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      try {
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } catch (err) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function generateReportPdf({
  productInfo,
  declarationRows,
  findings,
  previewUrl,
  inspectionId,
  reportDate,
  score,
  validCount,
  totalFields,
  overallStatusLabel,
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 50;

  const colors = {
    dark: [28, 43, 36],
    green: [31, 77, 61],
    gray: [110, 118, 112],
    red: [225, 75, 58],
    amber: [232, 194, 74],
  };

  // ── Header ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...colors.green);
  doc.text("NIRIKSHAN", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...colors.gray);
  doc.text("Legal Metrology Compliance System", margin, y + 14);

  doc.setFontSize(9);
  doc.setTextColor(...colors.dark);
  doc.text(`Inspection ID: ${inspectionId}`, pageWidth - margin, y, { align: "right" });
  doc.text(`Date: ${reportDate}`, pageWidth - margin, y + 14, { align: "right" });

  y += 34;
  doc.setDrawColor(220, 214, 198);
  doc.line(margin, y, pageWidth - margin, y);
  y += 26;

  // ── Product summary + image ──
  const imageDataUrl = await loadImageAsDataUrl(previewUrl);
  const imageBoxSize = 90;

  if (imageDataUrl) {
    try {
      doc.addImage(imageDataUrl, "JPEG", margin, y, imageBoxSize, imageBoxSize);
    } catch (err) {
      // ignore image errors, continue without it
    }
  }

  const textX = imageDataUrl ? margin + imageBoxSize + 20 : margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...colors.dark);
  doc.text(productInfo?.productName || "Unnamed Product", textX, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...colors.gray);
  const subtitle = [
    productInfo?.category,
    productInfo?.manufacturer,
  ].filter(Boolean).join(" · ");
  doc.text(subtitle || "Packaged Commodity", textX, y + 32);

  doc.setFontSize(9);
  doc.text(`Overall status: ${overallStatusLabel}`, textX, y + 50);

  y += imageDataUrl ? imageBoxSize + 20 : 60;

  // ── Compliance score ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...colors.green);
  doc.text("COMPLIANCE SCORE", margin, y);
  y += 18;

  doc.setFontSize(22);
  doc.setTextColor(...colors.dark);
  doc.text(`${score}%`, margin, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...colors.gray);
  doc.text(`${validCount} of ${totalFields} declarations clear`, margin + 70, y + 8);

  y += 20;
  // score bar
  const barWidth = pageWidth - margin * 2;
  doc.setFillColor(221, 211, 189);
  doc.rect(margin, y, barWidth, 6, "F");
  const fillWidth = (score / 100) * barWidth;
  doc.setFillColor(score >= 80 ? 47 : score >= 50 ? 232 : 225, score >= 80 ? 166 : score >= 50 ? 194 : 75, score >= 80 ? 107 : score >= 50 ? 74 : 58);
  doc.rect(margin, y, fillWidth, 6, "F");

  y += 30;

  // ── Declarations table ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...colors.green);
  doc.text("EXTRACTED DECLARATIONS", margin, y);
  y += 16;

  const colX = [margin, margin + 130, margin + 300, pageWidth - margin - 60];
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);
  doc.text("FIELD", colX[0], y);
  doc.text("VALUE", colX[1], y);
  doc.text("REQUIREMENT", colX[2], y);
  doc.text("STATUS", colX[3], y);
  y += 8;
  doc.setDrawColor(220, 214, 198);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  (declarationRows || []).forEach((row) => {
    if (y > 760) {
      doc.addPage();
      y = 50;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.dark);
    doc.text(row.label, colX[0], y, { maxWidth: 120 });

    doc.setFont("helvetica", "normal");
    doc.text(String(row.value || "Not detected"), colX[1], y, { maxWidth: 160 });

    doc.setFontSize(7.5);
    doc.setTextColor(...colors.gray);
    doc.text(row.requirement, colX[2], y, { maxWidth: 150 });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...(row.found ? colors.green : colors.amber));
    doc.text(row.found ? "VALID" : "REVIEW", colX[3], y);

    y += 20;
  });

  y += 14;

  // ── Confirmed findings ──
  const confirmed = (findings || []).filter((f) => f.status === "confirmed");

  if (y > 700) {
    doc.addPage();
    y = 50;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...colors.green);
  doc.text("COMPLIANCE FINDINGS", margin, y);
  y += 18;

  if (confirmed.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...colors.gray);
    doc.text("No findings were confirmed by the inspector for this inspection.", margin, y);
    y += 20;
  } else {
    confirmed.forEach((finding, idx) => {
      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...(finding.severity === "critical" ? colors.red : colors.amber));
      doc.text(`${idx + 1}. ${finding.title}`, margin, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...colors.gray);
      const wrapped = doc.splitTextToSize(finding.evidenceText, pageWidth - margin * 2);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 11 + 6;

      doc.setFontSize(8);
      doc.text(`Requirement: ${finding.requirementText}`, margin, y);
      y += 10;
      doc.text(`Reference: ${finding.ruleRef}`, margin, y);
      y += 20;
    });
  }

  // ── Footer note ──
  if (y > 740) {
    doc.addPage();
    y = 50;
  }
  y += 10;
  doc.setDrawColor(220, 214, 198);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray);
  const note = doc.splitTextToSize(
    "This report is generated from image analysis, OCR extraction and rule-based compliance verification. Final enforcement decisions remain subject to authorized inspector review.",
    pageWidth - margin * 2
  );
  doc.text(note, margin, y);

  doc.save(`${inspectionId || "inspection"}-report.pdf`);
}
