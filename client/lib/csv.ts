// Lightweight CSV parser supporting commas in quotes and header mapping
// Returns array of records where keys are from the header row
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        // Escaped quote
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === '\n' || ch === '\r') {
      // Normalize CRLF/CR to LF as row separator only when not in quotes
      if (!inQuotes) {
        if (cur.length) {
          rows.push(cur);
          cur = '';
        }
        // Skip the paired char in CRLF
        if (ch === '\r' && next === '\n') i++;
      } else {
        cur += ch;
      }
    } else {
      cur += ch;
    }
  }
  if (cur.length) rows.push(cur);

  if (rows.length === 0) return [];
  const header = splitCsvLine(rows[0]);
  const records: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].trim()) continue;
    const cols = splitCsvLine(rows[i]);
    const rec: Record<string, string> = {};
    for (let c = 0; c < header.length; c++) {
      rec[header[c]] = cols[c] ?? '';
    }
    records.push(rec);
  }
  return records;
}

export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  // Trim outer whitespace
  return out.map(s => s.trim());
}
