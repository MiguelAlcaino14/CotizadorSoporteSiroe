import jsPDF from "jspdf";
import type { Cliente } from "@/lib/supabase";

interface LineItem {
  id: number | string;
  service: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: "CLP" | "UF";
  category?: string;
  rentalPeriod?: string;
  rentalFrom?: Date | null;
  rentalTo?: Date | null;
}

function fmtDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const TRANSFER_DATA = {
  banco: "Santander",
  tipoCuenta: "Cuenta Corriente",
  numeroCuenta: "97713421",
  rut: "78.144.127-9",
  titular: "Soporte Siroe SPA",
  email: "administracion@soportesiroe.cl",
};

interface GeneratePDFOptions {
  cotizacionId: string;
  cliente: Cliente;
  executive: string;
  requirement: string;
  items: LineItem[];
  ufValue: number;
  netTotal: number;
  ivaAmount: number;
  grandTotal: number;
  version?: number;
  validityDays?: number;
  terms?: string;
  requesterName?: string;
}

async function loadImageAsDataUrl(url: string): Promise<{ dataUrl: string; width: number; height: number; format: "PNG" | "JPEG" } | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const { width, height, compressedDataUrl, hasTransparency } = await new Promise<{
      width: number;
      height: number;
      compressedDataUrl: string;
      hasTransparency: boolean;
    }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const MAX_PX = 600;
        const scale = img.naturalWidth > MAX_PX ? MAX_PX / img.naturalWidth : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparent = false;
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] < 255) { transparent = true; break; }
        }
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          compressedDataUrl: canvas.toDataURL("image/jpeg", 0.65),
          hasTransparency: transparent,
        });
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
    // Use JPEG (smaller) unless image has transparency
    if (!hasTransparency) {
      return { dataUrl: compressedDataUrl, width, height, format: "JPEG" };
    }
    return { dataUrl, width, height, format: "PNG" };
  } catch {
    return null;
  }
}

export async function generateCotizacionPDF(opts: GeneratePDFOptions): Promise<void> {
  const { cotizacionId, cliente, executive, requirement, items, ufValue, netTotal, ivaAmount, grandTotal, validityDays = 30, terms, requesterName } = opts;
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });

  const pageW = 210;
  const margin = 16;
  const contentW = pageW - margin * 2;

  const colors = {
    primary: [76, 34, 77] as [number, number, number],
    text: [17, 24, 39] as [number, number, number],
    muted: [107, 114, 128] as [number, number, number],
    border: [229, 231, 235] as [number, number, number],
    rowAlt: [249, 250, 251] as [number, number, number],
    headerBg: [243, 244, 246] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
  };

  const logoDataUrl = await loadImageAsDataUrl("/Logo_Siroe_opc_3_B.png");

  let y = margin;

  const gap = 4;
  const clientColW = (contentW - gap) / 2;
  const quoteColW = clientColW;
  const quoteX = margin + clientColW + gap;

  // Banda de encabezado: logo (izquierda) + título/ID (derecha)
  const headerH = 32;
  const logoW = 25;
  const logoH = logoDataUrl ? logoW * (logoDataUrl.height / logoDataUrl.width) : 14;
  const logoY = (headerH - logoH) / 2;
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageW, headerH, "F");

  if (logoDataUrl) {
    doc.addImage(logoDataUrl.dataUrl, logoDataUrl.format, margin, logoY, logoW, logoH);
  }

  doc.setTextColor(...colors.white);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("COTIZACIÓN", pageW - margin, 13, { align: "right" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(cotizacionId, pageW - margin, 22, { align: "right" });

  y = headerH + 8;

  // Datos para calcular la altura total de la sección de info
  const hasUF = items.some((i) => i.currency === "UF");
  const infoRows: [string, string][] = [
    ["Empresa", cliente.name],
    ["RUT", cliente.rut],
    ["Email", cliente.email || "-"],
    ["Teléfono", cliente.phone || "-"],
    ["Solicitado por", requesterName || "-"],
  ];
  // Períodos de arriendo únicos para mostrar en panel COTIZACIÓN
  const rentalItemsWithDates = items.filter(
    (i) => i.category === "Arriendo de Equipos" && i.rentalFrom && i.rentalTo
  );
  const seenRanges = new Map<string, { from: Date; to: Date; label: string }>();
  rentalItemsWithDates.forEach((item) => {
    const key = `${item.rentalFrom!.toISOString()}_${item.rentalTo!.toISOString()}`;
    if (!seenRanges.has(key)) {
      seenRanges.set(key, { from: item.rentalFrom!, to: item.rentalTo!, label: item.service });
    }
  });
  const rentalDateRows: [string, string][] = [...seenRanges.values()].map(({ from, to, label }, i) => [
    seenRanges.size === 1 ? "Período arriendo" : `Arriendo ${i + 1}`,
    `${fmtDate(from)} - ${fmtDate(to)}`,
  ]);

  const quoteRows: [string, string][] = [
    ["Ejecutivo", executive],
    ["Moneda", hasUF ? "CLP / UF" : "CLP"],
    ...(hasUF && ufValue > 0 ? [["Valor UF", `$${ufValue.toLocaleString("es-CL")}`] as [string, string]] : []),
    ["Validez", `${validityDays} día${validityDays !== 1 ? "s" : ""} desde emisión`],
    ...rentalDateRows,
  ];

  const rowH = 5.5;
  const badgeH = 6;
  const infoSectionH = badgeH + 3 + Math.max(infoRows.length, quoteRows.length) * rowH;

  // Badge CLIENTE (alineado con logo del header)
  doc.setFillColor(...colors.headerBg);
  doc.roundedRect(margin, y, clientColW, badgeH, 1, 1, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.muted);
  doc.text("CLIENTE", margin + 3, y + 4);

  // Badge COTIZACIÓN
  doc.setFillColor(...colors.headerBg);
  doc.roundedRect(quoteX, y, quoteColW, badgeH, 1, 1, "F");
  doc.text("COTIZACIÓN", quoteX + 3, y + 4);

  const infoStartY = y + badgeH + 3;

  infoRows.forEach(([label, value], i) => {
    const rowY = infoStartY + i * rowH;
    if (i % 2 === 0) {
      doc.setFillColor(252, 252, 253);
      doc.rect(margin, rowY - 1, clientColW, rowH, "F");
    }
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.muted);
    doc.text(label, margin + 2, rowY + 3);
    doc.setTextColor(...colors.text);
    const truncated = doc.getTextWidth(value) > clientColW - 22 ? value.substring(0, 26) + "..." : value;
    doc.text(truncated, margin + clientColW - 2, rowY + 3, { align: "right" });
  });

  quoteRows.forEach(([label, value], i) => {
    const rowY = infoStartY + i * rowH;
    if (i % 2 === 0) {
      doc.setFillColor(252, 252, 253);
      doc.rect(quoteX, rowY - 1, quoteColW, rowH, "F");
    }
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.muted);
    doc.text(label, quoteX + 2, rowY + 3);
    doc.setTextColor(...colors.text);
    doc.text(value, quoteX + quoteColW - 2, rowY + 3, { align: "right" });
  });

  y += infoSectionH + 10;

  doc.setFillColor(...colors.headerBg);
  doc.roundedRect(margin, y, contentW, 6, 1, 1, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.muted);
  doc.text("SERVICIOS / PRODUCTOS", margin + 3, y + 4);
  y += 9;

  const colWidths = [38, 62, 12, 20, 20, 26];
  const colHeaders = ["Servicio", "Descripción", "Cant.", "Moneda", "Valor Unit.", "Total CLP"];
  const colAligns: ("left" | "right")[] = ["left", "left", "right", "left", "right", "right"];

  doc.setFillColor(...colors.headerBg);
  doc.rect(margin, y, contentW, 7, "F");

  let colX = margin;
  colHeaders.forEach((header, i) => {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.muted);
    const x = colAligns[i] === "right" ? colX + colWidths[i] - 2 : colX + 2;
    doc.text(header, x, y + 4.5, { align: colAligns[i] });
    colX += colWidths[i];
  });
  y += 7;

  // Agrupar items por categoría
  const categoryOrder = ["Servicio", "Producto", "Licencia / Software", "Arriendo de Equipos"];
  const groupedMap = new Map<string, LineItem[]>();
  for (const item of items) {
    const cat = item.category || "Servicio";
    if (!groupedMap.has(cat)) groupedMap.set(cat, []);
    groupedMap.get(cat)!.push(item);
  }
  const sortedCategories = [...groupedMap.keys()].sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  const multipleGroups = groupedMap.size > 1;

  let rowIdx = 0;
  for (const cat of sortedCategories) {
    const catItems = groupedMap.get(cat)!;

    if (multipleGroups) {
      doc.setFillColor(220, 210, 230);
      doc.rect(margin, y, contentW, 6, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.primary);
      doc.text(cat.toUpperCase(), margin + 3, y + 4);
      y += 6;
    }

    for (const item of catItems) {
      const rawTotal = item.quantity * item.unitPrice;
      const clpTotal = item.currency === "UF" ? rawTotal * ufValue : rawTotal;
      const hasRentalPeriod = item.category === "Arriendo de Equipos" && !!item.rentalPeriod;
      const cellH = hasRentalPeriod ? 11 : 7;

      if (rowIdx % 2 === 0) {
        doc.setFillColor(...colors.white);
      } else {
        doc.setFillColor(...colors.rowAlt);
      }
      doc.rect(margin, y, contentW, cellH, "F");

      const unitDisplay = item.currency === "UF"
        ? `UF ${item.unitPrice.toLocaleString("es-CL")}`
        : `$${item.unitPrice.toLocaleString("es-CL")}`;

      const values = [
        item.service,
        item.description,
        String(item.quantity),
        item.currency,
        unitDisplay,
        `$${Math.round(clpTotal).toLocaleString("es-CL")}`,
      ];

      let cx = margin;
      values.forEach((val, i) => {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.text);
        const maxChars = Math.floor(colWidths[i] / 2.2);
        const truncated = val.length > maxChars ? val.substring(0, maxChars - 1) + "…" : val;
        const x = colAligns[i] === "right" ? cx + colWidths[i] - 2 : cx + 2;
        doc.text(truncated, x, y + 4.5, { align: colAligns[i] });
        cx += colWidths[i];
      });

      if (hasRentalPeriod) {
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...colors.muted);
        doc.text(`Período: ${item.rentalPeriod}`, margin + 2, y + cellH - 2);
      }

      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.2);
      doc.line(margin, y + cellH, margin + contentW, y + cellH);
      y += cellH;
      rowIdx++;
    }
  }

  y += 2;

  const summaryRows: [string, string][] = [
    ["Neto", `$${Math.round(netTotal).toLocaleString("es-CL")}`],
    ["IVA (19%)", `$${Math.round(ivaAmount).toLocaleString("es-CL")}`],
  ];

  const summaryStartX = margin + 132;
  const summaryWidth = contentW - 132;
  summaryRows.forEach(([label, value]) => {
    doc.setFillColor(...colors.white);
    doc.rect(summaryStartX, y, summaryWidth, 6, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.muted);
    doc.text(label, summaryStartX + 2, y + 4);
    doc.setTextColor(...colors.text);
    doc.text(value, margin + contentW - 2, y + 4, { align: "right" });
    y += 6;
  });

  y += 1;
  doc.setFillColor(...colors.primary);
  doc.rect(summaryStartX, y, summaryWidth, 9, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.white);
  doc.text("Total", summaryStartX + 2, y + 6);
  doc.setFontSize(9);
  doc.text(`$${Math.round(grandTotal).toLocaleString("es-CL")}`, margin + contentW - 2, y + 6, { align: "right" });
  y += 15;

  y += 4;

  // Transferencia y términos lado a lado; términos solo si se ingresaron
  const VALIDITY_TERM = `Válido por ${validityDays} día${validityDays !== 1 ? "s" : ""} desde la fecha de emisión.`;
  const FIXED_TERMS = "Todos los valores expresados en UF serán calculados de acuerdo con el valor de la UF vigente al momento de la emisión de la factura.";
  const userTerms = terms?.trim() ?? "";

  const transferW = contentW / 2 - 2;
  const termsW = contentW / 2 - 2;
  const termsX = margin + contentW / 2 + 2;
  const sectionHeaderH = 6;

  doc.setFillColor(...colors.headerBg);
  doc.roundedRect(margin, y, transferW, sectionHeaderH, 1, 1, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.muted);
  doc.text("DATOS DE TRANSFERENCIA", margin + 3, y + 4);

  doc.setFillColor(...colors.headerBg);
  doc.roundedRect(termsX, y, termsW, sectionHeaderH, 1, 1, "F");
  doc.text("TÉRMINOS Y CONDICIONES", termsX + 3, y + 4);

  y += sectionHeaderH + 1;

  const transferRows: [string, string][] = [
    ["Banco", TRANSFER_DATA.banco],
    ["Tipo de cuenta", TRANSFER_DATA.tipoCuenta],
    ["N° de cuenta", TRANSFER_DATA.numeroCuenta],
    ["RUT", TRANSFER_DATA.rut],
    ["Titular", TRANSFER_DATA.titular],
    ["Email", TRANSFER_DATA.email],
  ];

  const tRowH = 5.5;
  transferRows.forEach(([label, value], i) => {
    const rowY = y + i * tRowH;
    if (i % 2 === 0) {
      doc.setFillColor(252, 252, 253);
      doc.rect(margin, rowY - 1, transferW, tRowH, "F");
    }
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.muted);
    doc.text(label, margin + 2, rowY + 3);
    doc.setTextColor(...colors.text);
    doc.text(value, margin + transferW - 2, rowY + 3, { align: "right" });
  });

  const termsBoxH = transferRows.length * tRowH + 2;
  doc.setFillColor(252, 252, 253);
  doc.rect(termsX, y - 1, termsW, termsBoxH, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.text);

  // Línea 1: validez en negrita
  doc.setFont("helvetica", "bold");
  const wrappedValidity = doc.splitTextToSize(VALIDITY_TERM, termsW - 4);
  doc.text(wrappedValidity, termsX + 2, y + 3);

  // Línea 2: texto fijo UF en normal
  const validityBlockH = wrappedValidity.length * 3.5;
  doc.setFont("helvetica", "normal");
  const secondText = userTerms ? `${FIXED_TERMS}\n\n${userTerms}` : FIXED_TERMS;
  const wrappedRest = doc.splitTextToSize(secondText, termsW - 4);
  doc.text(wrappedRest, termsX + 2, y + 3 + validityBlockH + 1);

  y += transferRows.length * tRowH + 8;

  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentW, y);
  y += 4;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...colors.muted);
  doc.text(
    "Este documento es una cotización comercial y no constituye una factura.",
    pageW / 2,
    y,
    { align: "center" }
  );

  doc.save(`${cotizacionId}.pdf`);
}
