import { Book } from "../data/books";

export interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  number_of_pages_median?: number;
  publisher?: string[];
}

export interface OpenLibraryResult {
  key: string;
  title: string;
  author: string;
  year: number;
  coverUrl: string;
  pages: number;
  publisher: string;
}

// 1. searchBooks
export async function searchBooks(
  q: string,
  signal?: AbortSignal
): Promise<OpenLibraryResult[]> {
  const query = encodeURIComponent(q.trim());
  if (!query) return [];

  const url = `https://openlibrary.org/search.json?q=${query}&limit=12&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median,publisher`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    const docs: OpenLibraryDoc[] = data.docs || [];

    return docs
      .filter((d) => d.title && d.cover_i)
      .map((d) => ({
        key: d.key,
        title: d.title,
        author: d.author_name?.[0] || "Unknown Author",
        year: d.first_publish_year || 0,
        coverUrl: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`,
        pages: d.number_of_pages_median || 320,
        publisher: d.publisher?.[0] || "",
      }));
  } catch (err: any) {
    if (err.name === "AbortError") return [];
    console.error("Open Library search failed:", err);
    return [];
  }
}

// Simple deterministic hash
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// 2. readCoverPalette
export async function readCoverPalette(src: string): Promise<{
  spine: string;
  band: string;
  ink: string;
}> {
  return new Promise((resolve) => {
    const defaultPalette = {
      spine: "#3b2b23",
      band: "#c2884a",
      ink: "#faf7f0",
    };

    if (!src) {
      resolve(defaultPalette);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = 80;
        const h = Math.round((img.naturalHeight / img.naturalWidth) * w) || 120;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(defaultPalette);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const edgeW = Math.max(2, Math.round(w * 0.06));
        const edgeData = ctx.getImageData(0, 0, edgeW, h).data;

        // Sample left edge for spine
        let rSum = 0,
          gSum = 0,
          bSum = 0,
          count = 0;

        for (let i = 0; i < edgeData.length; i += 4) {
          rSum += edgeData[i];
          gSum += edgeData[i + 1];
          bSum += edgeData[i + 2];
          count++;
        }

        const avgR = Math.round(rSum / count);
        const avgG = Math.round(gSum / count);
        const avgB = Math.round(bSum / count);

        const spine = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB)
          .toString(16)
          .slice(1)}`;

        // Luminance of spine
        const lum = (0.299 * avgR + 0.587 * avgG + 0.114 * avgB) / 255;
        const ink = lum > 0.55 ? "#241f19" : "#faf7f0";

        // Find most saturated mid-luminance pixel across full cover for band
        const fullData = ctx.getImageData(0, 0, w, h).data;
        let maxSat = -1;
        let bestBand = "#c2884a";

        for (let i = 0; i < fullData.length; i += 16) {
          const r = fullData[i] / 255;
          const g = fullData[i + 1] / 255;
          const b = fullData[i + 2] / 255;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const l = (max + min) / 2;
          const d = max - min;
          const sat = l > 0 && l < 1 ? d / (1 - Math.abs(2 * l - 1)) : 0;

          if (l > 0.3 && l < 0.75 && sat > maxSat) {
            maxSat = sat;
            const br = Math.round(r * 255);
            const bg = Math.round(g * 255);
            const bb = Math.round(b * 255);
            bestBand = `#${((1 << 24) + (br << 16) + (bg << 8) + bb)
              .toString(16)
              .slice(1)}`;
          }
        }

        resolve({ spine, band: bestBand, ink });
      } catch (e) {
        // Fallback on CORS canvas taint
        resolve(defaultPalette);
      }
    };

    img.onerror = () => {
      resolve(defaultPalette);
    };

    img.src = src;
  });
}

// 3. buildBook
export async function buildBook(
  item: OpenLibraryResult,
  extra?: { recommender?: string; note?: string }
): Promise<Book> {
  const hash = hashString(item.key || item.title);

  const pages = item.pages || 300;
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

  const lean = -((hash % 50) / 10); // -5..0
  const depth = (hash % 15) - 7; // -7..7
  const wear = Math.round(((hash % 35) / 100) * 100) / 100; // 0..0.35

  const faces: ("serif" | "sans" | "mono")[] = ["serif", "serif", "sans", "mono"];
  const face = faces[hash % faces.length];
  const caps = hash % 3 === 0;

  // Cover palette extraction
  let palette = {
    spine: "#3a2d26",
    band: "#be7839",
    ink: "#faf7f0",
  };

  try {
    palette = await readCoverPalette(item.coverUrl);
  } catch (err) {
    // Keep fallback palette
  }

  const now = new Date();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const finishedStr = extra?.recommender
    ? `Recommended by ${extra.recommender}`
    : `${months[now.getMonth()]} ${now.getFullYear()}`;

  return {
    id: `rec-${item.key.replace(/\W+/g, "-")}-${Date.now()}`,
    title: item.title,
    author: item.author,
    genres: ["Fiction"],
    cover: item.coverUrl,
    year: item.year,
    blurb: extra?.note || `${item.title} by ${item.author}.`,
    rating: 0,
    finished: finishedStr,
    recommender: extra?.recommender,
    publisher: item.publisher || "",
    binding,
    finish,
    spine: palette.spine,
    band: palette.band,
    ink: palette.ink,
    face,
    caps,
    width,
    height,
    lean,
    depth,
    wear,
  };
}
