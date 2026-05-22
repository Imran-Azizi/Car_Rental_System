'use client';
import { useEffect, useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { formatAfghanDate } from '@/lib/utils';

/* ─────────────────────────── types ────────────────────────── */
export interface BillData {
  contractNumber: string;
  carName: string; model: string; color: string; plateNumber: string;
  dailyRate: number | string; totalRent: number | string;
  advancePayment: number | string; remainingAmount: number | string;
  startDate: string; startTime?: string; endDate: string; endTime?: string;
  carStatus?: string;
  customerFullName: string; customerFatherName: string;
  customerDistrict?: string; customerVillage?: string;
  customerProvince?: string; customerCurrentAddress?: string;
  customerTazkira?: string; customerPhone?: string;
  customerPhoto?: string;
  guarantorFullName?: string; guarantorFatherName?: string;
  guarantorDistrict?: string; guarantorVillage?: string;
  guarantorProvince?: string; guarantorCurrentAddress?: string;
  guarantorTazkira?: string; guarantorPhone?: string;
  customerSignature?: string; guarantorSignature?: string;
  managerSignature?: string; notes?: string;
}

interface ContractBillProps {
  data: BillData;
  lang?: 'dari' | 'pashto';
  onClose?: () => void;
  autoPrint?: boolean;
}

/* ─────────────────────── translation object ────────────────── */
const T = {
  dari: {
    companyName:       'مرکز کرایه موتر افشار',
    managerLabel:      'مسئول:',
    contractSerial:    'شماره قرارداد',
    startDateLabel:    'تاریخ و ساعت تحویل:',
    returnDateLabel:   'تاریخ و ساعت برگشت:',
    colNum:            'شماره',
    colCar:            'مشخصات موتر',
    colRenter:         'کرایه گیرنده',
    colGuarantor:      'ضامن',
    carLabels:  ['نام موتر','مدل','رنگ','نمبر پلیت','کرایه روزانه','مجموع کرایه','پیش پرداخت / باقی'],
    rentLabels: ['نام','نام پدر','ناحیه','قریه','ولایت','آدرس فعلی','نمبر تذکره'],
    guarLabels: ['نام','نام پدر','ناحیه','قریه','ولایت','آدرس فعلی','نمبر تذکره'],
    condTitle:  'موتر با شرایط زیر به کرایه گیرنده سپرده می‌شود.',
    logoSub:    'کرایه موتر\nافشار',
    cond: [
      'مسئولیت هر گونه حادثه با مشتری می‌باشد.',
      'مسئولیت هر نوع فعالیت غیرقانونی با موتر (مانند قاچاق و غیره) با مشتری است.',
      'در صورت توقیف یا حادثه موتر به علت مشتری، کرایه روزانه همچنان تعلق می‌گیرد.',
      'در صورت تأخیر در برگشت موتر، به ازای هر ساعت (___) افغانی دریافت می‌شود.',
      'در صورت تصادف یا برخورد یا آسیب، خسارت کامل پرداخت می‌شود.',
      'موتر باید در همان حالتی که تحویل گرفته شده، به دفتر برگشت داده شود.',
      'برای نظافت (___) افغانی اضافی دریافت می‌شود.',
    ],
    driverLine: 'نام راننده (_____) نمبر لیسنس (_____) انگشت راننده (_____)',
    agreeText:  'با شرایط ذکر شده موافق هستیم.',
    noteLabel:  'یادداشت',
    footerGuar: 'انگشت و شماره تلفن ضامن:',
    footerCust: 'انگشت و شماره تلفن مشتری:',
    footerMgr:  'مسئول دفتر:',
    printBtn:   'چاپ بل',
    closeBtn:   'بستن',
    currency:   'افغانی',
  },
  pashto: {
    companyName:       'افشار د کرایپی موترو او ګلسازی مرکز',
    managerLabel:      'مسئول:',
    contractSerial:    'تعمیر مسلسل',
    startDateLabel:    'د ورلو تاریخ او ساعت:',
    returnDateLabel:   'د واپسی تاریخ او ساعت:',
    colNum:            'شمیره',
    colCar:            'د موتر مشخصات',
    colRenter:         'کرابه نیونکی',
    colGuarantor:      'ضمانت کوونکی',
    carLabels:  ['عراده موتر','ماډل','رنګ','بلیت','فی ورځ نرخ','جمله','رسید / باقی'],
    rentLabels: ['نوم','د پلار نوم','ناحیه','ولسوالۍ','ولایت','فعلی سکونت','د تذکرې نمبر'],
    guarLabels: ['نوم','د پلار نوم','ناحیه','ولسوالۍ','ولایت','فعلی سکونت','د تذکرې نمبر'],
    condTitle:  'کرابه نیونکی ته به لاندی شرایطو موتر به کرابه ورکول کیږی.',
    logoSub:    'کرایپی موترو\nافشار',
    cond: [
      'د هری حادثي ضمور مشتری دی.',
      'موتر کي د غیر قانوني کار مسؤلیت به مشتری باندی دی لکه (قاچاق او نور...).',
      'موتر د مشتري له وجی د بندی کیدو یا حادثه به صورت کي د هری ورځي کرایه به مشتری باندی ده.',
      'موتر به خپل وخت د نه حاضریدو به صورت کي فی ساعت (___) افغانی اخیستل کیږی.',
      'د بکر یا ټکر یا جیه کیدو به صورت به هم جوری او قیمت کمیدو تاوان به هم ور کوی.',
      'موتر مو چی به کوم حالت کي در سپارلی برته باید به هماغه حالت کي دفتر ته تسلیم کوی.',
      'د کلبوس به صورت کي (___) افغانی اضافه ورکوی.',
    ],
    driverLine: 'د دریور نوم (_____) لیسنس نمبر (_____) دریور ګوته (_____)',
    agreeText:  'به ذکر شوی شرایطو باندی موتر موافق یو.',
    noteLabel:  'نوټ',
    footerGuar: 'ضمانت کوونکی ګوته او تلیفون شمیره:',
    footerCust: 'مشتری ګوته او تلیفون شمیره:',
    footerMgr:  'دفتر مسئول:',
    printBtn:   'چاپ بل',
    closeBtn:   'بستن',
    currency:   'افغانی',
  },
} as const;

/* ─────────────────────────── helpers ──────────────────────── */
const fmt = (v: number | string | undefined) =>
  Number(v || 0).toLocaleString('en-US');

const thS: React.CSSProperties = {
  background: '#8B0000', color: '#fff',
  padding: '5px 7px', border: '1px solid #8B4513',
  fontWeight: 'bold', textAlign: 'right', fontSize: '10.5pt',
};
const tdS: React.CSSProperties = {
  border: '1px solid #c8a060',
  padding: 0,
  verticalAlign: 'middle',
};

/* Shared style for the label half of a data cell */
const labelHalf: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '5px 7px',
  whiteSpace: 'nowrap',
  borderLeft: '1px solid #c8a060',
  minWidth: '70px',
  flexShrink: 0,
  fontSize: '8pt',
  fontWeight: 'bold',
};

/* Shared style for the value half of a data cell */
const valueHalf: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flex: 1,
  padding: '5px 7px',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  minWidth: 0,
};

/* ─────────────────────── component ────────────────────────── */
export default function ContractBill({ data, lang = 'pashto', onClose, autoPrint = false }: ContractBillProps) {
  const tr = T[lang];

  /* Auto-print after mount when triggered from contracts list */
  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => window.print(), 350);
    return () => clearTimeout(t);
  }, [autoPrint]);

  /* Build the 7 data rows */
  const rows = [
    {
      carVal:  data.carName,
      rentVal: data.customerFullName,
      guarVal: data.guarantorFullName || '',
    },
    {
      carVal:  data.model,
      rentVal: data.customerFatherName,
      guarVal: data.guarantorFatherName || '',
    },
    {
      carVal:  data.color,
      rentVal: data.customerDistrict || '',
      guarVal: data.guarantorDistrict || '',
    },
    {
      carVal:  data.plateNumber,
      rentVal: data.customerVillage || '',
      guarVal: data.guarantorVillage || '',
    },
    {
      carVal:  `${fmt(data.dailyRate)} ${tr.currency}`,
      rentVal: data.customerProvince || '',
      guarVal: data.guarantorProvince || '',
    },
    {
      carVal:  `${fmt(data.totalRent)} ${tr.currency}`,
      rentVal: data.customerCurrentAddress || '',
      guarVal: data.guarantorCurrentAddress || '',
    },
    {
      carVal:  `${fmt(data.advancePayment)} / ${fmt(data.remainingAmount)} ${tr.currency}`,
      rentVal: data.customerTazkira || '',
      guarVal: data.guarantorTazkira || '',
    },
  ];

  const pNum = ['۱','۲','۳','۴','۵','۶','۷'];

  return (
    <div
      className="bill-wrapper"
      style={{
        minHeight: '100vh',
        background: '#d1d5db',
        paddingTop: '20px',
        paddingBottom: '20px',
        direction: 'rtl',
      }}
    >
      {/* ── Action buttons (hidden on print) ── */}
      <div
        className="print:hidden"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={() => window.print()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 24px', borderRadius: '12px',
            background: 'linear-gradient(135deg,#b45309,#92400e)',
            color: '#fff', fontWeight: 'bold', fontSize: '15px',
            border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            fontFamily: '"Amiri","Noto Naskh Arabic","Vazirmatn",serif',
          }}
        >
          <Printer style={{ width: 18, height: 18 }} />
          {tr.printBtn}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 24px', borderRadius: '12px',
              background: '#fff', color: '#92400e',
              fontWeight: 'bold', fontSize: '15px',
              border: '2px solid #d97706', cursor: 'pointer',
              fontFamily: '"Amiri","Noto Naskh Arabic","Vazirmatn",serif',
            }}
          >
            <X style={{ width: 18, height: 18 }} />
            {tr.closeBtn}
          </button>
        )}
      </div>

      {/* ══════════════ A4 BILL ══════════════ */}
      <div
        id="bill-print-area"
        style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          background: '#fff',
          padding: '6mm 8mm',
          fontFamily: '"Amiri","Noto Naskh Arabic","Vazirmatn",serif',
          direction: 'rtl',
          boxSizing: 'border-box',
          border: '3px double #8B4513',
          fontSize: '11pt',
          color: '#1a0a00',
        }}
      >
        {/* ── Outer decorative border ── */}
        <div style={{ border: '1.5px solid #c8860a', padding: '4px', marginBottom: '4px' }}>

          {/* ══ HEADER ══ */}
          <div
            style={{
              background: 'linear-gradient(180deg,#FFF8DC 0%,#FFF3B0 100%)',
              border: '2px solid #8B4513',
              padding: '5px 8px 6px',
              position: 'relative',
              marginBottom: '3px',
            }}
          >
            {/* Corner accents */}
            {[
              { top: '2px',    right: '2px',  borderBottom: 'none', borderLeft: 'none' },
              { top: '2px',    left:  '2px',  borderBottom: 'none', borderRight: 'none' },
              { bottom: '2px', right: '2px',  borderTop: 'none',    borderLeft: 'none' },
              { bottom: '2px', left:  '2px',  borderTop: 'none',    borderRight: 'none' },
            ].map((st, i) => (
              <div key={i} style={{
                position: 'absolute', width: 14, height: 14,
                border: '2px solid #8B4513', ...st,
              }} />
            ))}

            <div style={{ display: 'flex', alignItems: 'stretch', gap: '8px' }}>

              {/* ── RIGHT column (first in RTL): customer photo + manager label ── */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '3px',
                minWidth: '72px', flexShrink: 0,
              }}>
                {data.customerPhoto ? (
                  <img
                    src={data.customerPhoto.startsWith('http')
                      ? data.customerPhoto
                      : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${data.customerPhoto}`}
                    alt="مشتری"
                    style={{
                      width: '62px', height: '72px',
                      objectFit: 'cover',
                      border: '2.5px solid #8B4513',
                      borderRadius: '6px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                    }}
                    onError={(e: any) => {
                      e.currentTarget.style.display = 'none';
                      (e.currentTarget.nextSibling as HTMLElement | null)?.removeAttribute('hidden');
                    }}
                  />
                ) : (
                  <div style={{
                    width: '62px', height: '72px',
                    border: '2px dashed #c8a060',
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', background: '#FFF8DC',
                  }}>🚗</div>
                )}
                <div style={{ fontSize: '7.5pt', color: '#6b2e00', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {tr.managerLabel}
                </div>
              </div>

              {/* ── CENTER: company name ── */}
              <div style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '19pt', fontWeight: '900', color: '#8B0000', lineHeight: 1.35 }}>
                  {tr.companyName}
                </div>
              </div>

              {/* ── LEFT column (last in RTL): 🚗 icon + phone numbers ── */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '2px',
                minWidth: '72px', flexShrink: 0, direction: 'ltr',
              }}>
                <div style={{ fontSize: '26px', lineHeight: 1 }}>🚗</div>
                <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#333', lineHeight: 1.8, textAlign: 'left' }}>
                  <div>📱 0783945133</div>
                  <div>📞 0773492040</div>
                </div>
              </div>

            </div>
          </div>

          {/* ══ CONTRACT NUMBER + DATES ROW ══ */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1.5px solid #8B4513',
              background: '#FEFDF5',
              padding: '3px 8px',
              marginBottom: '3px',
              fontSize: '9.5pt',
              gap: '4px',
              direction: 'rtl',
            }}
          >
            {/* Right: contract number (first in RTL = rightmost) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 'bold', color: '#5c2000' }}>{tr.contractSerial}:</span>
              <span style={{
                fontWeight: '900', fontSize: '13pt',
                border: '1px solid #8B4513', background: '#FFF3CC',
                padding: '0 6px', color: '#8B0000',
                minWidth: '36px', textAlign: 'center', display: 'inline-block',
              }}>
                {data.contractNumber}
              </span>
            </div>

            <div style={{ width: '1px', height: '16px', background: '#c8a060' }} />

            {/* Middle: start date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontWeight: 'bold', color: '#5c2000' }}>{tr.startDateLabel}</span>
              <span style={{ borderBottom: '1px solid #8B4513', minWidth: '90px', paddingBottom: '1px', color: '#333', direction: 'ltr', textAlign: 'center' }}>
                {formatAfghanDate(data.startDate)}{data.startTime ? ` — ${data.startTime}` : ''}
              </span>
            </div>

            <div style={{ width: '1px', height: '16px', background: '#c8a060' }} />

            {/* Left: return date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontWeight: 'bold', color: '#5c2000' }}>{tr.returnDateLabel}</span>
              <span style={{ borderBottom: '1px solid #8B4513', minWidth: '90px', paddingBottom: '1px', color: '#333', direction: 'ltr', textAlign: 'center' }}>
                {formatAfghanDate(data.endDate)}{data.endTime ? ` — ${data.endTime}` : ''}
              </span>
            </div>
          </div>

          {/* ══ MAIN TABLE ══
              RTL column order (right → left):
              شمیره | د موتر مشخصات | کرایه نیونکی | ضمانت کونکی
              In HTML with dir=rtl, first <th> appears on the RIGHT.
          ══ */}
          <table
            style={{
              width: '100%', borderCollapse: 'collapse',
              border: '2px solid #8B4513', marginBottom: '3px',
              direction: 'rtl',
            }}
          >
            <thead>
              <tr>
                {/* 1st in HTML = rightmost in RTL */}
                <th style={{ ...thS, width: '30px', fontSize: '9pt', textAlign: 'center' }}>{tr.colNum}</th>
                <th style={thS}>{tr.colCar}</th>
                <th style={thS}>{tr.colRenter}</th>
                {/* 4th in HTML = leftmost in RTL */}
                <th style={thS}>{tr.colGuarantor}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#FEFEFA' : '#FFFEF0', height: '32px' }}>
                  {/* Row number — rightmost */}
                  <td style={{
                    border: '1px solid #c8a060', textAlign: 'center',
                    fontWeight: 'bold', fontSize: '11pt',
                    background: '#FFF3CC', color: '#8B0000',
                    padding: '4px 2px', verticalAlign: 'middle',
                  }}>
                    {pNum[i]}
                  </td>

                  {/* Car spec cell */}
                  <td style={{ ...tdS, background: '#FFF8E7' }}>
                    <div style={{ display: 'flex', alignItems: 'stretch', direction: 'rtl', height: '100%', minHeight: '32px' }}>
                      <div style={{ ...labelHalf, color: '#8B2000', background: '#FFF0CC' }}>
                        {tr.carLabels[i]}
                      </div>
                      <div style={{ ...valueHalf, fontWeight: '700', color: '#1a0a00' }}>
                        {row.carVal}
                      </div>
                    </div>
                  </td>

                  {/* Renter cell */}
                  <td style={tdS}>
                    <div style={{ display: 'flex', alignItems: 'stretch', direction: 'rtl', height: '100%', minHeight: '32px' }}>
                      <div style={{ ...labelHalf, color: '#7B4E00', background: '#FFF8EE' }}>
                        {tr.rentLabels[i]}
                      </div>
                      <div style={{ ...valueHalf, fontWeight: row.rentVal ? '600' : 'normal', color: row.rentVal ? '#1a0a00' : '#bbb' }}>
                        {row.rentVal || '—'}
                      </div>
                    </div>
                  </td>

                  {/* Guarantor cell — leftmost */}
                  <td style={tdS}>
                    <div style={{ display: 'flex', alignItems: 'stretch', direction: 'rtl', height: '100%', minHeight: '32px' }}>
                      <div style={{ ...labelHalf, color: '#7B4E00', background: '#FFF8EE' }}>
                        {tr.guarLabels[i]}
                      </div>
                      <div style={{ ...valueHalf, fontWeight: row.guarVal ? '600' : 'normal', color: row.guarVal ? '#1a0a00' : '#bbb' }}>
                        {row.guarVal || '—'}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ══ CONDITIONS SECTION ══ */}
          <div
            style={{
              border: '2px solid #8B4513',
              marginBottom: '3px',
              background: '#FEFDF5',
              direction: 'rtl',
            }}
          >
            {/* Header row: logo + title */}
            <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid #c8a060' }}>
              {/* Logo (right side in RTL) */}
              <div style={{
                minWidth: '72px', borderLeft: '1px solid #c8a060',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '4px', background: '#FFF8DC',
              }}>
                <div style={{ fontSize: '22px' }}>🚗</div>
                <div style={{ fontSize: '7pt', fontWeight: 'bold', color: '#8B2000', textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-line' }}>
                  {tr.logoSub}
                </div>
              </div>
              {/* Title */}
              <div style={{
                flex: 1,
                background: 'linear-gradient(135deg,#FFF3CC,#FFE88A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '6px 10px',
              }}>
                <span style={{ fontWeight: '900', fontSize: '12pt', color: '#8B0000', textAlign: 'center' }}>
                  {tr.condTitle}
                </span>
              </div>
            </div>

            {/* Conditions list */}
            <div style={{ padding: '5px 10px', fontSize: '10pt', lineHeight: 2, color: '#1a0800' }}>
              {tr.cond.map((c, i) => (
                <p key={i} style={{ margin: '1px 0' }}>
                  <strong>{pNum[i]}:</strong> {c}
                </p>
              ))}
              <p style={{ margin: '3px 0 1px', borderTop: '1px dashed #c8a060', paddingTop: '3px' }}>
                {tr.driverLine}
              </p>
              <p style={{ margin: '2px 0', fontWeight: 'bold' }}>
                {tr.agreeText}
              </p>
              {data.notes && (
                <p style={{ margin: '3px 0', borderTop: '1px dashed #c8a060', paddingTop: '3px' }}>
                  <strong>{tr.noteLabel}:</strong> {data.notes}
                </p>
              )}
            </div>
          </div>

          {/* ══ FOOTER / SIGNATURES ══
               RTL order (right → left): Customer | Guarantor | Manager
          ══ */}
          <div
            style={{
              border: '2px solid #8B4513',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              background: '#FFF8E7',
              minHeight: '52px',
              direction: 'rtl',
            }}
          >
            {/* Right (first in RTL): Customer */}
            <div style={{ borderLeft: '1px solid #c8a060', padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#5c2000', marginBottom: '8px' }}>
                {tr.footerCust}
              </div>
              {data.customerPhone && (
                <div style={{ fontSize: '9.5pt', fontWeight: 'bold', color: '#333', direction: 'ltr', marginBottom: '8px' }}>
                  {data.customerPhone}
                </div>
              )}
              <div style={{ borderTop: '1px solid #8B4513', paddingTop: '3px', fontSize: '8.5pt', color: '#666', marginTop: data.customerPhone ? '0' : '16px' }}>
                {lang === 'pashto' ? 'ګوته' : 'انگشت'}: ___________
              </div>
            </div>

            {/* Center: Guarantor */}
            <div style={{ borderLeft: '1px solid #c8a060', padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#5c2000', marginBottom: '8px' }}>
                {tr.footerGuar}
              </div>
              {data.guarantorPhone && (
                <div style={{ fontSize: '9.5pt', fontWeight: 'bold', color: '#333', direction: 'ltr', marginBottom: '8px' }}>
                  {data.guarantorPhone}
                </div>
              )}
              <div style={{ borderTop: '1px solid #8B4513', paddingTop: '3px', fontSize: '8.5pt', color: '#666', marginTop: data.guarantorPhone ? '0' : '16px' }}>
                {lang === 'pashto' ? 'ګوته' : 'انگشت'}: ___________
              </div>
            </div>

            {/* Left: Manager */}
            <div style={{ padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#5c2000', marginBottom: '8px' }}>
                {tr.footerMgr}
              </div>
              <div style={{ marginBottom: '8px', minHeight: '20px' }}>
                {data.managerSignature && (
                  <div style={{ fontSize: '9.5pt', fontWeight: 'bold', color: '#333' }}>{data.managerSignature}</div>
                )}
              </div>
              <div style={{ borderTop: '1px solid #8B4513', paddingTop: '3px', fontSize: '8.5pt', color: '#666' }}>
                {lang === 'pashto' ? 'لاسلیک' : 'امضا'}: ___________
              </div>
            </div>
          </div>

        </div>{/* /outer decorative border */}
      </div>{/* /A4 */}

      {/* ── Print CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; }
          body > * { display: none !important; }
          .bill-wrapper { display: none !important; }
          #bill-print-area,
          #bill-print-area * {
            display: revert !important;
            visibility: visible !important;
          }
          #bill-print-area {
            position: fixed !important;
            top: 0 !important; left: 0 !important; right: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 6mm 8mm !important;
            border: 3px double #8B4513 !important;
            box-shadow: none !important;
            background: #fff !important;
            direction: rtl !important;
          }
        }
        .print\\:hidden { }
        @media print { .print\\:hidden { display: none !important; } }
      `}</style>
    </div>
  );
}
