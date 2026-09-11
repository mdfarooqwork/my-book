import { Book } from "../data/books";
import { readCoverPalette } from "./openLibrary";

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Simple RFC 4180 CSV parser
function parseCSV(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let row = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        row += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      if (row.trim()) lines.push(row);
      row = "";
    } else {
      row += char;
    }
  }
  if (row.trim()) lines.push(row);

  if (lines.length === 0) return [];

  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let cell = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const n = line[i + 1];
      if (c === '"') {
        if (q && n === '"') {
          cell += '"';
          i++;
        } else {
          q = !q;
        }
      } else if (c === "," && !q) {
        cells.push(cell.trim());
        cell = "";
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const headers = parseRow(lines[0]);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || "";
    });
    records.push(obj);
  }

  return records;
}

export async function parseGoodreadsExport(csvText: string): Promise<Book[]> {
  const records = parseCSV(csvText);

  // Filter only "read" or "currently-reading"
  const valid = records.filter((r) => {
    const shelf = (r["Exclusive Shelf"] || "").toLowerCase();
    return shelf === "read" || shelf === "currently-reading";
  });

  const parsedBooks: Book[] = [];

  for (let i = 0; i < valid.length; i++) {
    const r = valid[i];
    const title = (r["Title"] || "").replace(/=?"(.*)"?/, "$1").trim();
    const author = (r["Author"] || "").trim();
    const isbn = (r["ISBN"] || r["ISBN13"] || "").replace(/[^0-9X]/gi, "");
    const pages = parseInt(r["Number of Pages"] || "300", 10) || 300;
    const publisher = (r["Publisher"] || "").trim();
    const rating = parseInt(r["My Rating"] || "0", 10) || 0;
    const year =
      parseInt(r["Year Published"] || r["Original Publication Year"] || "0", 10) || 0;

    const dateReadStr = r["Date Read"] || "";
    let finished = "";
    if (dateReadStr) {
      try {
        const d = new Date(dateReadStr);
        if (!isNaN(d.getTime())) {
          const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
          ];
          finished = `${months[d.getMonth()]} ${d.getFullYear()}`;
        }
      } catch (e) {
        finished = dateReadStr;
      }
    }

    const hash = hashString(`${title}-${author}-${i}`);

    // Physical fields derivation
    const binding: "hardcover" | "paperback" | "mass" =
      pages > 420 ? "hardcover" : pages < 260 ? "mass" : "paperback";
    const finish: "cloth" | "gloss" | "matte" =
      binding === "hardcover" ? "cloth" : hash % 2 === 0 ? "gloss" : "matte";
    const height =
      binding === "hardcover"
        ? 236 + (hash % 18)
        : binding === "mass"
        ? 196 + (hash % 14)
        : 214 + (hash % 16);
    const jitter = (hash % 7) - 3;
    const width = Math.max(16, Math.min(58, Math.round(pages * 0.055 + jitter)));
    const lean = -((hash % 50) / 10);
    const depth = (hash % 15) - 7;
    const wear = Math.round(((hash % 35) / 100) * 100) / 100;

    const faces: ("serif" | "sans" | "mono")[] = ["serif", "serif", "sans", "mono"];
    const face = faces[hash % faces.length];
    const caps = hash % 3 === 0;

    // Genres mapping
    const genres: string[] = ["Fiction"];

    // Cover art link
    const coverUrl = isbn
      ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
      : "";

    parsedBooks.push({
      id: `goodreads-${i}-${hash}`,
      title,
      author,
      genres,
      cover: coverUrl,
      year,
      blurb: `${title} by ${author}, published by ${publisher || "Unknown"}.`,
      rating,
      finished: finished || "Read",
      publisher,
      binding,
      finish,
      spine: "#3b2b23",
      band: "#c2884a",
      ink: "#faf7f0",
      face,
      caps,
      width,
      height,
      lean,
      depth,
      wear,
    });
  }

  return parsedBooks;
}
