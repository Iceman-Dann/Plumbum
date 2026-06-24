export interface JsPDFInstance {
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
