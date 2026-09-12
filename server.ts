import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { books } from "./src/data/books";

const currentDir = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Initialize Gemini client lazily
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // POST /api/search - Natural language library search
  app.post("/api/search", async (req, res) => {
    try {
      const { query, customBooks } = req.body;
      const cleanQuery = typeof query === "string" ? query.trim() : "";

      if (!cleanQuery) {
        return res.json({ ids: [] });
      }

      const bookList = Array.isArray(customBooks) && customBooks.length > 0
        ? customBooks
        : books;

      // Pre-filter candidate books if catalogue is large (> 60 books) for swift LLM evaluation
      let candidateBooks = bookList;
      if (bookList.length > 60) {
        const qLower = cleanQuery.toLowerCase();
        const tokens = qLower.split(/\s+/).filter((t: string) => t.length > 1);
        const preScored = bookList.map((b) => {
          const title = (b.title || "").toLowerCase();
          const author = (b.author || "").toLowerCase();
          const genres = (b.genres || []).join(" ").toLowerCase();
          const blurb = (b.blurb || "").toLowerCase();
          let s = 0;
          if (title.includes(qLower)) s += 15;
          if (author.includes(qLower)) s += 10;
          if (genres.includes(qLower)) s += 8;
          if (blurb.includes(qLower)) s += 5;
          for (const tok of tokens) {
            if (title.includes(tok)) s += 4;
            if (author.includes(tok)) s += 3;
            if (genres.includes(tok)) s += 3;
            if (blurb.includes(tok)) s += 2;
          }
          return { book: b, s };
        });
        preScored.sort((a, b) => b.s - a.s);
        const positiveMatches = preScored.filter((x) => x.s > 0).map((x) => x.book);
        candidateBooks = positiveMatches.length >= 8 ? positiveMatches.slice(0, 50) : bookList.slice(0, 50);
      }

      // Build catalogue string: id :: title :: author :: year :: genres :: blurb (160 chars)
      const catalogueLines = candidateBooks.map((b) => {
        const blurb = (b.blurb || "").slice(0, 160).replace(/\n/g, " ");
        const genres = (b.genres || []).join(", ");
        return `${b.id} :: ${b.title} :: ${b.author} :: ${b.year || ""} :: ${genres} :: ${blurb}`;
      });

      const validIds = new Set(bookList.map((b) => b.id));

      const ai = getGeminiClient();

      if (ai) {
        try {
          const prompt = `You are a perceptive personal librarian. Match the reader's natural-language inquiry against these library catalogue lines.
Return the book IDs that best match the vibe, theme, plot elements, mood, genre, or request.
Rank the results with the best match first, up to at most 20 IDs.
If nothing fits, return an empty array.

Reader's request: "${cleanQuery}"

Catalogue lines:
${catalogueLines.join("\n")}`;

          const aiPromise = ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: {
              systemInstruction:
                "You are an expert literary curator. Output strictly valid JSON matching the schema with matching book IDs.",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  ids: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.STRING,
                    },
                    description: "List of matching book IDs from the catalogue",
                  },
                },
                required: ["ids"],
              },
            },
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("AI search timeout")), 4000)
          );

          const response = await Promise.race([aiPromise, timeoutPromise]);

          const rawText = response.text ? response.text.trim() : "{}";
          let parsed: { ids?: string[] } = {};
          try {
            parsed = JSON.parse(rawText);
          } catch (e) {
            console.warn("Could not parse JSON from Gemini response, falling back to regex:", rawText);
            const match = rawText.match(/"ids"\s*:\s*\[(.*?)\]/s);
            if (match) {
              const matchedIds = match[1]
                .split(",")
                .map((s) => s.replace(/["'\s]/g, ""))
                .filter(Boolean);
              parsed = { ids: matchedIds };
            }
          }

          const matchedIds = (parsed.ids || []).filter((id) => validIds.has(id));
          return res.json({ ids: matchedIds, method: "ai" });
        } catch (aiErr: any) {
          console.warn("Gemini search failed or quota limit hit, falling back to local search:", aiErr?.message);
          if (aiErr?.status === 429 || aiErr?.message?.includes("429")) {
            // Fallback to client match below
          }
        }
      }

      // Fallback: Smart keyword and semantic token matching
      const qLower = cleanQuery.toLowerCase();
      const tokens = qLower.split(/\s+/).filter((t) => t.length > 2);

      const scored = bookList
        .map((b) => {
          const title = (b.title || "").toLowerCase();
          const author = (b.author || "").toLowerCase();
          const genres = (b.genres || []).join(" ").toLowerCase();
          const blurb = (b.blurb || "").toLowerCase();
          const fullText = `${title} ${author} ${genres} ${blurb}`;

          let score = 0;
          if (title.includes(qLower)) score += 10;
          if (author.includes(qLower)) score += 8;
          if (genres.includes(qLower)) score += 6;
          if (blurb.includes(qLower)) score += 4;

          for (const token of tokens) {
            if (title.includes(token)) score += 4;
            if (genres.includes(token)) score += 3;
            if (blurb.includes(token)) score += 2;
            if (author.includes(token)) score += 2;
          }

          return { id: b.id, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map((item) => item.id);

      return res.json({ ids: scored, method: "keyword" });
    } catch (err: any) {
      console.error("Search endpoint error:", err);
      res.status(500).json({ error: "Failed to perform search", ids: [] });
    }
  });

  // Vite middleware for dev or static for production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Library server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
