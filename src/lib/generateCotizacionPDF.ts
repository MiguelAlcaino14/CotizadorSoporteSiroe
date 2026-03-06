import jsPDF from "jspdf";
import type { Cliente } from "@/lib/supabase";

interface LineItem {
  id: number;
  service: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface GeneratePDFOptions {
  cotizacionId: string;
  cliente: Cliente;
  executive: string;
  currency: string;
  requirement: string;
  items: LineItem[];
}

export function generateCotizacionPDF(opts: GeneratePDFOptions): void {
  const { cotizacionId, cliente, executive, currency, requirement, items } = opts;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageW = 210;
  const margin = 16;
  const contentW = pageW - margin * 2;
  const today = new Date().toLocaleDateString("es-CL");
  const currencySymbol = currency === "UF" ? "UF " : "$";
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const colors = {
    primary: [30, 64, 175] as [number, number, number],
    text: [17, 24, 39] as [number, number, number],
    muted: [107, 114, 128] as [number, number, number],
    border: [229, 231, 235] as [number, number, number],
    rowAlt: [249, 250, 251] as [number, number, number],
    headerBg: [243, 244, 246] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
  };

  let y = margin;

  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageW, 28, "F");

  doc.setTextColor(...colors.white);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("COTIZACIÓN", margin, 12);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(cotizacionId, margin, 20);

  doc.setFontSize(9);
  doc.text(`Fecha: ${today}`, pageW - margin, 10, { align: "right" });
  doc.text("Estado: Borrador  |  Versión: v1", pageW - margin, 16, { align: "right" });
  if (requirement) {
    doc.text(`Requerimiento: ${requirement}`, pageW - margin, 22, { align: "right" });
  }

  y = 36;

  const colMid = margin + contentW / 2 + 4;

  doc.setFillColor(...colors.headerBg);
  doc.roundedRect(margin, y, contentW / 2 - 4, 6, 1, 1, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.muted);
  doc.text("CLIENTE", margin + 3, y + 4);

  doc.setFillColor(...colors.headerBg);
  doc.roundedRect(colMid, y, contentW / 2 - 4, 6, 1, 1, "F");
  doc.text("COTIZACIÓN", colMid + 3, y + 4);

  y += 9;

  const infoRows: [string, string][] = [
    ["Empresa", cliente.name],
    ["RUT", cliente.rut],
    ["Email", cliente.email || "-"],
    ["Teléfono", cliente.phone || "-"],
  ];

  const quoteRows: [string, string][] = [
    ["Ejecutivo", executive],
    ["Moneda", currency],
    ["Validez", "5 días desde emisión"],
  ];

  const rowH = 5.5;
  infoRows.forEach(([label, value], i) => {
    const rowY = y + i * rowH;
    if (i % 2 === 0) {
      doc.setFillColor(252, 252, 253);
      doc.rect(margin, rowY - 1, contentW / 2 - 4, rowH, "F");
    }
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.muted);
    doc.text(label, margin + 2, rowY + 3);
    doc.setTextColor(...colors.text);
    const maxW = contentW / 2 - 40;
    const truncated = doc.getTextWidth(value) > maxW
      ? value.substring(0, 30) + "..."
      : value;
    doc.text(truncated, margin + contentW / 2 - 8, rowY + 3, { align: "right" });
  });

  quoteRows.forEach(([label, value], i) => {
    const rowY = y + i * rowH;
    if (i % 2 === 0) {
      doc.setFillColor(252, 252, 253);
      doc.rect(colMid, rowY - 1, contentW / 2 - 4, rowH, "F");
    }
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.muted);
    doc.text(label, colMid + 2, rowY + 3);
    doc.setTextColor(...colors.text);
    doc.text(value, colMid + contentW / 2 - 8, rowY + 3, { align: "right" });
  });

  y += Math.max(infoRows.length, quoteRows.length) * rowH + 10;

  doc.setFillColor(...colors.headerBg);
  doc.roundedRect(margin, y, contentW, 6, 1, 1, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.muted);
  doc.text("SERVICIOS / PRODUCTOS", margin + 3, y + 4);
  y += 9;

  const colWidths = [42, 70, 14, 24, 24];
  const colHeaders = ["Servicio", "Descripción", "Cant.", "Valor Unit.", "Total"];
  const colAligns: ("left" | "right")[] = ["left", "left", "right", "right", "right"];

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

  items.forEach((item, idx) => {
    const rowTotal = item.quantity * item.unitPrice;
    const cellH = 7;

    if (idx % 2 === 0) {
      doc.setFillColor(...colors.white);
    } else {
      doc.setFillColor(...colors.rowAlt);
    }
    doc.rect(margin, y, contentW, cellH, "F");

    const values = [
      item.service,
      item.description,
      String(item.quantity),
      `${currencySymbol}${item.unitPrice.toLocaleString("es-CL")}`,
      `${currencySymbol}${rowTotal.toLocaleString("es-CL")}`,
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

    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.2);
    doc.line(margin, y + cellH, margin + contentW, y + cellH);
    y += cellH;
  });

  y += 1;
  doc.setFillColor(...colors.primary);
  doc.rect(margin, y, contentW, 8, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.white);
  doc.text("Total", margin + contentW - 2, y + 5.5, { align: "right" });
  doc.setFontSize(10);
  doc.text(`${currencySymbol}${total.toLocaleString("es-CL")}`, margin + contentW - 2, y + 5.5, { align: "right" });
  doc.text("Total", margin + 2, y + 5.5);
  y += 14;

  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentW, y);
  y += 4;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...colors.muted);
  doc.text(
    "Este documento es una cotización comercial y no constituye una factura. Válido por 5 días desde la fecha de emisión.",
    pageW / 2,
    y,
    { align: "center" }
  );

  doc.save(`${cotizacionId}.pdf`);
}
