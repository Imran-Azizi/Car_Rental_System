import { formatAfghanDate, formatNumber } from './utils';

export const OWNER_PAYMENT_METHODS: Record<string, string> = {
  cash: 'نقدی',
  bank: 'انتقال بانکی',
  mobile: 'پول موبایل',
  check: 'چک',
  other: 'سایر',
};

const escapeHtml = (value: any) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export function openCarOwnerPaymentReceipt(payment: any, mode: 'view' | 'print' | 'pdf' = 'view') {
  if (typeof window === 'undefined') return;
  const win = window.open('', '_blank');
  if (!win) return;

  const owner = payment.owner || {};
  const method = OWNER_PAYMENT_METHODS[payment.paymentMethod || ''] || payment.paymentMethod || 'نقدی';
  const shouldPrint = mode === 'print' || mode === 'pdf';

  win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>رسید پرداخت صاحب موتر - ${escapeHtml(payment.receiptNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f8fafc; color: #111827; font-family: Tahoma, "Segoe UI", Arial, sans-serif; direction: rtl; }
    .toolbar { position: sticky; top: 0; z-index: 2; display: flex; gap: 8px; justify-content: center; padding: 12px; background: #0f172a; }
    .toolbar button { border: 0; border-radius: 8px; padding: 9px 14px; color: #fff; background: #d97706; font-weight: 700; cursor: pointer; }
    .toolbar button.secondary { background: #334155; }
    .page { width: 210mm; min-height: 297mm; margin: 18px auto; background: #fff; padding: 18mm; box-shadow: 0 18px 55px rgba(15,23,42,.14); }
    .header { display: flex; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 3px solid #d97706; padding-bottom: 16px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo { width: 64px; height: 64px; border: 2px solid #f59e0b; border-radius: 14px; object-fit: contain; padding: 4px; }
    .company { font-size: 22px; font-weight: 900; color: #78350f; }
    .sub { margin-top: 4px; color: #b45309; font-size: 13px; }
    .receipt-chip { text-align: left; }
    .title { display: inline-block; background: linear-gradient(135deg,#92400e,#78350f); color: #fff; border-radius: 999px; padding: 10px 18px; font-size: 18px; font-weight: 900; }
    .receipt-no { margin-top: 9px; color: #475569; font-size: 13px; direction: ltr; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 22px; }
    .box { border: 1px solid #fde68a; border-radius: 14px; background: #fffbeb; overflow: hidden; }
    .box-title { background: #fef3c7; color: #92400e; font-weight: 900; padding: 10px 14px; border-bottom: 1px solid #fde68a; }
    .rows { padding: 12px 14px; }
    .row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px dashed #fcd34d; }
    .row:last-child { border-bottom: 0; }
    .label { color: #78350f; font-weight: 700; white-space: nowrap; }
    .value { color: #111827; font-weight: 700; text-align: left; overflow-wrap: anywhere; }
    .amount { margin-top: 20px; border-radius: 18px; color: white; text-align: center; padding: 20px; background: linear-gradient(135deg,#059669,#047857); }
    .amount .caption { font-size: 15px; opacity: .9; }
    .amount .number { margin-top: 8px; direction: ltr; font-size: 42px; line-height: 1; font-weight: 950; }
    .notes { margin-top: 18px; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; min-height: 72px; background: #f8fafc; }
    .notes-title { color: #475569; font-weight: 900; margin-bottom: 8px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 54px; }
    .sig { border-top: 2px solid #d97706; text-align: center; padding-top: 10px; color: #78350f; font-weight: 800; min-height: 60px; }
    .footer { margin-top: 34px; border-top: 1px dashed #f59e0b; padding-top: 12px; text-align: center; color: #64748b; font-size: 12px; }
    @media (max-width: 760px) { .page { width: calc(100% - 20px); min-height: auto; padding: 20px; } .header, .grid { grid-template-columns: 1fr; display: grid; } .receipt-chip { text-align: right; } }
    @media print { body { background: #fff; } .toolbar { display: none; } .page { width: 210mm; min-height: 297mm; margin: 0; box-shadow: none; } @page { size: A4; margin: 0; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">${mode === 'pdf' ? 'دانلود PDF' : 'چاپ رسید'}</button>
    <button class="secondary" onclick="window.close()">بستن</button>
  </div>
  <main class="page">
    <section class="header">
      <div class="brand">
        <img class="logo" src="/logo.png" alt="Afshar" />
        <div>
          <div class="company">مرکز کرایه موتر افشار</div>
          <div class="sub">سیستم مدیریت هوشمند</div>
        </div>
      </div>
      <div class="receipt-chip">
        <div class="title">رسید پرداخت صاحب موتر</div>
        <div class="receipt-no">Receipt No: <strong>${escapeHtml(payment.receiptNumber)}</strong></div>
      </div>
    </section>

    <section class="grid">
      <div class="box">
        <div class="box-title">معلومات صاحب موتر</div>
        <div class="rows">
          <div class="row"><span class="label">نام:</span><span class="value">${escapeHtml(owner.fullName)}</span></div>
          <div class="row"><span class="label">ولد:</span><span class="value">${escapeHtml(owner.fatherName || '-')}</span></div>
          <div class="row"><span class="label">نمبر تذکره:</span><span class="value" dir="ltr">${escapeHtml(owner.tazkiraNumber || '-')}</span></div>
          <div class="row"><span class="label">شماره تماس:</span><span class="value" dir="ltr">${escapeHtml(owner.phoneNumber || '-')}</span></div>
          <div class="row"><span class="label">آدرس:</span><span class="value">${escapeHtml(owner.address || '-')}</span></div>
        </div>
      </div>

      <div class="box">
        <div class="box-title">معلومات پرداخت</div>
        <div class="rows">
          <div class="row"><span class="label">تاریخ پرداخت:</span><span class="value">${formatAfghanDate(payment.paymentDate)}</span></div>
          <div class="row"><span class="label">روش پرداخت:</span><span class="value">${escapeHtml(method)}</span></div>
          <div class="row"><span class="label">ثبت توسط:</span><span class="value">${escapeHtml(payment.createdBy || '-')}</span></div>
          <div class="row"><span class="label">تاریخ صدور:</span><span class="value">${formatAfghanDate(new Date().toISOString(), true)}</span></div>
        </div>
      </div>
    </section>

    <section class="amount">
      <div class="caption">مبلغ پرداخت شده</div>
      <div class="number">${formatNumber(payment.amount)}</div>
      <div class="caption">افغانی</div>
    </section>

    <section class="notes">
      <div class="notes-title">یادداشت / توضیحات</div>
      <div>${escapeHtml(payment.notes || 'بدون یادداشت')}</div>
    </section>

    <section class="signatures">
      <div class="sig">امضای صاحب موتر</div>
      <div class="sig">امضای مدیر / حسابدار</div>
    </section>

    <section class="footer">
      این رسید به صورت اتومات توسط سیستم کرایه موتر افشار تولید شده است.
    </section>
  </main>
  ${shouldPrint ? '<script>window.onload = () => setTimeout(() => window.print(), 250);</script>' : ''}
</body>
</html>`);
  win.document.close();
}
