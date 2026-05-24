'use client';
import { useEffect } from 'react';
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
  driverName?: string; driverLicense?: string; driverPhone?: string;
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
    companyName:     'مرکز کرایه موتر افشار',
    managerLabel:    'مسئول:',
    contractSerial:  'شماره قرارداد',
    startDateLabel:  'تاریخ و ساعت تحویل:',
    returnDateLabel: 'تاریخ و ساعت برگشت:',
    colNum:          'شماره',
    colCar:          'مشخصات موتر',
    colRenter:       'کرایه گیرنده',
    colGuarantor:    'ضامن',
    colDriver:       'دریور',
    carLabels:    ['نام موتر','مدل','رنگ','نمبر پلیت','کرایه روزانه','مجموع کرایه','پیش پرداخت / باقی'],
    rentLabels:   ['نام','نام پدر','ناحیه','قریه','ولایت','آدرس فعلی','نمبر تذکره'],
    guarLabels:   ['نام','نام پدر','ناحیه','قریه','ولایت','آدرس فعلی','نمبر تذکره'],
    driverLabels: ['نام راننده','نمبر لیسنس','شماره تلفن','','','',''],
    condTitle:  'موتر با شرایط زیر به کرایه گیرنده سپرده می‌شود.',
    logoSub:    'کرایه موتر\nافشار',
    cond: [
      'مسئولیت هر گونه حادثه با مشتری می‌باشد.',
      'مسئولیت هر نوع فعالیت غیرقانونی با موتر (مانند قاچاق و غیره) با مشتری است.',
      'در صورت توقیف یا حادثه موتر به علت مشتری، کرایه روزانه همچنان تعلق می‌گیرد.',
      'در صورت تأخیر در برگشت موتر، به ازای هر ساعت (___) افغانی دریافت می‌شود.',
      'در صورت تصادف یا برخورد یا آسیب، خسارت کامل پرداخت می‌شود.',
      'موتر باید در همان حالتی که تحویل گرفته شده، به دفتر برگشت داده شود. موتر سالم، درست و بدون هیچ مشکلی تحویل داده شد.',
      'برای نظافت (___) افغانی اضافی دریافت می‌شود.',
      'ضامن جان و مال کرایه گیرنده را ضمانت می‌نماید.',
    ],
    agreeText:  'با شرایط ذکر شده موافق هستیم.',
    noteLabel:  'یادداشت',
    footerCust:   'انگشت و شماره تلفن مشتری:',
    footerGuar:   'انگشت و شماره تلفن ضامن:',
    footerDriver: 'انگشت و شماره تلفن راننده:',
    footerMgr:    'مسئول دفتر:',
    printBtn:   'چاپ بل',
    closeBtn:   'بستن',
    currency:   'افغانی',
  },
  pashto: {
    companyName:     'افشار د کرایپی موترو او ګلسازی مرکز',
    managerLabel:    'مسئول:',
    contractSerial:  'تعمیر مسلسل',
    startDateLabel:  'د ورلو تاریخ او ساعت:',
    returnDateLabel: 'د واپسی تاریخ او ساعت:',
    colNum:          'شمیره',
    colCar:          'د موتر مشخصات',
    colRenter:       'کرابه نیونکی',
    colGuarantor:    'ضمانت کوونکی',
    colDriver:       'دریور',
    carLabels:    ['عراده موتر','ماډل','رنګ','بلیت','فی ورځ نرخ','جمله','رسید / باقی'],
    rentLabels:   ['نوم','د پلار نوم','ناحیه','ولسوالۍ','ولایت','فعلی سکونت','د تذکرې نمبر'],
    guarLabels:   ['نوم','د پلار نوم','ناحیه','ولسوالۍ','ولایت','فعلی سکونت','د تذکرې نمبر'],
    driverLabels: ['د دریور نوم','لیسنس نمبر','تلیفون','','','',''],
    condTitle:  'کرابه نیونکی ته به لاندی شرایطو موتر به کرابه ورکول کیږی.',
    logoSub:    'کرایپی موترو\nافشار',
    cond: [
      'د هری حادثي ضمور مشتری دی.',
      'موتر کي د غیر قانوني کار مسؤلیت به مشتری باندی دی لکه (قاچاق او نور...).',
      'موتر د مشتري له وجی د بندی کیدو یا حادثه به صورت کي د هری ورځي کرایه به مشتری باندی ده.',
      'موتر به خپل وخت د نه حاضریدو به صورت کي فی ساعت (___) افغانی اخیستل کیږی.',
      'د بکر یا ټکر یا جیه کیدو به صورت به هم جوری او قیمت کمیدو تاوان به هم ور کوی.',
      'موتر مو چی به کوم حالت کي در سپارلی برته باید به هماغه حالت کي دفتر ته تسلیم کوی. موټر روغ، جوړ او بې له کومې ستونزې تسلیم شو.',
      'د کلبوس به صورت کي (___) افغانی اضافه ورکوی.',
      'ضامن د کرايه‌اخيستونکي د سر او مال ضامن دی.',
    ],
    agreeText:  'به ذکر شوی شرایطو باندی موتر موافق یو.',
    noteLabel:  'نوټ',
    footerCust:   'مشتری ګوته او تلیفون شمیره:',
    footerGuar:   'ضمانت کوونکی ګوته او تلیفون شمیره:',
    footerDriver: 'دریور ګوته او تلیفون شمیره:',
    footerMgr:    'دفتر مسئول:',
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

const labelHalf: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  padding: '4px 5px', whiteSpace: 'nowrap',
  borderLeft: '1px solid #c8a060',
  minWidth: '58px', flexShrink: 0,
  fontSize: '7.5pt', fontWeight: 'bold',
};

const valueHalf: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  flex: 1, padding: '5px 7px',
  overflow: 'hidden', whiteSpace: 'nowrap',
  textOverflow: 'ellipsis', minWidth: 0,
};

/* ─────────────────────── component ────────────────────────── */
export default function ContractBill({ data, lang = 'pashto', onClose, autoPrint = false }: ContractBillProps) {
  const tr = T[lang];

  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => window.print(), 350);
    return () => clearTimeout(t);
  }, [autoPrint]);

  /* Build the 7 data rows (car | renter | guarantor | driver) */
  const rows = [
    { carVal: data.carName,      rentVal: data.customerFullName,        guarVal: data.guarantorFullName || '',       driverVal: data.driverName    || '' },
    { carVal: data.model,        rentVal: data.customerFatherName,      guarVal: data.guarantorFatherName || '',     driverVal: data.driverLicense || '' },
    { carVal: data.color,        rentVal: data.customerDistrict || '',  guarVal: data.guarantorDistrict || '',       driverVal: data.driverPhone   || '' },
    { carVal: data.plateNumber,  rentVal: data.customerVillage || '',   guarVal: data.guarantorVillage || '',        driverVal: '' },
    { carVal: `${fmt(data.dailyRate)} ${tr.currency}`,  rentVal: data.customerProvince || '',       guarVal: data.guarantorProvince || '',       driverVal: '' },
    { carVal: `${fmt(data.totalRent)} ${tr.currency}`,  rentVal: data.customerCurrentAddress || '', guarVal: data.guarantorCurrentAddress || '', driverVal: '' },
    { carVal: `${fmt(data.advancePayment)} / ${fmt(data.remainingAmount)} ${tr.currency}`, rentVal: data.customerTazkira || '', guarVal: data.guarantorTazkira || '', driverVal: '' },
  ];

  const pNum = ['۱','۲','۳','۴','۵','۶','۷','۸'];

  return (
    <div className="bill-wrapper" style={{ minHeight: '100vh', background: '#d1d5db', paddingTop: '20px', paddingBottom: '20px', direction: 'rtl' }}>

      {/* ── Action buttons (hidden on print) ── */}
      <div className="print:hidden" style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
        <button onClick={() => window.print()} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 24px', borderRadius: '12px',
          background: 'linear-gradient(135deg,#b45309,#92400e)',
          color: '#fff', fontWeight: 'bold', fontSize: '15px',
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          fontFamily: '"Amiri","Noto Naskh Arabic","Vazirmatn",serif',
        }}>
          <Printer style={{ width: 18, height: 18 }} />
          {tr.printBtn}
        </button>
        {onClose && (
          <button onClick={onClose} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 24px', borderRadius: '12px',
            background: '#fff', color: '#92400e',
            fontWeight: 'bold', fontSize: '15px',
            border: '2px solid #d97706', cursor: 'pointer',
            fontFamily: '"Amiri","Noto Naskh Arabic","Vazirmatn",serif',
          }}>
            <X style={{ width: 18, height: 18 }} />
            {tr.closeBtn}
          </button>
        )}
      </div>

      {/* ══════════════ A4 BILL ══════════════ */}
      <div id="bill-print-area" style={{
        width: '210mm', minHeight: '297mm', margin: '0 auto',
        background: '#fff', padding: '6mm 8mm',
        fontFamily: '"Amiri","Noto Naskh Arabic","Vazirmatn",serif',
        direction: 'rtl', boxSizing: 'border-box',
        border: '3px double #8B4513', fontSize: '11pt', color: '#1a0a00',
      }}>

        {/* ── Outer decorative border ── */}
        <div style={{ border: '1.5px solid #c8860a', padding: '4px', marginBottom: '4px' }}>

          {/* ══ HEADER ══ */}
          <div style={{
            background: 'linear-gradient(180deg,#FFF8DC 0%,#FFF3B0 100%)',
            border: '2px solid #8B4513', padding: '5px 8px 6px',
            position: 'relative', marginBottom: '3px',
          }}>
            {/* Corner accents */}
            {[
              { top: '2px',    right: '2px',  borderBottom: 'none', borderLeft: 'none' },
              { top: '2px',    left:  '2px',  borderBottom: 'none', borderRight: 'none' },
              { bottom: '2px', right: '2px',  borderTop: 'none',    borderLeft: 'none' },
              { bottom: '2px', left:  '2px',  borderTop: 'none',    borderRight: 'none' },
            ].map((st, i) => (
              <div key={i} style={{ position: 'absolute', width: 14, height: 14, border: '2px solid #8B4513', ...st }} />
            ))}

            <div style={{ display: 'flex', alignItems: 'stretch', gap: '8px' }}>

              {/* RIGHT column: customer photo + manager label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', minWidth: '72px', flexShrink: 0 }}>
                {data.customerPhoto ? (
                  <img
                    src={data.customerPhoto.startsWith('http')
                      ? data.customerPhoto
                      : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${data.customerPhoto}`}
                    alt="مشتری"
                    style={{ width: '62px', height: '72px', objectFit: 'cover', border: '2.5px solid #8B4513', borderRadius: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.18)' }}
                    onError={(e: any) => {
                      e.currentTarget.style.display = 'none';
                      (e.currentTarget.nextSibling as HTMLElement | null)?.removeAttribute('hidden');
                    }}
                  />
                ) : (
                  <div style={{ width: '62px', height: '72px', border: '2px dashed #c8a060', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', background: '#FFF8DC' }}>🚗</div>
                )}
                <div style={{ fontSize: '7.5pt', color: '#6b2e00', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {tr.managerLabel}
                </div>
              </div>

              {/* CENTER: company name */}
              <div style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '19pt', fontWeight: '900', color: '#8B0000', lineHeight: 1.35 }}>
                  {tr.companyName}
                </div>
              </div>

              {/* LEFT column: logo + phone numbers */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', minWidth: '72px', flexShrink: 0, direction: 'ltr' }}>
                <img src="/logo.png" alt="افشار" style={{ width: '54px', height: '54px', objectFit: 'contain' }} />
                <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#333', lineHeight: 1.8, textAlign: 'left' }}>
                  <div>📱 0783945133</div>
                  <div>📞 0773492040</div>
                </div>
              </div>

            </div>
          </div>

          {/* ══ CONTRACT NUMBER + DATES ROW ══ */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: '1.5px solid #8B4513', background: '#FEFDF5',
            padding: '3px 8px', marginBottom: '3px', fontSize: '9.5pt', gap: '4px', direction: 'rtl',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 'bold', color: '#5c2000' }}>{tr.contractSerial}:</span>
              <span style={{ fontWeight: '900', fontSize: '13pt', border: '1px solid #8B4513', background: '#FFF3CC', padding: '0 6px', color: '#8B0000', minWidth: '36px', textAlign: 'center', display: 'inline-block' }}>
                {data.contractNumber}
              </span>
            </div>
            <div style={{ width: '1px', height: '16px', background: '#c8a060' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontWeight: 'bold', color: '#5c2000' }}>{tr.startDateLabel}</span>
              <span style={{ borderBottom: '1px solid #8B4513', minWidth: '90px', paddingBottom: '1px', color: '#333', direction: 'ltr', textAlign: 'center' }}>
                {formatAfghanDate(data.startDate)}{data.startTime ? ` — ${data.startTime}` : ''}
              </span>
            </div>
            <div style={{ width: '1px', height: '16px', background: '#c8a060' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontWeight: 'bold', color: '#5c2000' }}>{tr.returnDateLabel}</span>
              <span style={{ borderBottom: '1px solid #8B4513', minWidth: '90px', paddingBottom: '1px', color: '#333', direction: 'ltr', textAlign: 'center' }}>
                {formatAfghanDate(data.endDate)}{data.endTime ? ` — ${data.endTime}` : ''}
              </span>
            </div>
          </div>

          {/* ══ MAIN TABLE — 5 columns: شمیره | Car | Renter | Guarantor | Driver ══ */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #8B4513', marginBottom: '3px', direction: 'rtl', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '24px' }} />
              <col /><col /><col /><col />
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...thS, textAlign: 'center', fontSize: '8.5pt', padding: '4px 2px' }}>{tr.colNum}</th>
                <th style={thS}>{tr.colCar}</th>
                <th style={thS}>{tr.colRenter}</th>
                <th style={thS}>{tr.colGuarantor}</th>
                <th style={{ ...thS, background: '#5c1a1a' }}>{tr.colDriver}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#FEFEFA' : '#FFFEF0', height: '30px' }}>
                  {/* Row number */}
                  <td style={{ border: '1px solid #c8a060', textAlign: 'center', fontWeight: 'bold', fontSize: '10.5pt', background: '#FFF3CC', color: '#8B0000', padding: '3px 2px', verticalAlign: 'middle' }}>
                    {pNum[i]}
                  </td>
                  {/* Car */}
                  <td style={{ ...tdS, background: '#FFF8E7' }}>
                    <div style={{ display: 'flex', alignItems: 'stretch', direction: 'rtl', height: '100%', minHeight: '30px' }}>
                      <div style={{ ...labelHalf, color: '#8B2000', background: '#FFF0CC' }}>{tr.carLabels[i]}</div>
                      <div style={{ ...valueHalf, fontWeight: '700', color: '#1a0a00', fontSize: '8pt' }}>{row.carVal}</div>
                    </div>
                  </td>
                  {/* Renter */}
                  <td style={tdS}>
                    <div style={{ display: 'flex', alignItems: 'stretch', direction: 'rtl', height: '100%', minHeight: '30px' }}>
                      <div style={{ ...labelHalf, color: '#7B4E00', background: '#FFF8EE' }}>{tr.rentLabels[i]}</div>
                      <div style={{ ...valueHalf, fontWeight: row.rentVal ? '600' : 'normal', color: row.rentVal ? '#1a0a00' : '#bbb', fontSize: '8pt' }}>{row.rentVal || '—'}</div>
                    </div>
                  </td>
                  {/* Guarantor */}
                  <td style={tdS}>
                    <div style={{ display: 'flex', alignItems: 'stretch', direction: 'rtl', height: '100%', minHeight: '30px' }}>
                      <div style={{ ...labelHalf, color: '#7B4E00', background: '#FFF8EE' }}>{tr.guarLabels[i]}</div>
                      <div style={{ ...valueHalf, fontWeight: row.guarVal ? '600' : 'normal', color: row.guarVal ? '#1a0a00' : '#bbb', fontSize: '8pt' }}>{row.guarVal || '—'}</div>
                    </div>
                  </td>
                  {/* Driver */}
                  <td style={{ ...tdS, background: '#FDF5FF' }}>
                    <div style={{ display: 'flex', alignItems: 'stretch', direction: 'rtl', height: '100%', minHeight: '30px' }}>
                      {tr.driverLabels[i] ? (
                        <div style={{ ...labelHalf, color: '#5c1a1a', background: '#F5E8FF' }}>{tr.driverLabels[i]}</div>
                      ) : null}
                      <div style={{ ...valueHalf, fontWeight: row.driverVal ? '600' : 'normal', color: row.driverVal ? '#1a0a00' : '#bbb', fontSize: '8pt', paddingRight: tr.driverLabels[i] ? undefined : '5px' }}>
                        {row.driverVal || (tr.driverLabels[i] ? '—' : '')}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ══ CONDITIONS SECTION ══ */}
          <div style={{ border: '2px solid #8B4513', marginBottom: '3px', background: '#FEFDF5', direction: 'rtl' }}>
            {/* Header: logo + title */}
            <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid #c8a060' }}>
              <div style={{ minWidth: '72px', borderLeft: '1px solid #c8a060', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px', background: '#FFF8DC' }}>
                <img src="/logo.png" alt="افشار" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
              </div>
              <div style={{ flex: 1, background: 'linear-gradient(135deg,#FFF3CC,#FFE88A)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px' }}>
                <span style={{ fontWeight: '900', fontSize: '12pt', color: '#8B0000', textAlign: 'center' }}>{tr.condTitle}</span>
              </div>
            </div>
            {/* Conditions list */}
            <div style={{ padding: '5px 10px', fontSize: '10pt', lineHeight: 2, color: '#1a0800' }}>
              {tr.cond.map((c, i) => (
                <p key={i} style={{ margin: '1px 0' }}><strong>{pNum[i]}:</strong> {c}</p>
              ))}
              <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{tr.agreeText}</p>
              {data.notes && (
                <p style={{ margin: '3px 0', borderTop: '1px dashed #c8a060', paddingTop: '3px' }}>
                  <strong>{tr.noteLabel}:</strong> {data.notes}
                </p>
              )}
            </div>
          </div>

          {/* ══ FOOTER — 4 sections: Customer | Guarantor | Driver | Manager ══
               RTL order (rightmost → leftmost in visual rendering)            ══ */}
          <div style={{
            border: '2px solid #8B4513', display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            background: '#FFF8E7', minHeight: '54px', direction: 'rtl',
          }}>
            {/* 1st (RTL rightmost): Customer */}
            <div style={{ borderLeft: '1px solid #c8a060', padding: '7px 5px', textAlign: 'center' }}>
              <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#5c2000', marginBottom: '6px' }}>{tr.footerCust}</div>
              {data.customerPhone && (
                <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#333', direction: 'ltr', marginBottom: '6px' }}>{data.customerPhone}</div>
              )}
              <div style={{ borderTop: '1px solid #8B4513', paddingTop: '3px', fontSize: '8pt', color: '#666', marginTop: data.customerPhone ? '0' : '14px' }}>
                {lang === 'pashto' ? 'ګوته' : 'انگشت'}: ________
              </div>
            </div>

            {/* 2nd: Guarantor */}
            <div style={{ borderLeft: '1px solid #c8a060', padding: '7px 5px', textAlign: 'center' }}>
              <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#5c2000', marginBottom: '6px' }}>{tr.footerGuar}</div>
              {data.guarantorPhone && (
                <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#333', direction: 'ltr', marginBottom: '6px' }}>{data.guarantorPhone}</div>
              )}
              <div style={{ borderTop: '1px solid #8B4513', paddingTop: '3px', fontSize: '8pt', color: '#666', marginTop: data.guarantorPhone ? '0' : '14px' }}>
                {lang === 'pashto' ? 'ګوته' : 'انگشت'}: ________
              </div>
            </div>

            {/* 3rd: Driver */}
            <div style={{ borderLeft: '1px solid #c8a060', padding: '7px 5px', textAlign: 'center', background: '#FDF5FF' }}>
              <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#5c1a1a', marginBottom: '6px' }}>{tr.footerDriver}</div>
              {data.driverPhone && (
                <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#333', direction: 'ltr', marginBottom: '6px' }}>{data.driverPhone}</div>
              )}
              {!data.driverPhone && data.driverName && (
                <div style={{ fontSize: '8pt', color: '#555', marginBottom: '6px' }}>{data.driverName}</div>
              )}
              <div style={{ borderTop: '1px solid #8B4513', paddingTop: '3px', fontSize: '8pt', color: '#666', marginTop: (data.driverPhone || data.driverName) ? '0' : '14px' }}>
                {lang === 'pashto' ? 'دریور ګوته' : 'انگشت راننده'}: ___
              </div>
            </div>

            {/* 4th (RTL leftmost): Manager */}
            <div style={{ padding: '7px 5px', textAlign: 'center' }}>
              <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#5c2000', marginBottom: '6px' }}>{tr.footerMgr}</div>
              <div style={{ marginBottom: '6px', minHeight: '18px' }}>
                {data.managerSignature && <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#333' }}>{data.managerSignature}</div>}
              </div>
              <div style={{ borderTop: '1px solid #8B4513', paddingTop: '3px', fontSize: '8pt', color: '#666' }}>
                {lang === 'pashto' ? 'لاسلیک' : 'امضا'}: ________
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
          body * { visibility: hidden !important; }
          .print\\:hidden { display: none !important; }
          #bill-print-area, #bill-print-area * { visibility: visible !important; }
          #bill-print-area {
            position: fixed !important;
            top: 0 !important; left: 0 !important; right: 0 !important;
            width: 210mm !important; min-height: 297mm !important;
            margin: 0 !important; padding: 6mm 8mm !important;
            border: 3px double #8B4513 !important;
            box-shadow: none !important; background: #fff !important;
            direction: rtl !important;
          }
        }
      `}</style>
    </div>
  );
}
