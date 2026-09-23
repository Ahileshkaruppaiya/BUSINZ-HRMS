// Utility to generate realistic SVG Data URL bill/receipt images for expense claim proofs

export const generateReceiptSvg = (
  vendor: string,
  invoiceNo: string,
  date: string,
  category: string,
  employeeName: string,
  amount: number,
  notes?: string
): string => {
  const subtotal = Math.round(amount / 1.18 * 100) / 100;
  const gst = Math.round((amount - subtotal) * 100) / 100;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 760" width="540" height="760" style="background:#ffffff; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E7490" />
      <stop offset="100%" stop-color="#155E75" />
    </linearGradient>
  </defs>

  <!-- Outer Receipt Container -->
  <rect x="15" y="15" width="510" height="730" rx="14" fill="#ffffff" stroke="#CBD5E1" stroke-width="1.5" />
  
  <!-- Header Bar -->
  <path d="M 15 29 Q 15 15 29 15 L 511 15 Q 525 15 525 29 L 525 110 L 15 110 Z" fill="url(#headerGrad)" />
  
  <!-- Brand Title -->
  <text x="40" y="55" fill="#ffffff" font-size="20" font-weight="700" letter-spacing="0.5">${vendor}</text>
  <text x="40" y="78" fill="#CFFAFE" font-size="12" font-weight="500">GSTIN: 33AABCV1289P1Z8 • Verified Tax Invoice</text>
  <text x="40" y="96" fill="#A5F3FC" font-size="11">Official Commercial Payment Receipt &amp; Voucher</text>

  <rect x="390" y="38" width="115" height="48" rx="8" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" />
  <text x="447" y="58" fill="#ffffff" font-size="11" font-weight="600" text-anchor="middle">RECEIPT NO</text>
  <text x="447" y="76" fill="#ffffff" font-size="13" font-weight="700" text-anchor="middle">${invoiceNo}</text>

  <!-- Meta Info Grid -->
  <rect x="40" y="130" width="460" height="72" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
  
  <text x="56" y="154" fill="#64748B" font-size="11" font-weight="600">CLAIMANT / BILL TO</text>
  <text x="56" y="174" fill="#0F172A" font-size="14" font-weight="700">${employeeName || 'Corporate Employee'}</text>
  <text x="56" y="190" fill="#64748B" font-size="11">Businz Technologies Pvt Ltd</text>

  <text x="310" y="154" fill="#64748B" font-size="11" font-weight="600">INVOICE DATE</text>
  <text x="310" y="174" fill="#0F172A" font-size="13" font-weight="600">${date || '2026-08-26'}</text>

  <text x="420" y="154" fill="#64748B" font-size="11" font-weight="600">CATEGORY</text>
  <text x="420" y="174" fill="#0E7490" font-size="13" font-weight="700">${category}</text>

  <!-- Line Item Header -->
  <rect x="40" y="225" width="460" height="32" rx="6" fill="#E2E8F0" />
  <text x="56" y="246" fill="#334155" font-size="12" font-weight="700">DESCRIPTION OF GOODS / SERVICE</text>
  <text x="360" y="246" fill="#334155" font-size="12" font-weight="700" text-anchor="middle">QTY</text>
  <text x="470" y="246" fill="#334155" font-size="12" font-weight="700" text-anchor="end">AMOUNT (INR)</text>

  <!-- Line Item Rows -->
  <line x1="40" y1="305" x2="500" y2="305" stroke="#E2E8F0" stroke-dasharray="3,3" />
  <text x="56" y="280" fill="#0F172A" font-size="13" font-weight="600">${category} Expense Reimbursable Service</text>
  <text x="56" y="298" fill="#64748B" font-size="11">${notes || 'Verified expenditure incurred during official duties'}</text>
  <text x="360" y="288" fill="#0F172A" font-size="13" font-weight="500" text-anchor="middle">1</text>
  <text x="470" y="288" fill="#0F172A" font-size="13" font-weight="700" text-anchor="end">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</text>

  <!-- Tax Breakdown -->
  <rect x="40" y="325" width="460" height="150" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
  <text x="260" y="355" fill="#64748B" font-size="12">Taxable Base Amount:</text>
  <text x="470" y="355" fill="#0F172A" font-size="12" font-weight="600" text-anchor="end">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</text>

  <text x="260" y="380" fill="#64748B" font-size="12">CGST (9.0%):</text>
  <text x="470" y="380" fill="#0F172A" font-size="12" font-weight="600" text-anchor="end">₹${(gst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</text>

  <text x="260" y="405" fill="#64748B" font-size="12">SGST (9.0%):</text>
  <text x="470" y="405" fill="#0F172A" font-size="12" font-weight="600" text-anchor="end">₹${(gst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</text>

  <line x1="260" y1="422" x2="480" y2="422" stroke="#CBD5E1" stroke-width="1.5" />

  <text x="260" y="448" fill="#0E7490" font-size="15" font-weight="800">TOTAL PAID AMOUNT:</text>
  <text x="470" y="448" fill="#0E7490" font-size="17" font-weight="800" text-anchor="end">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</text>

  <!-- Payment Mode & Status Stamp -->
  <rect x="56" y="350" width="160" height="100" rx="8" fill="#EFF6FF" stroke="#BFDBFE" />
  <text x="68" y="375" fill="#1E40AF" font-size="11" font-weight="700">PAYMENT DETAILS</text>
  <text x="68" y="398" fill="#334155" font-size="11">Method: Corporate UPI / Card</text>
  <text x="68" y="416" fill="#334155" font-size="11">Status: Paid in Full</text>
  <text x="68" y="434" fill="#059669" font-size="11" font-weight="700">✓ Auth Code: OK#8829</text>

  <!-- Stamp -->
  <g transform="translate(340, 500) rotate(-10)">
    <rect x="0" y="0" width="135" height="42" rx="6" fill="none" stroke="#059669" stroke-width="2.5" stroke-dasharray="6,2" />
    <text x="67" y="24" fill="#059669" font-size="15" font-weight="800" text-anchor="middle" letter-spacing="1">PAID IN FULL</text>
    <text x="67" y="36" fill="#059669" font-size="8" font-weight="700" text-anchor="middle">AUTHORIZED VENDOR</text>
  </g>

  <!-- Terms & Barcode -->
  <text x="56" y="520" fill="#475569" font-size="11" font-weight="600">DECLARATION / NOTES:</text>
  <text x="56" y="538" fill="#64748B" font-size="10">Computer generated commercial tax invoice for business reimbursement.</text>
  <text x="56" y="552" fill="#64748B" font-size="10">Valid as proof of expenditure under Corporate Expense Policy.</text>

  <!-- Simulated Barcode -->
  <g transform="translate(56, 580)">
    <rect x="0" y="0" width="4" height="45" fill="#0F172A" />
    <rect x="8" y="0" width="2" height="45" fill="#0F172A" />
    <rect x="14" y="0" width="6" height="45" fill="#0F172A" />
    <rect x="24" y="0" width="3" height="45" fill="#0F172A" />
    <rect x="31" y="0" width="5" height="45" fill="#0F172A" />
    <rect x="40" y="0" width="2" height="45" fill="#0F172A" />
    <rect x="46" y="0" width="7" height="45" fill="#0F172A" />
    <rect x="57" y="0" width="4" height="45" fill="#0F172A" />
    <rect x="65" y="0" width="2" height="45" fill="#0F172A" />
    <rect x="71" y="0" width="6" height="45" fill="#0F172A" />
    <rect x="81" y="0" width="3" height="45" fill="#0F172A" />
    <rect x="88" y="0" width="5" height="45" fill="#0F172A" />
    <rect x="97" y="0" width="2" height="45" fill="#0F172A" />
    <rect x="103" y="0" width="8" height="45" fill="#0F172A" />
    <rect x="115" y="0" width="4" height="45" fill="#0F172A" />
    <rect x="123" y="0" width="3" height="45" fill="#0F172A" />
    <rect x="130" y="0" width="6" height="45" fill="#0F172A" />
    <rect x="140" y="0" width="3" height="45" fill="#0F172A" />
    <rect x="147" y="0" width="5" height="45" fill="#0F172A" />
    <rect x="156" y="0" width="2" height="45" fill="#0F172A" />
    <rect x="162" y="0" width="7" height="45" fill="#0F172A" />
    <rect x="173" y="0" width="4" height="45" fill="#0F172A" />
    <rect x="181" y="0" width="6" height="45" fill="#0F172A" />
    <rect x="191" y="0" width="3" height="45" fill="#0F172A" />
    <rect x="198" y="0" width="5" height="45" fill="#0F172A" />
    <rect x="207" y="0" width="4" height="45" fill="#0F172A" />
    <rect x="215" y="0" width="7" height="45" fill="#0F172A" />
    <rect x="226" y="0" width="4" height="45" fill="#0F172A" />
    <rect x="234" y="0" width="3" height="45" fill="#0F172A" />
    <rect x="241" y="0" width="6" height="45" fill="#0F172A" />
    <text x="125" y="62" fill="#64748B" font-size="10" font-family="monospace" text-anchor="middle">* ${invoiceNo} *</text>
  </g>

  <!-- Signatures -->
  <line x1="330" y1="620" x2="480" y2="620" stroke="#94A3B8" stroke-width="1" />
  <text x="405" y="638" fill="#475569" font-size="11" font-weight="600" text-anchor="middle">Authorized Signatory</text>
  <text x="405" y="652" fill="#64748B" font-size="10" text-anchor="middle">${vendor}</text>

  <!-- Footer Watermark -->
  <rect x="15" y="685" width="510" height="45" rx="0" fill="#F1F5F9" />
  <text x="270" y="705" fill="#64748B" font-size="11" font-weight="600" text-anchor="middle">Proof Document Attached for Corporate Reimbursement</text>
  <text x="270" y="720" fill="#94A3B8" font-size="10" text-anchor="middle">Businz Enterprise HRMS • Finance &amp; Accounts Audit Trail Verified</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const SAMPLE_TRAVEL_RECEIPT = generateReceiptSvg(
  'Southern Express Logistics & Travel Services',
  'INV-TRV-8942',
  '2026-08-26',
  'Travel',
  'Dinesh Kumar',
  4500,
  'Client site visit to industrial equipment facility in Coimbatore'
);

export const SAMPLE_EQUIPMENT_RECEIPT = generateReceiptSvg(
  'Apex Industrial Safety Solutions Pvt Ltd',
  'INV-IND-4419',
  '2026-08-20',
  'Equipment',
  'Ramesh Kumar',
  15000,
  'Safety helmets, high-visibility jackets, and tool calibration kit'
);
