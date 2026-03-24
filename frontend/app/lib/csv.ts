// @AI-HINT: Centralized, safe client-side exporters. CSV is native; XLSX/PDF gracefully fallback to CSV until libs are introduced.

export type Cell = string | number | boolean | null | undefined;
export type Row = Cell[];
export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ExportOptions {
  // When set, filter to only these column indices (e.g., respecting column visibility)
  visibleIndices?: number[];
  // When set, export only the provided rows (already filtered by selection)
  selectedRows?: Row[];
  // File extension override; normally inferred by format
  extensionOverride?: string;
}

function escapeCSVValue(v: unknown): string {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

export function toCSV(headers: string[], rows: Row[]): string {
  return [headers, ...rows].map(cols => cols.map(escapeCSVValue).join(',')).join('\n');
}

function downloadBlob(content: string | ArrayBuffer, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCSV(csv: string, filename: string) {
  const name = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  downloadBlob(csv, 'text/csv;charset=utf-8;', name);
}

function applyVisibility(headers: string[], rows: Row[], visible?: number[]): { headers: string[]; rows: Row[] } {
  if (!visible || visible.length === 0) return { headers, rows };
  const h = visible.map(i => headers[i]).filter(h => h != null);
  const r = rows.map(row => visible.map(i => row[i]));
  return { headers: h, rows: r };
}

export function exportCSV(headers: string[], rows: Row[], filename: string, options: ExportOptions = {}) {
  const sourceRows = options.selectedRows ?? rows;
  const { headers: h, rows: r } = applyVisibility(headers, sourceRows, options.visibleIndices);
  const csv = toCSV(h, r);
  downloadCSV(csv, filename);
}

export function exportData(format: ExportFormat, headers: string[], rows: Row[], filename: string, options: ExportOptions = {}) {
  // For now, XLSX/PDF fall back to CSV to keep the app fully runnable without extra deps.
  if (format === 'csv') return exportCSV(headers, rows, filename, options);
  const ext = options.extensionOverride || (format === 'xlsx' ? '.xlsx' : '.pdf');
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[exportData] ${format.toUpperCase()} fallback: exporting CSV until libraries are added.`);
  }
  const name = filename.endsWith(ext) ? filename.replace(ext, '') : filename;
  return exportCSV(headers, rows, name, options);
}
