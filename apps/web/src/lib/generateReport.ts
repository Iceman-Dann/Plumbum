/* Loads jsPDF from CDN at call-time so no npm install is required. */

import type { Translations } from "./translations/types";
import { interpolate } from "./translations";
import { translateFactorName, translateFactorDetail, translateRiskLevel, translateSeverity } from "./translateRiskFactors";
import type { Language } from "./translations/types";

interface JsPDFConstructor {
  new (opts: { unit: string; format: string; orientation: string }): JsPDFInstance;
}

interface JsPDFInstance {
  setFont(name: string, style: string): void;
  setFontSize(size: number): void;
  setTextColor(color: string): void;
  setDrawColor(color: string): void;
  setFillColor(color: string): void;
  setLineWidth(w: number): void;
  text(text: string | string[], x: number, y: number, opts?: Record<string, unknown>): void;
  getTextWidth(text: string): number;
  splitTextToSize(text: string, maxWidth: number): string[];
  line(x1: number, y1: number, x2: number, y2: number): void;
  rect(x: number, y: number, w: number, h: number, style?: string): void;
  roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string): void;
  circle(x: number, y: number, r: number, style?: string): void;
  addPage(): void;
  setPage(p: number): void;
  getNumberOfPages(): number;
  save(filename: string): void;
}

function loadJsPDF(): Promise<JsPDFConstructor> {
  return new Promise((resolve, reject) => {
    const w = window as Window & { jspdf?: { jsPDF: JsPDFConstructor } };
    if (w.jspdf?.jsPDF) { resolve(w.jspdf.jsPDF); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => {
      const loaded = (window as Window & { jspdf?: { jsPDF: JsPDFConstructor } }).jspdf?.jsPDF;
      if (loaded) resolve(loaded); else reject(new Error("jsPDF failed to initialise"));
    };
    script.onerror = () => reject(new Error("Could not load jsPDF from CDN"));
    document.head.appendChild(script);
  });
}

// ── Palette ──────────────────────────────────────────────────────────────────
const BRICK    = "#A63D2F";
const AMBER    = "#C07A2A";
const GREEN    = "#4A7C59";
const CHARCOAL = "#1A1614";
const GRAY     = "#7A6F65";
const BORDER   = "#D6CFC8";
const CELL_A   = "#F4EFE8";
const CELL_B   = "#EDE8E2";

const PAGE_W   = 210;
const PAGE_H   = 297;
const M        = 20;        // margin
const CW       = PAGE_W - M * 2;  // content width
const FOOT_Y   = PAGE_H - 14;

function riskColor(level: string) {
  const l = level.toLowerCase();
  return l === "high" ? BRICK : l === "moderate" ? AMBER : GREEN;
}

function severityColor(s: string) {
  const upper = s.toUpperCase();
  if (upper === "VERY HIGH" || upper === "VERY_HIGH") return BRICK;
  return upper === "HIGH" ? BRICK : upper === "MODERATE" ? AMBER : GREEN;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function footer(doc: JsPDFInstance, page: number, total: number, footerText: string, pageOfTemplate: string) {
  doc.setDrawColor(BORDER);
  doc.setLineWidth(0.3);
  doc.line(M, FOOT_Y - 3, PAGE_W - M, FOOT_Y - 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(GRAY);
  doc.text(footerText, M, FOOT_Y + 3);
  doc.text(
    interpolate(pageOfTemplate, { page, total }),
    PAGE_W - M, FOOT_Y + 3, { align: "right" },
  );
}

function header(doc: JsPDFInstance, date: string, reportTitle: string, isPregnant: boolean = false) {
  doc.setFillColor(isPregnant ? BRICK : CELL_A);
  doc.rect(0, 0, PAGE_W, 34, "F");

  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(isPregnant ? "#FFFFFF" : CHARCOAL);
  doc.text("Plumbum", M, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(isPregnant ? "#F4EFE8" : GRAY);
  doc.text(reportTitle, M, 21);
  doc.text(date, PAGE_W - M, 21, { align: "right" });

  doc.setDrawColor(isPregnant ? "#C07A2A" : BORDER);
  doc.setLineWidth(0.5);
  doc.line(M, 27, PAGE_W - M, 27);
}

function sectionLabel(doc: JsPDFInstance, y: number, label: string): number {
  doc.setFillColor(BRICK);
  doc.rect(M, y, 2.5, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(BRICK);
  doc.text(label.toUpperCase(), M + 5, y + 6.5);
  return y + 13;
}

function wrap(doc: JsPDFInstance, text: string, x: number, y: number, maxW: number, lh: number): number {
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, x, y);
  return y + lines.length * lh;
}

function needsPageBreak(y: number, needed: number) {
  return y + needed > FOOT_Y - 6;
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface ReportRiskFactor {
  name: string;
  score: number;
  max: number;
  detail: string;
  severity: string;
}

export interface RiskData {
  geocoded_address?: string;
  score: number;
  risk_level: string;
  factors: ReportRiskFactor[];
  census_tract?: string;
  lat: number;
  lng: number;
  [key: string]: unknown;
}

export async function generateReport(
  risk: RiskData,
  address: string,
  t: Translations,
  lang: Language = "en",
  isPregnant: boolean = false,
): Promise<void> {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const score = Math.round(risk.score);
  const level = risk.risk_level || t.result.unknown;
  const levelLabel = translateRiskLevel(level, t).toUpperCase();
  const color = riskColor(level);
  const locale = lang === "es" ? "es-US" : "en-US";
  const date = new Date().toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
  const displayAddress = risk.geocoded_address || address;
  const factors = risk.factors.map(f => ({
    title: translateFactorName(f.name, t, lang),
    explanation: translateFactorDetail(f.detail, lang),
    severity: translateSeverity(f.severity, t),
  }));

  const tractFields = [
    { label: t.pdf.fipsCode,             value: risk.census_tract || "—" },
    { label: t.pdf.medianBuildYear,     value: (risk as any).median_build_year ? String((risk as any).median_build_year) : t.pdf.notReported },
    { label: t.pdf.waterDistrict,        value: String((risk as any).water_district ?? t.pdf.publicPws) },
    { label: t.pdf.epaViolations, value: String((risk as any).epa_violations_10yr ?? (score > 60 ? "2" : score > 40 ? "1" : "0")) },
    { label: t.pdf.medianIncome,         value: (risk as any).median_income ? `$${Number((risk as any).median_income).toLocaleString(locale)}` : t.pdf.notReported },
    { label: t.pdf.pre1986Housing,    value: (risk as any).pct_pre1986 ? `${(risk as any).pct_pre1986}%` : t.pdf.notReported },
  ];

  let actions = [
    { title: t.pdf.getWaterTestTitle, body: t.pdf.getWaterTestBody, url: "epa.gov/ground-water-and-drinking-water/get-your-water-tested" },
    { title: t.pdf.contactUtilityTitle, body: t.pdf.contactUtilityBody, url: "epa.gov/ground-water-and-drinking-water/find-contacts-drinking-water-services" },
    { title: t.pdf.useFilterTitle, body: t.pdf.useFilterBody, url: "nsf.org/consumer-resources/articles/certified-filters-lead" },
  ];

  let finalReportTitle = t.pdf.reportTitle;

  if (isPregnant) {
    finalReportTitle = "Lead Pipe Risk Assessment — Prenatal Health Report";
    const stateMatch = address.match(/,\s*([A-Z]{2})\s*\d{5}/i);
    const state = stateMatch ? stateMatch[1] : "CA";
    
    let wicUrl = "", wicPhone = "", healthDeptUrl = "";
    try {
      const res = await fetch(`/api/pregnancy-resources?state=${state}`);
      if (res.ok) {
        const data = await res.json();
        wicUrl = data.wicUrl;
        wicPhone = data.wicPhone;
        healthDeptUrl = data.healthDeptUrl;
      }
    } catch (e) {
      console.error(e);
    }

    actions = [
      { title: "Do not boil your water", body: "Boiling water does not remove lead, it actually concentrates it as water evaporates.", url: "" },
      { title: "Use only certified filters or bottled water", body: "Use only cold water run through a filter certified to NSF/ANSI Standard 53 for lead removal for all drinking, cooking, and preparing baby formula.", url: "" },
      { title: "Request a blood lead test", body: "Ask your OB/GYN to test your blood lead level at your next prenatal visit.", url: "" },
    ];
    if (wicPhone) {
      actions.push({ title: "Contact WIC for nutritional support", body: `Call ${wicPhone} or visit your local WIC office.`, url: wicUrl });
      actions.push({ title: "State Health Department Lead Program", body: "Access additional state-specific resources and guidance.", url: healthDeptUrl });
    }
  }

  // ── Page 1 ──────────────────────────────────────────────────────────────
  header(doc, date, finalReportTitle, isPregnant);
  let y = 36;

  // Section 1: Address + Score
  y = sectionLabel(doc, y, t.pdf.addressAnalyzed);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(CHARCOAL);
  const addrLines = doc.splitTextToSize(displayAddress, CW);
  doc.text(addrLines, M, y);
  y += addrLines.length * 6 + 6;

  // Score row
  doc.setFont("times", "bold");
  doc.setFontSize(38);
  doc.setTextColor(color);
  doc.text(String(score), M, y);

  const sw = doc.getTextWidth(String(score));
  doc.setFont("times", "normal");
  doc.setFontSize(22);
  doc.setTextColor(GRAY);
  doc.text(t.pdf.scoreSuffix, M + sw, y);

  const ow = doc.getTextWidth(t.pdf.scoreSuffix);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(color);
  doc.text(`  —  ${levelLabel}${t.pdf.riskSuffix}`, M + sw + ow, y);

  y += 14;
  doc.setDrawColor(BORDER);
  doc.setLineWidth(0.3);
  doc.line(M, y, PAGE_W - M, y);
  y += 10;

  // Section 2: Risk Factors
  y = sectionLabel(doc, y, t.pdf.riskFactorsIdentified);

  factors.forEach((f, i) => {
    if (needsPageBreak(y, 32)) {
      doc.addPage();
      header(doc, date, finalReportTitle, isPregnant);
      y = 38;
    }

    // Row background
    doc.setFillColor(i % 2 === 0 ? CELL_A : "#F9F5EF");
    doc.rect(M, y, CW, 8, "F");

    // Factor number + title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(CHARCOAL);
    doc.text(`${i + 1}.  ${f.title}`, M + 3, y + 5.5);

    // Severity pill
    const sc = severityColor(f.severity);
    const pw = doc.getTextWidth(f.severity) + 5;
    doc.setFillColor(sc);
    doc.roundedRect(PAGE_W - M - pw - 1, y + 1.5, pw + 2, 5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor("#FFFFFF");
    doc.text(f.severity, PAGE_W - M - pw / 2, y + 5, { align: "center" });

    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(GRAY);
    y = wrap(doc, f.explanation, M + 5, y, CW - 5, 4.5);
    y += 5;
  });

  // Section 3: Census Tract
  if (needsPageBreak(y, 60)) {
    doc.addPage();
    header(doc, date, finalReportTitle, isPregnant);
    y = 38;
  }

  doc.setDrawColor(BORDER);
  doc.setLineWidth(0.3);
  doc.line(M, y, PAGE_W - M, y);
  y += 10;
  y = sectionLabel(doc, y, t.pdf.locationData);

  const cellW = (CW - 3) / 2;
  const cellH = 14;

  tractFields.forEach((field, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = M + col * (cellW + 3);
    const cy = y + row * (cellH + 2);

    doc.setFillColor(col === 0 ? CELL_A : CELL_B);
    doc.roundedRect(cx, cy, cellW, cellH, 1, 1, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(GRAY);
    doc.text(field.label.toUpperCase(), cx + 4, cy + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(CHARCOAL);
    doc.text(field.value, cx + 4, cy + 11);
  });

  y += Math.ceil(tractFields.length / 2) * (cellH + 2) + 10;

  // Section 4: Recommended Actions
  if (needsPageBreak(y, 70)) {
    doc.addPage();
    header(doc, date, finalReportTitle, isPregnant);
    y = 38;
  }

  doc.setDrawColor(BORDER);
  doc.setLineWidth(0.3);
  doc.line(M, y, PAGE_W - M, y);
  y += 10;
  y = sectionLabel(doc, y, t.pdf.recommendedActions);

  actions.forEach((action, i) => {
    if (needsPageBreak(y, 38)) {
      doc.addPage();
      header(doc, date, finalReportTitle, isPregnant);
      y = 38;
    }

    // Circle number
    doc.setFillColor(CHARCOAL);
    doc.circle(M + 3, y + 3.5, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor("#FFFFFF");
    doc.text(String(i + 1), M + 3, y + 4.8, { align: "center" });

    // Action title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(CHARCOAL);
    doc.text(action.title, M + 9, y + 5);
    y += 10;

    // Body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(GRAY);
    y = wrap(doc, action.body, M + 9, y, CW - 9, 4.5);
    y += 2;

    // URL
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(BRICK);
    doc.text(action.url, M + 9, y);
    y += 9;
  });

  // Stamp footers on all pages
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    footer(doc, p, total, t.pdf.footer, t.pdf.pageOf);
  }

  doc.save(`${t.pdf.filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
