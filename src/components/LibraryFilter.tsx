import React, { useState, useEffect, useRef, useMemo } from "react";
import { Book, CATEGORIES } from "../data/books";
import { Search, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

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
  const railRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const prevFilterSignatureRef = useRef<string | null>(null);

  // Global hotkey: ⌘K or Ctrl+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute counts for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      b.genres?.forEach((g) => {
        const matched = CATEGORIES.find(
          (c) => c.toLowerCase() === g.toLowerCase()
        );
        if (matched) {
          counts[matched] = (counts[matched] || 0) + 1;
        } else {
          counts[g] = (counts[g] || 0) + 1;
        }
      });
    });
    return counts;
  }, [books]);

  const scrollRail = (direction: "left" | "right") => {
    if (railRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      railRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Debounced search (600ms, min 2 chars, race-guarded by reqId)
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
    setStatusText("Searching shelves…");

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

  // Calculate combined filtered results: search ranking intersected with category
  useEffect(() => {
    // If no query and no category filter, show all (null)
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
      const idMap = new Map(books.map((b) => [b.id, b]));
      resultList = aiMatchedIds
        .map((id) => idMap.get(id))
        .filter((b): b is Book => Boolean(b));
    } else {
      resultList = [...books];
    }

    // Intersect with selected category if active
    if (selectedGenre) {
      resultList = resultList.filter((b) =>
        b.genres?.some(
          (g) =>
            g.toLowerCase() === selectedGenre.toLowerCase() ||
            g.toLowerCase().includes(selectedGenre.toLowerCase()) ||
            selectedGenre.toLowerCase().includes(g.toLowerCase())
        )
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
    <div className="w-full max-w-2xl mx-auto space-y-2.5 px-2">
      {/* Editorial Catalogue Search Bar */}
      <div className="relative flex items-center group">
        <div className="absolute left-3.5 pointer-events-none text-muted-foreground flex items-center">
          <Search className="w-3.5 h-3.5 stroke-[1.5]" />
        </div>

        <input
          ref={inputRef}
          type="text"
          id="library-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 1,000 volumes by title, author, subject, or query…"
          className="w-full pl-9.5 pr-20 py-2.5 bg-card/70 backdrop-blur-md border border-border rounded-md text-[13px] font-sans text-foreground placeholder:text-muted-foreground/75 shadow-xs focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/15 transition-all duration-150"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {searching && (
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
          )}

          {query && !searching && (
            <button
              type="button"
              id="clear-search-button"
              onClick={handleClear}
              className="p-1 text-muted-foreground hover:text-foreground rounded-[3px] hover:bg-muted/70 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {!query && (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] border border-border/80 bg-background/70 text-[10px] font-mono text-muted-foreground/75 tracking-wider select-none">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Status indicator if searching or results returned */}
      {statusText && (
        <div className="flex items-center justify-between px-1 text-[11px] font-mono text-muted-foreground">
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

      {/* 24 Category Index: Slim editorial chips with hairline borders */}
      <div className="relative w-full flex items-center pt-0.5">
        <button
          type="button"
          id="scroll-categories-left"
          onClick={() => scrollRail("left")}
          className="hidden sm:flex items-center justify-center w-6 h-6 rounded-[3px] bg-card/80 hover:bg-card border border-border/80 text-muted-foreground hover:text-foreground shadow-2xs transition-colors z-10 mr-1.5 flex-shrink-0 cursor-pointer"
          aria-label="Scroll categories left"
          title="Scroll left"
        >
          <ChevronLeft className="w-3 h-3 stroke-[1.5]" />
        </button>

        <div
          ref={railRef}
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 scroll-smooth flex-1"
        >
          <button
            type="button"
            id="genre-pill-all"
            onClick={() => setSelectedGenre(null)}
            className={`px-2.5 py-1 rounded-[3px] text-[11px] font-mono tracking-wide uppercase whitespace-nowrap transition cursor-pointer border flex-shrink-0 ${
              selectedGenre === null
                ? "bg-foreground text-background border-foreground font-medium shadow-xs"
                : "bg-card/50 text-muted-foreground border-border/80 hover:border-foreground/40 hover:text-foreground hover:bg-card"
            }`}
          >
            All Categories
          </button>

          {CATEGORIES.map((category) => {
            const isSelected = selectedGenre === category;
            const count = categoryCounts[category] || 0;
            return (
              <button
                key={category}
                type="button"
                id={`genre-pill-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                onClick={() => setSelectedGenre(isSelected ? null : category)}
                className={`px-2.5 py-1 rounded-[3px] text-[11px] font-mono tracking-wide uppercase whitespace-nowrap transition cursor-pointer border flex-shrink-0 flex items-center gap-1 ${
                  isSelected
                    ? "bg-foreground text-background border-foreground font-medium shadow-xs"
                    : "bg-card/50 text-muted-foreground border-border/80 hover:border-foreground/40 hover:text-foreground hover:bg-card"
                }`}
              >
                <span>{category}</span>
                {count > 0 && (
                  <span
                    className={`text-[9px] font-mono ml-0.5 ${
                      isSelected
                        ? "text-background/70 font-semibold"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          id="scroll-categories-right"
          onClick={() => scrollRail("right")}
          className="hidden sm:flex items-center justify-center w-6 h-6 rounded-[3px] bg-card/80 hover:bg-card border border-border/80 text-muted-foreground hover:text-foreground shadow-2xs transition-colors z-10 ml-1.5 flex-shrink-0 cursor-pointer"
          aria-label="Scroll categories right"
          title="Scroll right"
        >
          <ChevronRight className="w-3 h-3 stroke-[1.5]" />
        </button>
      </div>
    </div>
  );
};
