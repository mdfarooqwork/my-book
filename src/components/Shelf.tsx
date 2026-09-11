import React, { useState, useRef, useEffect, useCallback } from "react";
import { Book } from "../data/books";
import { BookSpine } from "./BookSpine";
import { BookDetail } from "./BookDetail";

interface ShelfProps {
  books: Book[];
  justAdded?: string | null;
  shelfId?: string;
  shelfTitle?: string;
}

export const Shelf: React.FC<ShelfProps> = ({
  books,
  justAdded,
  shelfId = "main-shelf",
  shelfTitle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [selectedBook, setSelectedBook] = useState<{
    book: Book;
    rect: DOMRect;
    index: number;
  } | null>(null);

  const [isOverflowing, setIsOverflowing] = useState(false);

  // Drag-to-scroll state
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  // Total raw width of all books in one copy
  const singleCopyWidth = books.reduce((acc, b) => acc + b.width + 2, 0);
  const isLoopable = singleCopyWidth > 2600;
  const copiesCount = isLoopable ? 3 : 1;

  // Compute curved perspective for visible spines via direct CSS custom property
  const updatePerspective = useCallback(() => {
    if (!railRef.current) return;
    const vpCenter = window.innerWidth / 2;
    const buttons = railRef.current.querySelectorAll<HTMLButtonElement>("button[data-spine-btn]");

    buttons.forEach((btn) => {
      const rect = btn.getBoundingClientRect();
      const spineCenter = rect.left + rect.width / 2;
      const t = (spineCenter - vpCenter) / (window.innerWidth / 2);
      const absT = Math.min(1, Math.abs(t));
      const eased = Math.pow(absT, 1.35);
      const angle = -Math.sign(t) * eased * 34;
      btn.style.setProperty("--spine-ry", `${Math.round(angle * 10) / 10}deg`);
    });
  }, []);

  // Handle loop wrapping and scroll updates throttled via rAF
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (containerRef.current && isLoopable) {
        const el = containerRef.current;
        const oneThird = el.scrollWidth / 3;

        if (el.scrollLeft < 10) {
          el.scrollLeft += oneThird;
        } else if (el.scrollLeft > oneThird * 2 - 10) {
          el.scrollLeft -= oneThird;
        }
      }
      updatePerspective();
    });
  }, [isLoopable, updatePerspective]);

  // Initial scroll position for looping
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    if (isLoopable) {
      el.scrollLeft = el.scrollWidth / 3;
    }
    requestAnimationFrame(updatePerspective);
  }, [isLoopable, books.length, updatePerspective]);

  // Check overflow with window resize
  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current) return;
      const overflowing = singleCopyWidth + 96 > containerRef.current.clientWidth;
      setIsOverflowing((prev) => (prev !== overflowing ? overflowing : prev));
      updatePerspective();
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    return () => {
      window.removeEventListener("resize", checkOverflow);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [singleCopyWidth, updatePerspective]);

  // Horizontal wheel interception
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.2;
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // Keyboard navigation (Left/Right by 320px) when no modal open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedBook) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowLeft") {
        containerRef.current?.scrollBy({ left: -320, behavior: "smooth" });
      } else if (e.key === "ArrowRight") {
        containerRef.current?.scrollBy({ left: 320, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBook]);

  // Handle justAdded book slide-in
  useEffect(() => {
    if (!justAdded || !railRef.current) return;

    const spineBtn = railRef.current.querySelector<HTMLButtonElement>(
      `#book-spine-${justAdded}`
    );
    if (spineBtn) {
      spineBtn.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [justAdded]);

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartScrollLeftRef.current = containerRef.current.scrollLeft;
    hasDraggedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const deltaX = e.clientX - dragStartXRef.current;
    if (Math.abs(deltaX) > 4) {
      hasDraggedRef.current = true;
    }
    containerRef.current.scrollLeft = dragStartScrollLeftRef.current - deltaX;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Open Book Detail modal
  const handleOpenBook = (book: Book, rect: DOMRect, index: number) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    setSelectedBook({ book, rect, index });
  };

  const handleNextBook = () => {
    if (!selectedBook) return;
    const nextIdx = (selectedBook.index + 1) % books.length;
    const nextBook = books[nextIdx];
    const spineBtn = railRef.current?.querySelector<HTMLButtonElement>(
      `#book-spine-${nextBook.id}`
    );
    const rect = spineBtn?.getBoundingClientRect() || selectedBook.rect;
    setSelectedBook({ book: nextBook, rect, index: nextIdx });
  };

  const handlePrevBook = () => {
    if (!selectedBook) return;
    const prevIdx = (selectedBook.index - 1 + books.length) % books.length;
    const prevBook = books[prevIdx];
    const spineBtn = railRef.current?.querySelector<HTMLButtonElement>(
      `#book-spine-${prevBook.id}`
    );
    const rect = spineBtn?.getBoundingClientRect() || selectedBook.rect;
    setSelectedBook({ book: prevBook, rect, index: prevIdx });
  };

  if (books.length === 0) {
    return null;
  }

  return (
    <section id={shelfId} className="relative w-full py-2">
      {shelfTitle && (
        <div className="max-w-7xl mx-auto px-6 mb-2 flex items-center justify-between">
          <h2 className="font-display italic text-2xl md:text-3xl text-foreground/90">
            {shelfTitle}
          </h2>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {books.length} {books.length === 1 ? "volume" : "volumes"}
          </span>
        </div>
      )}

      {/* Edge gradient fade masks (only when overflowing) */}
      {isOverflowing && (
        <>
          <div className="absolute left-0 inset-y-0 w-16 md:w-28 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 inset-y-0 w-16 md:w-28 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
        </>
      )}

      {/* Main horizontal scrolling container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing select-none"
        style={{
          perspective: 1400,
          perspectiveOrigin: "50% 65%",
        }}
      >
        <div
          ref={railRef}
          className={`flex items-end gap-[2px] pt-16 pb-6 px-12 md:px-24 min-w-full ${
            !isOverflowing ? "justify-center" : "justify-start"
          }`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {Array.from({ length: copiesCount }).map((_, copyIndex) => (
            <React.Fragment key={`copy-${copyIndex}`}>
              {books.map((book, bookIdx) => {
                const uniqueKey = `${book.id}-copy${copyIndex}`;
                const isJustShelved = justAdded === book.id && copyIndex === 0;

                return (
                  <BookSpine
                    key={uniqueKey}
                    book={book}
                    isShelvingIn={isJustShelved}
                    onOpen={(rect) => handleOpenBook(book, rect, bookIdx)}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Thin center-line gradient and ground shelf shadow */}
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-border to-transparent opacity-80" />
        <div className="h-4 w-full bg-gradient-to-b from-foreground/[0.08] to-transparent blur-sm -mt-[1px]" />
      </div>

      {/* Pulled-Out Book Detail Modal View */}
      {selectedBook && (
        <BookDetail
          book={selectedBook.book}
          rect={selectedBook.rect}
          onClose={() => setSelectedBook(null)}
          onPrev={handlePrevBook}
          onNext={handleNextBook}
          hasPrev={books.length > 1}
          hasNext={books.length > 1}
        />
      )}
    </section>
  );
};
