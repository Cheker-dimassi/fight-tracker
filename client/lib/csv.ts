/**
 * RFC 4180-compliant CSV parser.
 *
 * Single-pass, field-by-field over the raw text so that quoted fields
 * containing escaped double-quotes (e.g. the inch marks in `"5' 11""`)
 * are handled correctly at both the row AND field level.
 *
 * The old two-pass approach (split rows first, then split fields) failed
 * because the row-splitter couldn't distinguish `""` (escaped quote,
 * field continues) from `""` at end of field (field closes), causing
 * Height / Weight / Reach to collapse into a single mis-keyed column.
 */
export function parseCsv(text: string): Record<string, string>[] {
  // ── single-pass tokeniser ────────────────────────────────────────────────
  const allRows: string[][] = [];
  let curField = '';
  let curRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          // Escaped double-quote → emit one literal "
          curField += '"';
          i++;
        } else {
          // Closing quote — field is NOT finished yet; just toggle state.
          // The next char must be , or \n/\r to end the field.
          inQuotes = false;
        }
      } else {
        curField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        curRow.push(curField.trim());
        curField = '';
      } else if (ch === '\r' || ch === '\n') {
        curRow.push(curField.trim());
        curField = '';
        if (curRow.some(f => f !== '')) {
          allRows.push(curRow);
        }
        curRow = [];
        if (ch === '\r' && next === '\n') i++; // CRLF → skip \n
      } else {
        curField += ch;
      }
    }
  }
  // flush last field / row
  curRow.push(curField.trim());
  if (curRow.some(f => f !== '')) allRows.push(curRow);

  // ── map to records ───────────────────────────────────────────────────────
  if (allRows.length === 0) return [];
  const header = allRows[0];
  const records: Record<string, string>[] = [];
  for (let i = 1; i < allRows.length; i++) {
    const cols = allRows[i];
    const rec: Record<string, string> = {};
    for (let c = 0; c < header.length; c++) {
      rec[header[c]] = cols[c] ?? '';
    }
    records.push(rec);
  }
  return records;
}

/** Split a single CSV line into fields (used for non-whole-file cases). */
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
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}
