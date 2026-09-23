/**
 * Universal Cross-Platform Export Utilities for Businz Enterprise HRM
 * Fully compatible with Apple Mac (macOS, Safari, Apple Numbers), Windows (Microsoft Excel, Acrobat), iOS, and Android.
 * 
 * 1. Excel: Genuine OpenXML binary (.xlsx) using SheetJS - Opens natively in Apple Numbers & Excel
 * 2. CSV: Universal CSV with UTF-8 BOM - Preserves special characters and INR symbols
 * 3. PDF: High-fidelity vector PDF (.pdf) using jsPDF & autoTable - Native multi-page rendering
 * 4. Element PDF: Print/Save engine with hidden iframe to bypass Safari macOS pop-up blockers
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  key: string;
  label: string;
}

const escapeCsv = (val: any): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Downloads data as a universal CSV file with UTF-8 BOM
 * Guaranteed to open cleanly in Excel, Numbers, and text editors on Mac and Windows without encoding issues.
 */
export function downloadCSV(
  data: Record<string, any>[],
  filename: string,
  columns?: ExportColumn[]
): void {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  const cols = columns && columns.length > 0
    ? columns
    : Object.keys(data[0]).map(k => ({ key: k, label: k }));

  const headers = cols.map(c => escapeCsv(c.label)).join(',');
  const rows = data.map(item => cols.map(c => escapeCsv(item[c.key])).join(','));

  // UTF-8 BOM (\uFEFF) ensures Excel & Numbers on macOS/Windows properly display INR symbols and unicode
  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const cleanFilename = filename.replace(/\.(csv|xlsx?)$/i, '') + '.csv';
  triggerFileDownload(blob, cleanFilename);
}

/**
 * Downloads data as a genuine binary OpenXML Excel workbook (.xlsx)
 * Opens natively in:
 * - Apple Numbers on MacBook (macOS)
 * - Microsoft Excel for Mac
 * - Microsoft Excel on Windows (without XML/extension warnings)
 * - Google Sheets & Mobile Excel
 */
export function downloadExcel(
  data: Record<string, any>[],
  filename: string,
  columns?: ExportColumn[]
): void {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  const cols = columns && columns.length > 0
    ? columns
    : Object.keys(data[0]).map(k => ({ key: k, label: k }));

  // Create clean array of row objects with human-readable headers
  const sheetData = data.map(item => {
    const row: Record<string, any> = {};
    cols.forEach(c => {
      const raw = item[c.key];
      row[c.label] = raw !== null && raw !== undefined ? raw : '';
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(sheetData);

  // Auto-calculate column widths for great readability on Mac & Windows
  ws['!cols'] = cols.map(c => {
    const maxValLen = Math.max(
      c.label.length,
      ...data.slice(0, 50).map(d => String(d[c.key] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxValLen + 4, 14), 45) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');

  const cleanFilename = filename.replace(/\.(xlsx?|xls)$/i, '') + '.xlsx';

  // Generate binary XLSX buffer and download with official OpenXML MIME type
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  triggerFileDownload(blob, cleanFilename);
}

/**
 * Generates an official, publication-quality vector PDF document (.pdf)
 * Compatible with Apple Mac Preview, Adobe Acrobat, Safari, Chrome, and mobile devices.
 */
export function downloadPDF(
  data: Record<string, any>[],
  title: string,
  filename: string,
  columns?: ExportColumn[],
  companyName: string = 'Businz'
): void {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  const cols = columns && columns.length > 0
    ? columns
    : Object.keys(data[0] || {}).map(k => ({ key: k, label: k }));

  // Landscape for wider tables, Portrait for standard tables
  const isLandscape = cols.length > 5;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const primaryTeal: [number, number, number] = [14, 116, 144]; // #0E7490

  // 1. Company Header
  doc.setFontSize(16);
  doc.setTextColor(...primaryTeal);
  doc.text(companyName, 40, 38);

  // 2. Report Title
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text(title, 40, 56);

  // 3. Metadata Subtitle
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate 500
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  doc.text(`Generated: ${dateStr} • Total Records: ${data.length}`, 40, 70);

  // 4. Build Structured Table
  const tableHead = [cols.map(c => c.label)];
  const tableBody = data.map(item => cols.map(c => {
    const val = item[c.key];
    return val !== null && val !== undefined ? String(val) : '-';
  }));

  const renderTable = typeof autoTable === 'function' ? autoTable : ((autoTable as any)?.default || (autoTable as any)?.autoTable);
  renderTable(doc, {
    startY: 82,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: primaryTeal,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left'
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // #F8FAFC
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 4.5,
      lineColor: [226, 232, 240], // #E2E8F0
      lineWidth: 0.5
    },
    margin: { top: 40, right: 36, bottom: 36, left: 36 },
    didDrawPage: () => {
      // Clean footer on every page
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`${companyName} • Confidential Enterprise Report`, 36, pageHeight - 16);
      const pageStr = `Page ${doc.internal.pages.length - 1}`;
      const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
      doc.text(pageStr, pageWidth - 36 - doc.getTextWidth(pageStr), pageHeight - 16);
    }
  });

  const cleanFilename = filename.replace(/\.(pdf|xlsx?|csv)$/i, '') + '.pdf';
  doc.save(cleanFilename);
}

/**
 * Downloads a specific styled DOM element (like Payslip, Offer Letter, Attendance Slip) as PDF
 * Built with hidden iframe to bypass Apple Mac Safari pop-up blockers seamlessly.
 */
export function downloadElementAsPDF(
  elementId: string,
  title: string,
  companyName: string = 'Businz'
): void {
  const elem = document.getElementById(elementId);
  if (!elem) {
    alert(`Document content "${elementId}" not found.`);
    return;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} - ${escapeHtml(companyName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0F172A;
      padding: 24px;
      margin: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @media print {
      @page {
        margin: 8mm;
        size: auto;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  ${elem.outerHTML}
  <div class="no-print" style="margin-top: 24px; text-align: center;">
    <button onclick="window.print()" style="padding: 10px 24px; background: #0E7490; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px;">
      Save as PDF
    </button>
  </div>
</body>
</html>`;

  // Use hidden iframe first to prevent Apple Safari pop-up blockers
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          try { document.body.removeChild(iframe); } catch {}
        }, 1200);
      }, 350);
      return;
    }
  } catch (err) {
    console.warn('Iframe print failed, falling back to window.open:', err);
  }

  // Fallback to window.open
  const pdfWindow = window.open('', '_blank', 'width=900,height=750');
  if (pdfWindow) {
    pdfWindow.document.open();
    pdfWindow.document.write(html);
    pdfWindow.document.close();
    setTimeout(() => {
      pdfWindow.print();
    }, 400);
  } else {
    alert('Pop-up was blocked. Please allow pop-ups in Safari / Chrome to save as PDF.');
  }
}

function escapeHtml(unsafe: string): string {
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&#39;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
