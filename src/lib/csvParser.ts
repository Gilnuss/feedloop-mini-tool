/**
 * CSV parser with auto-column detection.
 * Identifies the most likely "feedback text" column by average string length.
 */

const MAX_CSV_SIZE = 500 * 1024; // 500KB
const MAX_CSV_ROWS = 200;

// Characters that can trigger formula execution in spreadsheet apps
const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/;

/** Strip leading formula-injection characters from a cell value. */
function stripFormulaPrefix(value: string): string {
  let v = value;
  while (v.length > 0 && FORMULA_PREFIX_RE.test(v)) {
    v = v.slice(1);
  }
  return v;
}

/**
 * Parse CSV text into rows of key-value objects.
 * Handles: quoted fields, commas in values, BOM markers, \r\n.
 * Enforced limits: 500KB max size, 200 row max.
 */
export function parseCSV(text: string): Record<string, string>[] {
  // Early size check
  if (text.length > MAX_CSV_SIZE) {
    throw new Error(`CSV too large: ${Math.round(text.length / 1024)}KB. Max: ${MAX_CSV_SIZE / 1024}KB.`);
  }

  // Strip BOM
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const lines = splitCSVLines(clean);
  if (lines.length < 2) return [];

  const headers = parseCSVRow(lines[0]).map(h => stripFormulaPrefix(h));
  const rows: Record<string, string>[] = [];

  const maxDataLines = Math.min(lines.length, MAX_CSV_ROWS + 1); // +1 for header
  for (let i = 1; i < maxDataLines; i++) {
    const values = parseCSVRow(lines[i]);
    if (values.every((v) => v.trim() === "")) continue; // skip empty rows

    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j].trim()] = stripFormulaPrefix((values[j] || "").trim());
    }
    rows.push(row);
  }

  return rows;
}

function splitCSVLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === "\n" && !inQuotes) {
      lines.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current);
  return lines;
}

function parseCSVRow(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

/**
 * Auto-detect which column contains feedback text.
 * Returns the column name with the highest average string length.
 */
export function detectFeedbackColumn(rows: Record<string, string>[]): string {
  if (rows.length === 0) return "";

  const columns = Object.keys(rows[0]);
  let bestCol = columns[0];
  let bestAvg = 0;

  for (const col of columns) {
    const avg =
      rows.reduce((sum, row) => sum + (row[col] || "").length, 0) / rows.length;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestCol = col;
    }
  }

  return bestCol;
}

/**
 * Extract feedback items from CSV text.
 * Auto-detects the feedback column, or uses the specified column name.
 */
export function extractFeedbackFromCSV(
  csvText: string,
  columnName?: string,
): { items: string[]; columns: string[]; detectedColumn: string } {
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return { items: [], columns: [], detectedColumn: "" };
  }

  const columns = Object.keys(rows[0]);
  const detectedColumn = columnName || detectFeedbackColumn(rows);

  const items = rows
    .map((row) => row[detectedColumn] || "")
    .filter((item) => item.trim().length > 0);

  return { items, columns, detectedColumn };
}
