"use client";
import { useEffect } from "react";
import { Printer, X } from "lucide-react";
import { formatAfghanDate, formatNumber } from "@/lib/utils";

/* ─────────────────────────────── types ─────────────────────────────── */
export interface CustomerBillData {
  billNumber: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  carType: string;
  plateNumber?: string;
  customerName: string;
  customerPhone?: string;

  notes?: string;
  rentalDays: number;
  dailyRate: number | string;
  totalRent: number | string;
  received: number | string;
  remaining: number | string;
  lang?: "dari" | "pashto";
  // Delay penalty fields
  delayDays?: number;
  delayPenaltyRate?: number | string;
  totalDelayPenalty?: number | string;
  finalTotal?: number | string;
}

interface Props {
  data: CustomerBillData;
  lang?: "dari" | "pashto";
  onClose?: () => void;
  autoPrint?: boolean;
}

/* ─────────────────────────── translations ───────────────────────────── */
const T = {
  dari: {
    companyName: "مرکز موترهای کرایی و گلسازی افشار",
    address:
      "آدرس: ارزان قیمت، بین چهاراهی دوم و محبس، بهلوی خوست منگل تاور، نوید مارکیت",
    carType: "نوع موتر",
    plateNo: "نمبر پلیت",
    custName: "اسم مشتری",
    billNo: "نمبر بل",
    phone: "تلیفون",
    startDate: "تاریخ تحویل",
    endDate: "تاریخ برگشت",
    colNo: "شماره",
    colDetails: "تفصیلات",
    colQty: "تعداد",
    colPrice: "قیمت",
    colTotal: "جمله",
    rowTotal: "مجموعه",
    rowReceived: "رسید",
    rowRemain: "باقی",
    rowDelayPenalty: "جریمه تأخیر",
    rowFinalTotal: "مجموع نهایی",
    signature: "امضاء",
    currency: "افغانی",
    days: "روز",
    rentalItem: "کرایه موتر",
    delayItem: "جریمه تأخیر",
    printBtn: "چاپ بل مشتری",
    closeBtn: "بستن",
  },
  pashto: {
    companyName: "افشار د کرایپي موترو او ګلسازي مرکز",
    address:
      "آدرس: ناروان قیمت، د دویم چوکاهي او محبس تر منځ، د خوست منګل ټاور تر تنګ",
    carType: "د موتر ډول",
    plateNo: "بلیت نمبر",
    custName: "د مشتري نوم",
    billNo: "د بل نمبر",
    phone: "تلیفون",
    startDate: "د ورلو نیټه",
    endDate: "د راستون نیټه",
    colNo: "شمیره",
    colDetails: "تفصیلات",
    colQty: "شمیر",
    colPrice: "قیمت",
    colTotal: "جمله",
    rowTotal: "مجموعه",
    rowReceived: "رسید",
    rowRemain: "باقی",
    rowDelayPenalty: "د ځنډ جریمه",
    rowFinalTotal: "وروستی ټول",
    signature: "لاسلیک",
    currency: "افغاني",
    days: "ورځ",
    rentalItem: "د موتر کرایه",
    delayItem: "د ځنډ جریمه",
    printBtn: "د مشتري بل چاپ",
    closeBtn: "بستن",
  },
} as const;

/* ───────────────────────────── helpers ──────────────────────────────── */
const fmt = (v: number | string | undefined) =>
  Number(v || 0).toLocaleString("en-US");

const NUM = ["۱", "۲", "۳", "۴", "۵", "۶"];

/* ── Design tokens ── */
const BLUE_DARK = "#1e3a8a";
const BLUE_MID = "#2563eb";
const BLUE_LIGHT = "#dbeafe";
const BLUE_PALE = "#eff6ff";
const BORDER_STD = `1px solid #bfdbfe`;
const BORDER_STG = `1.5px solid ${BLUE_DARK}`;

/* ════════════════════════════ component ════════════════════════════════ */
export default function CustomerBill({
  data,
  lang = "dari",
  onClose,
  autoPrint = false,
}: Props) {
  const tr = T[lang];

  useEffect(() => {
    if (!autoPrint) return;
    const id = setTimeout(() => window.print(), 350);
    return () => clearTimeout(id);
  }, [autoPrint]);

  /* ── row 1 detail text ── */
  const detailText = data.notes?.trim()
    ? data.notes.trim()
    : `${tr.rentalItem}: ${data.carType}${data.plateNumber ? ` (${data.plateNumber})` : ""}`;

  const hasDelay = (Number(data.delayDays) ?? 0) > 0 || (Number(data.totalDelayPenalty) ?? 0) > 0;
  const delayPenalty = Number(data.totalDelayPenalty || 0);
  const displayTotal = Number(data.finalTotal ?? data.totalRent);
  const displayRemaining = hasDelay
    ? Math.max(0, displayTotal - Number(data.received || 0))
    : Number(data.remaining || 0);

  const TABLE_ROWS = 6;

  /* ── summary data ── */
  const summary = [
    {
      label: tr.rowTotal,
      value: `${fmt(data.totalRent)} ${tr.currency}`,
      bg: BLUE_LIGHT,
      color: BLUE_DARK,
    },
    ...(hasDelay
      ? [
          {
            label: tr.rowDelayPenalty,
            value: `${fmt(delayPenalty)} ${tr.currency}`,
            bg: "#fef2f2",
            color: "#dc2626",
          },
        ]
      : []),
    {
      label: tr.rowFinalTotal,
      value: `${fmt(displayTotal)} ${tr.currency}`,
      bg: "#fee2e2",
      color: "#991b1b",
    },
    {
      label: tr.rowReceived,
      value: `${fmt(data.received)}  ${tr.currency}`,
      bg: "#dcfce7",
      color: "#166534",
    },
    {
      label: tr.rowRemain,
      value: `${fmt(displayRemaining)} ${tr.currency}`,
      bg: "#fee2e2",
      color: "#b91c1c",
    },
  ];

  /* ── info rows ── */
  const infoRows: { label: string; value: string; ltr?: boolean }[][] = [
    [
      {
        label: tr.carType,
        value:
          data.carType + (data.plateNumber ? ` — ${data.plateNumber}` : ""),
      },
      { label: tr.billNo, value: data.billNumber },
    ],
    [
      { label: tr.custName, value: data.customerName },
      {
        label: tr.startDate,
        value:
          formatAfghanDate(data.startDate) +
          (data.startTime ? "  " + data.startTime : ""),
        ltr: true,
      },
    ],
    [
      { label: tr.phone, value: data.customerPhone || "—", ltr: true },
      {
        label: tr.endDate,
        value:
          formatAfghanDate(data.endDate) +
          (data.endTime ? "  " + data.endTime : ""),
        ltr: true,
      },
    ],
  ];

  return (
    <div
      className="bill-wrapper"
      style={{
        minHeight: "100vh",
        background: "#e5e7eb",
        paddingTop: "24px",
        paddingBottom: "24px",
        direction: "rtl",
      }}
    >
      {/* ── Action buttons ── */}
      <div
        className="print:hidden"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => window.print()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "11px 32px",
            borderRadius: "12px",
            background: `linear-gradient(135deg,${BLUE_MID},${BLUE_DARK})`,
            color: "#fff",
            fontWeight: "bold",
            fontSize: "15px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(30,64,175,0.35)",
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
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "11px 24px",
              borderRadius: "12px",
              background: "#fff",
              color: BLUE_DARK,
              fontWeight: "bold",
              fontSize: "15px",
              border: `2px solid ${BLUE_MID}`,
              cursor: "pointer",
              fontFamily: '"Amiri","Noto Naskh Arabic","Vazirmatn",serif',
            }}
          >
            <X style={{ width: 18, height: 18 }} />
            {tr.closeBtn}
          </button>
        )}
      </div>

      {/* ══════════════════ A5 PAPER ══════════════════ */}
      <div
        id="customer-bill-print-area"
        style={{
          width: "148mm",
          minHeight: "210mm",
          margin: "0 auto",
          background: "#fff",
          padding: "5mm 6mm",
          fontFamily: '"Amiri","Noto Naskh Arabic","Vazirmatn",serif',
          direction: "rtl",
          boxSizing: "border-box",
          border: `2px solid ${BLUE_DARK}`,
          fontSize: "9.5pt",
          color: "#0f172a",
        }}
      >
        {/* ══ HEADER ══════════════════════════════════════ */}
        <div
          style={{
            borderBottom: `2px solid ${BLUE_DARK}`,
            paddingBottom: "5px",
            marginBottom: "5px",
          }}
        >
          {/* Logo + Company name + Phones */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {/* Logo */}
            <div style={{ width: "52px", height: "52px", flexShrink: 0 }}>
              <img
                src="/logo.png"
                alt="افشار"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>

            {/* Company name */}
            <div style={{ flex: 1, textAlign: "center", padding: "0 4px" }}>
              <div
                style={{
                  fontSize: "14pt",
                  fontWeight: 900,
                  color: BLUE_DARK,
                  lineHeight: 1.25,
                }}
              >
                {tr.companyName}
              </div>
            </div>

            {/* Phones */}
            <div style={{ flexShrink: 0, direction: "ltr", textAlign: "left" }}>
              <div
                style={{
                  fontSize: "8pt",
                  fontWeight: 700,
                  color: "#374151",
                  lineHeight: 2,
                }}
              >
                <div>📱 0783945133</div>
                <div>☎ 0773492040</div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div
            style={{
              marginTop: "4px",
              fontSize: "7pt",
              color: "#6b7280",
              textAlign: "center",
              borderTop: `1px solid ${BLUE_LIGHT}`,
              paddingTop: "3px",
            }}
          >
            {tr.address}
          </div>
        </div>

        {/* ══ INFO TABLE ══════════════════════════════════ */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: BORDER_STG,
            marginBottom: "5px",
            fontSize: "8.5pt",
          }}
        >
          <tbody>
            {infoRows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      border: BORDER_STD,
                      padding: "3px 6px",
                      width: "50%",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: BLUE_DARK,
                        marginLeft: "4px",
                        whiteSpace: "nowrap",
                        fontSize: "8pt",
                      }}
                    >
                      {cell.label}:
                    </span>
                    <span
                      style={{
                        direction: cell.ltr ? "ltr" : undefined,
                        display: "inline",
                        fontSize: "8.5pt",
                      }}
                    >
                      {cell.value}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* ══ ITEM TABLE ══════════════════════════════════ */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: BORDER_STG,
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: "20px" }} />
            <col />
            <col style={{ width: "52px" }} />
            <col style={{ width: "66px" }} />
            <col style={{ width: "70px" }} />
          </colgroup>

          {/* Table header */}
          <thead>
            <tr style={{ background: BLUE_DARK }}>
              <th
                style={{
                  border: BORDER_STG,
                  padding: "5px 2px",
                  color: "#fff",
                  textAlign: "center",
                  fontSize: "8.5pt",
                  fontWeight: 700,
                }}
              >
                {tr.colNo}
              </th>
              <th
                style={{
                  border: BORDER_STG,
                  padding: "5px 6px",
                  color: "#fff",
                  textAlign: "right",
                  fontSize: "8.5pt",
                  fontWeight: 700,
                }}
              >
                {tr.colDetails}
              </th>
              <th
                style={{
                  border: BORDER_STG,
                  padding: "5px 2px",
                  color: "#fff",
                  textAlign: "center",
                  fontSize: "8.5pt",
                  fontWeight: 700,
                }}
              >
                {tr.colQty}
              </th>
              <th
                style={{
                  border: BORDER_STG,
                  padding: "5px 2px",
                  color: "#fff",
                  textAlign: "center",
                  fontSize: "8.5pt",
                  fontWeight: 700,
                }}
              >
                {tr.colPrice}
              </th>
              <th
                style={{
                  border: BORDER_STG,
                  padding: "5px 2px",
                  color: "#fff",
                  textAlign: "center",
                  fontSize: "8.5pt",
                  fontWeight: 700,
                }}
              >
                {tr.colTotal}
              </th>
            </tr>
          </thead>

          {/* Data rows */}
          <tbody>
            {Array.from({ length: TABLE_ROWS }, (_, i) => {
              const filled = i === 0;
              const bg = filled ? "#f0f7ff" : i % 2 === 0 ? "#fff" : "#fafbff";
              return (
                <tr key={i} style={{ background: bg, height: "26px" }}>
                  {/* # */}
                  <td
                    style={{
                      border: BORDER_STD,
                      textAlign: "center",
                      fontWeight: 700,
                      color: BLUE_DARK,
                      fontSize: "10pt",
                      verticalAlign: "middle",
                      background: "#f1f5f9",
                    }}
                  >
                    {NUM[i]}
                  </td>
                  {/* Details */}
                  <td
                    style={{
                      border: BORDER_STD,
                      padding: "3px 6px",
                      fontSize: "8.5pt",
                      verticalAlign: "middle",
                      fontWeight: filled ? 600 : "normal",
                      wordBreak: "break-word",
                      lineHeight: 1.5,
                    }}
                  >
                    {filled ? detailText : ""}
                  </td>
                  {/* Qty */}
                  <td
                    style={{
                      border: BORDER_STD,
                      textAlign: "center",
                      direction: "ltr",
                      fontSize: "8.5pt",
                      fontWeight: filled ? 600 : "normal",
                      verticalAlign: "middle",
                    }}
                  >
                    {filled ? `${data.rentalDays} ${tr.days}` : ""}
                  </td>
                  {/* Price */}
                  <td
                    style={{
                      border: BORDER_STD,
                      textAlign: "center",
                      direction: "ltr",
                      fontSize: "8.5pt",
                      fontWeight: filled ? 600 : "normal",
                      verticalAlign: "middle",
                    }}
                  >
                    {filled ? `${fmt(data.dailyRate)}` : ""}
                  </td>
                  {/* Total */}
                  <td
                    style={{
                      border: BORDER_STD,
                      textAlign: "center",
                      direction: "ltr",
                      fontSize: "8.5pt",
                      fontWeight: filled ? 700 : "normal",
                      color: filled ? BLUE_DARK : "inherit",
                      verticalAlign: "middle",
                    }}
                  >
                    {filled ? `${fmt(data.totalRent)}` : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ══ FOOTER SUMMARY — single horizontal row ═══════ */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            border: `2px solid ${BLUE_DARK}`,
            marginTop: "-1px",
            overflow: "hidden",
          }}
        >
          {(
            [
              {
                label: tr.rowTotal,
                value: fmt(data.totalRent),
                currency: tr.currency,
                bg: BLUE_LIGHT,
                color: BLUE_DARK,
              },
              ...(hasDelay
                ? [
                    {
                      label: tr.rowDelayPenalty,
                      value: fmt(delayPenalty),
                      currency: tr.currency,
                      bg: "#fef2f2",
                      color: "#dc2626",
                    },
                  ]
                : []),
              {
                label: tr.rowFinalTotal,
                value: fmt(displayTotal),
                currency: tr.currency,
                bg: "#fee2e2",
                color: "#991b1b",
              },
              {
                label: tr.rowReceived,
                value: fmt(data.received),
                currency: tr.currency,
                bg: "#dcfce7",
                color: "#166534",
              },
              {
                label: tr.rowRemain,
                value: fmt(displayRemaining),
                currency: tr.currency,
                bg: "#fee2e2",
                color: "#b91c1c",
              },
            ] as const
          ).map(({ label, value, currency, bg, color }, idx, arr) => (
            <div
              key={label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                background: bg,
                padding: "7px 8px",
                borderRight:
                  idx < arr.length - 1 ? `1.5px solid ${BLUE_DARK}` : "none",
              }}
            >
              {/* Label */}
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "9.5pt",
                  color,
                  whiteSpace: "nowrap",
                }}
              >
                {label}:
              </span>
              {/* Value + currency */}
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "10pt",
                  color,
                  direction: "ltr",
                  whiteSpace: "nowrap",
                }}
              >
                {value}
                <span
                  style={{
                    fontSize: "7.5pt",
                    fontWeight: 500,
                    marginRight: "2px",
                  }}
                >
                  {" "}
                  {currency}
                </span>
              </span>
            </div>
          ))}
        </div>

        {/* ══ SIGNATURE ════════════════════════════════════ */}
        <div
          style={{
            marginTop: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingTop: "6px",
            borderTop: `1px dashed ${BLUE_LIGHT}`,
          }}
        >
          {/* Signature line */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "9pt",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                color: BLUE_DARK,
                whiteSpace: "nowrap",
              }}
            >
              {tr.signature}:
            </span>
            <span
              style={{
                display: "inline-block",
                borderBottom: `1px solid #374151`,
                width: "120px",
                height: "18px",
              }}
            />
          </div>
        </div>
      </div>
      {/* /A5 */}

      {/* ── Print CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
        @media print {
          @page { size: A5 portrait; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden !important; }
          .print\\:hidden { display: none !important; }
          #customer-bill-print-area,
          #customer-bill-print-area * { visibility: visible !important; }
          #customer-bill-print-area {
            position: fixed !important;
            top: 0 !important; left: 0 !important; right: 0 !important;
            width: 148mm !important; min-height: 210mm !important;
            margin: 0 !important; padding: 5mm 6mm !important;
            border: 2px solid ${BLUE_DARK} !important;
            box-shadow: none !important; background: #fff !important;
            direction: rtl !important;
          }
        }
      `}</style>
    </div>
  );
}
