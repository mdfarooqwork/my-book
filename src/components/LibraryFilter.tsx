import React, { useState, useEffect, useRef, useMemo } from "react";
import { Book } from "../data/books";
import { Search, Sparkles, X, Loader2 } from "lucide-react";

interface LibraryFilterProps {
  books: Book[];
  onChange: (filtered: Book[] | null) => void;
}

export const LibraryFilter: React.FC<LibraryFilterProps> = ({
  books,
  onChange,
}) => {
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);

  const reqIdRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const prevFilterSignatureRef = useRef<string | null>(null);

  // Compute dynamic genre pills from whatever genres exist in the books data, sorted by count
  const genreList = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      b.genres?.forEach((g) => {
        counts[g] = (counts[g] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre);
  }, [books]);

  // Debounced AI search (600ms, min 2 chars, race-guarded by reqId)
  useEffect(() => {
    const clean = query.trim();

    if (clean.length < 2) {
      setAiMatchedIds(null);
      setStatusText(null);
      setSearching(false);
      return;
    }

    const currentReqId = ++reqIdRef.current;
    setSearching(true);
    setStatusText("Reading the shelves…");

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: clean, customBooks: books }),
        });

        if (currentReqId !== reqIdRef.current) return;

        if (!res.ok) {
          throw new Error(`Search error ${res.status}`);
        }

        const data = await res.json();
        const ids: string[] = data.ids || [];

        setAiMatchedIds(ids);
        setStatusText(`${ids.length} ${ids.length === 1 ? "match" : "matches"} found`);
      } catch (err: any) {
        if (currentReqId !== reqIdRef.current) return;
        console.warn("Server search failed, using client fallback:", err);

        // Fallback to client-side matching
        const qLower = clean.toLowerCase();
        const matched = books
          .filter(
            (b) =>
              b.title.toLowerCase().includes(qLower) ||
              b.author.toLowerCase().includes(qLower) ||
              b.blurb.toLowerCase().includes(qLower) ||
              b.genres?.some((g) => g.toLowerCase().includes(qLower))
          )
          .map((b) => b.id);

        setAiMatchedIds(matched);
        setStatusText(`${matched.length} found`);
      } finally {
        if (currentReqId === reqIdRef.current) {
          setSearching(false);
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [query, books]);

  // Calculate combined filtered results: AI ranking intersected with genre
  useEffect(() => {
    // If no query and no genre filter, show all (null)
    const cleanQuery = query.trim();
    if (!cleanQuery && !selectedGenre) {
      if (prevFilterSignatureRef.current !== null) {
        prevFilterSignatureRef.current = null;
        onChangeRef.current(null);
      }
      return;
    }

    let resultList: Book[] = [];

    if (aiMatchedIds !== null) {
      // Order by AI's ranked IDs
      const idMap = new Map(books.map((b) => [b.id, b]));
      resultList = aiMatchedIds
        .map((id) => idMap.get(id))
        .filter((b): b is Book => Boolean(b));
    } else {
      resultList = [...books];
    }

    // Intersect with selected genre if active
    if (selectedGenre) {
      resultList = resultList.filter((b) =>
        b.genres?.includes(selectedGenre)
      );
    }

    const newSignature = resultList.map((b) => b.id).join(",");
    if (prevFilterSignatureRef.current !== newSignature) {
      prevFilterSignatureRef.current = newSignature;
      onChangeRef.current(resultList);
    }
  }, [query, aiMatchedIds, selectedGenre, books]);

  const handleClear = () => {
    setQuery("");
    setAiMatchedIds(null);
    setStatusText(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 px-4">
      {/* Search Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none text-muted-foreground flex items-center">
          <Search className="w-4 h-4" />
        </div>

        <input
          type="text"
          id="library-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What are you looking for?"
          className="w-full pl-11 pr-24 py-3 bg-card/85 backdrop-blur-md border border-border/80 rounded-2xl text-sm font-sans text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition duration-200"
        />

        <div className="absolute right-3.5 flex items-center gap-1.5">
          {searching && (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          )}

          {query && !searching && (
            <button
              type="button"
              id="clear-search-button"
              onClick={handleClear}
              className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/70 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/60 border border-border/40 text-[11px] font-mono text-muted-foreground select-none"
            title="AI Semantic Search"
          >
            <Sparkles className="w-3 h-3 text-primary" />
            <span>AI Search</span>
          </div>
        </div>
      </div>

      {/* Status indicator if searching or results returned */}
      {statusText && (
        <div className="flex items-center justify-between px-2 text-[12px] font-mono text-muted-foreground">
          <span>{statusText}</span>
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="hover:text-primary transition underline cursor-pointer"
            >
              Reset search
            </button>
          )}
        </div>
      )}

      {/* Genre Pills: Single horizontal no-wrap line (scrollable, hidden scrollbar) */}
      {genreList.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1">
          <button
            type="button"
            id="genre-pill-all"
            onClick={() => setSelectedGenre(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition cursor-pointer border ${
              selectedGenre === null
                ? "bg-foreground text-background border-foreground font-medium shadow-xs"
                : "bg-card/70 text-muted-foreground border-border/70 hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            All Genres
          </button>

          {genreList.map((genre) => {
            const isSelected = selectedGenre === genre;
            return (
              <button
                key={genre}
                type="button"
                id={`genre-pill-${genre.toLowerCase().replace(/\W+/g, "-")}`}
                onClick={() => setSelectedGenre(isSelected ? null : genre)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition cursor-pointer border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                    : "bg-card/70 text-muted-foreground border-border/70 hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
