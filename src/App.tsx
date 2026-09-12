import React, { useState, useMemo, useRef } from "react";
import { books as defaultBooks, Book } from "./data/books";
import { Header } from "./components/Header";
import { TypedTitle } from "./components/TypedTitle";
import { Shelf } from "./components/Shelf";
import { LibraryFilter } from "./components/LibraryFilter";
import { AboutModal } from "./components/AboutModal";

export function App() {
  const [personalBooks] = useState<Book[]>(defaultBooks);
  const [filteredBooks, setFilteredBooks] = useState<Book[] | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const shelfContainerRef = useRef<HTMLDivElement>(null);

  const handleFilterChange = React.useCallback((filtered: Book[] | null) => {
    setFilteredBooks(filtered);
  }, []);

  const handleResetToLibrary = React.useCallback(() => {
    setFilteredBooks(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleScrollToCollections = React.useCallback(() => {
    const el = document.getElementById("collections-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Active book list on the main shelf
  const displayedBooks = useMemo(() => {
    return filteredBooks !== null ? filteredBooks : personalBooks;
  }, [filteredBooks, personalBooks]);

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col grain overflow-x-hidden selection:bg-primary/20">
      {/* Subtle warm archival ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 opacity-60 animate-drift"
        style={{
          background:
            "radial-gradient(ellipse at 50% 10%, oklch(0.96 0.02 80 / 0.5) 0%, oklch(0.975 0.01 85 / 0.2) 40%, transparent 75%)",
        }}
      />

      {/* Redesigned Minimal Elegant Header */}
      <Header
        totalVolumes={personalBooks.length}
        filteredCount={filteredBooks !== null ? displayedBooks.length : null}
        onResetToLibrary={handleResetToLibrary}
        onScrollToCollections={handleScrollToCollections}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Hero & Catalogue Navigation Section: Compact, Breathable, Editorial */}
      <section className="w-full pt-6 sm:pt-8 pb-3 px-4 sm:px-8 max-w-4xl mx-auto flex flex-col items-center text-center space-y-3">
        {/* Kicker with fine typographic rules */}
        <div className="flex items-center gap-2.5 select-none animate-rise">
          <span className="w-6 h-[1px] bg-border" />
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-normal">
            A Personal Archive
          </span>
          <span className="w-6 h-[1px] bg-border" />
        </div>

        {/* Hero Heading: High-contrast editorial serif font */}
        <div className="py-0.5">
          <TypedTitle />
        </div>

        {/* Subtle Editorial Sub-caption */}
        <p className="font-sans text-xs sm:text-[13px] text-muted-foreground/80 max-w-md font-light leading-relaxed select-none">
          One thousand volumes arranged across twenty-four disciplines.
        </p>

        {/* Search Bar & Category Index */}
        <div id="collections-section" className="w-full pt-2">
          <LibraryFilter
            books={personalBooks}
            onChange={handleFilterChange}
          />
        </div>
      </section>

      {/* Subtle section transition separator */}
      <div className="w-full max-w-5xl mx-auto px-6 pt-1">
        <div className="h-[1px] w-full bg-border/50" />
      </div>

      {/* Primary Bookshelf: Unchanged visual centerpiece */}
      <main ref={shelfContainerRef} className="w-full flex-1 flex flex-col justify-start pb-10">
        {displayedBooks.length > 0 ? (
          <div className="pb-2">
            <Shelf books={displayedBooks} shelfId="main-shelf" />
          </div>
        ) : (
          <div className="py-20 px-6 text-center max-w-md mx-auto space-y-2.5">
            <p className="font-display italic text-2xl text-foreground font-light">
              No volumes found
            </p>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              No titles in the archive matched your inquiry. Try a broader topic, author, or reset the category index.
            </p>
            <button
              type="button"
              onClick={handleResetToLibrary}
              className="mt-3 px-3 py-1.5 rounded-[3px] border border-border text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground/40 transition cursor-pointer"
            >
              Reset Archive
            </button>
          </div>
        )}
      </main>

      {/* Editorial Colophon / Footer */}
      <footer className="w-full py-6 mt-auto border-t border-border/60 bg-background/50 select-none">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-muted-foreground/75">
          <span>Virtual Library Archive &bull; 1,000 Volumes</span>
          <span className="flex items-center gap-2">
            <span>Physical 3D Spines</span>
            <span className="opacity-40">&bull;</span>
            <span>Open Library Editions</span>
          </span>
        </div>
      </footer>

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}

export default App;
