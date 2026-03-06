import type { CotizacionItem } from "@/lib/supabase";

type QuoteForPDF = {
  id: string;
  executive: string;
  currency: string;
  status: string;
  requirement: string;
  version: number;
  created_at: string;
  clientes: {
    name: string;
    rut: string;
    email: string;
    phone: string;
  } | null;
};

type PDFOptions = {
  quote: QuoteForPDF;
  items: CotizacionItem[];
  total: number;
  companyName: string;
  companyRut: string;
};

function formatCurrency(amount: number, currency: string): string {
  const prefix = currency === "UF" ? "UF " : "$";
  return `${prefix}${amount.toLocaleString("es-CL")}`;
}

export function generateCotizacionPDF({ quote, items, total, companyName, companyRut }: PDFOptions): void {
  const date = new Date(quote.created_at).toLocaleDateString("es-CL");
  const validUntil = new Date(new Date(quote.created_at).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("es-CL");

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111827;">${item.service}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;">${item.description || "-"}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;color:#111827;">${item.quantity}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;color:#111827;">${formatCurrency(item.unit_price, quote.currency)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;font-weight:600;color:#111827;">${formatCurrency(item.quantity * item.unit_price, quote.currency)}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Cotización ${quote.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 48px 48px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 32px; border-bottom: 2px solid #0f172a; }
    .logo-area h1 { font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; }
    .logo-area p { font-size: 13px; color: #6b7280; margin-top: 2px; }
    .doc-info { text-align: right; }
    .doc-info .doc-number { font-size: 22px; font-weight: 700; color: #0f172a; }
    .doc-info .doc-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 6px; }
    .doc-info .doc-meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
    .section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 10px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .info-label { font-size: 12px; color: #6b7280; }
    .info-value { font-size: 12px; font-weight: 500; color: #111827; text-align: right; max-width: 200px; }
    .table-wrap { margin-bottom: 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .table-title { padding: 14px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #374151; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f3f4f6; }
    th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
    th.right { text-align: right; }
    .total-row td { padding: 14px 16px; font-size: 13px; font-weight: 600; background: #f9fafb; }
    .total-amount { font-size: 18px; font-weight: 700; color: #0f172a; text-align: right; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; }
    .validity { font-size: 12px; color: #6b7280; }
    .validity strong { color: #374151; }
    .signature-area { text-align: right; }
    .signature-line { width: 180px; border-bottom: 1px solid #9ca3af; margin-bottom: 6px; height: 32px; display: inline-block; }
    .signature-label { font-size: 11px; color: #9ca3af; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 32px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo-area">
        <h1>${companyName}</h1>
        <p>RUT: ${companyRut}</p>
      </div>
      <div class="doc-info">
        <div class="doc-label">Cotización</div>
        <div class="doc-number">${quote.id}</div>
        <div class="doc-meta">v${quote.version} &nbsp;•&nbsp; ${date}</div>
        <div class="doc-meta" style="margin-top:4px;">
          <span style="display:inline-block;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#f3f4f6;color:#374151;">${quote.status}</span>
        </div>
      </div>
    </div>

    <div class="section-grid">
      <div>
        <div class="section-title">Cliente</div>
        <div class="info-row"><span class="info-label">Empresa</span><span class="info-value">${quote.clientes?.name ?? "-"}</span></div>
        <div class="info-row"><span class="info-label">RUT</span><span class="info-value">${quote.clientes?.rut ?? "-"}</span></div>
        <div class="info-row"><span class="info-label">Email</span><span class="info-value">${quote.clientes?.email ?? "-"}</span></div>
        <div class="info-row"><span class="info-label">Teléfono</span><span class="info-value">${quote.clientes?.phone || "-"}</span></div>
      </div>
      <div>
        <div class="section-title">Detalles</div>
        <div class="info-row"><span class="info-label">Ejecutivo</span><span class="info-value">${quote.executive}</span></div>
        <div class="info-row"><span class="info-label">Moneda</span><span class="info-value">${quote.currency}</span></div>
        ${quote.requirement ? `<div class="info-row"><span class="info-label">N° Requerimiento</span><span class="info-value">${quote.requirement}</span></div>` : ""}
        <div class="info-row"><span class="info-label">Válida hasta</span><span class="info-value">${validUntil}</span></div>
      </div>
    </div>

    <div class="table-wrap">
      <div class="table-title">Servicios / Productos</div>
      <table>
        <thead>
          <tr>
            <th>Servicio / Producto</th>
            <th>Descripción</th>
            <th class="right">Cant.</th>
            <th class="right">Valor Unit.</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="4" style="text-align:right;color:#6b7280;">Total</td>
            <td class="total-amount">${formatCurrency(total, quote.currency)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="footer">
      <div class="validity">
        <p>Esta cotización tiene una validez de <strong>5 días hábiles</strong> desde la fecha de emisión.</p>
        <p style="margin-top:4px;">Fecha de vencimiento: <strong>${validUntil}</strong></p>
      </div>
      <div class="signature-area">
        <div class="signature-line"></div>
        <div class="signature-label">${quote.executive} — ${companyName}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
