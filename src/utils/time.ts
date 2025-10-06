export function normalizeTimestampToISO(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return "";
  try {
    const match = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.(\d{3})\d*(?:([+-]\d{2})(\d{2})|([+-]\d{4})|Z|([+-]\d{2}:\d{2}))?$/);
    if (match) {
      const base = match[1];
      const ms = match[2];
      let offset = "Z";
      if (match[6]) {
        offset = match[6];
      } else if (match[3] && match[4]) {
        offset = `${match[3]}:${match[4]}`;
      } else if (match[5]) {
        const off = match[5];
        offset = `${off.slice(0,3)}:${off.slice(3,5)}`;
      }
      return `${base}.${ms}${offset}`;
    }
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString();
    return raw;
  } catch {
    return raw;
  }
}


