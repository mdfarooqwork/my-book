import React, { useEffect, useState, useRef, useCallback } from "react";
import { Book } from "../data/books";
import { COVER_W, faceFont } from "./bookFaces";
import { X, ChevronLeft, ChevronRight, Star, BookmarkCheck, Calendar, BookOpen, User } from "lucide-react";

interface BookDetailProps {
  book: Book;
  rect: DOMRect;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const BookDetail: React.FC<BookDetailProps> = ({
  book,
  rect,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}) => {
  const [out, setOut] = useState(false);
  const [closing, setClosing] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Update viewport dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Compute pull-out target math
  const narrow = viewport.w < 768;
  const coverH = Math.min(viewport.h * (narrow ? 0.38 : 0.62), narrow ? 300 : 500);
  const scale = rect.height > 0 ? coverH / rect.height : 1.8;
  const coverW = COVER_W * scale;

  // Center the layout
  const targetX = narrow
    ? (viewport.w - coverW) / 2
    : Math.max(48, viewport.w * 0.46 - coverW);
  const targetY = narrow
    ? Math.max(80, viewport.h * 0.12)
    : (viewport.h - coverH) / 2;

  const dx = targetX - rect.left;
  const dy = targetY - rect.top;

  // Mount animation sequence: start at shelf pose, then RAF flip out=true
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setOut(true);
    });
    const timer = setTimeout(() => {
      setPanelVisible(true);
    }, 260);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, []);

  // Retract and close after 620ms
  const handleRetract = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setPanelVisible(false);
    setOut(false);
    setTimeout(() => {
      onClose();
    }, 620);
  }, [closing, onClose]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleRetract();
      } else if (e.key === "ArrowLeft" && onPrev && hasPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight" && onNext && hasNext) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRetract, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div
      id="book-detail-modal"
      className="fixed inset-0 z-[120] flex items-center justify-center select-none overflow-hidden"
    >
      {/* Dimmed & blurred backdrop */}
      <div
        className={`absolute inset-0 bg-background/80 backdrop-blur-xl transition-opacity duration-700 ${
          out && !closing ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleRetract}
      />

      {/* Floating Pull-out Book (Transforms smoothly from shelf rect to hero stage) */}
      <div
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          perspective: 1600,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="absolute inset-0 transition-transform"
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 900ms cubic-bezier(0.16, 1, 0.3, 1)",
            transform:
              out && !closing
                ? `translate3d(${dx}px, ${dy}px, 0px) scale(${scale}) rotateY(-90deg)`
                : `translate3d(0px, 0px, 0px) scale(1) rotateY(-26deg)`,
            transformOrigin: "left center",
          }}
        >
          {/* Spine face */}
          <div
            className="absolute inset-0 rounded-[2px] overflow-hidden"
            style={{
              backgroundColor: book.spine,
              boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
            }}
          >
            <div
              className={`absolute inset-y-6 inset-x-0 flex items-center justify-center ${
                faceFont[book.face]
              }`}
              style={{ color: book.ink }}
            >
              <span
                className="text-[11px] font-medium"
                style={{ writingMode: "vertical-rl" }}
              >
                {book.title}
              </span>
            </div>
          </div>

          {/* Front Cover face (turned 90 deg, becomes facing user when parent rotates -90deg) */}
          <div
            className="absolute top-0 bottom-0 overflow-hidden rounded-r-[4px] shadow-2xl"
            style={{
              left: `${rect.width}px`,
              width: `${COVER_W}px`,
              transformOrigin: "left center",
              transform: "rotateY(90deg)",
              backgroundColor: book.spine,
            }}
          >
            {book.cover ? (
              <img
                src={book.cover}
                alt={book.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none"
              />
            ) : (
              <div className="w-full h-full p-6 flex flex-col justify-between items-center text-center bg-card text-card-foreground border border-border">
                <div className="w-full h-1 bg-primary/40 rounded mt-2" />
                <div>
                  <h4 className="font-display text-2xl font-bold">{book.title}</h4>
                  <p className="font-sans text-sm text-muted-foreground mt-2">{book.author}</p>
                </div>
                <div className="font-mono text-xs text-muted-foreground uppercase">
                  {book.publisher || "Library Edition"}
                </div>
              </div>
            )}
            {/* Front cover book lighting gradient */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.2) 0%, rgba(255,255,255,0.06) 8%, transparent 20%, rgba(0,0,0,0.15) 100%)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Details Side-Panel (Fades and rises in with a 260ms delay) */}
      <div
        className={`relative z-10 w-full max-w-lg px-6 md:px-0 transition-all duration-500 ease-out pointer-events-auto ${
          narrow ? "mt-auto pb-10" : "md:ml-[34vw] lg:ml-[28vw]"
        } ${
          panelVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6"
        }`}
      >
        <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl p-6 md:p-8 shadow-2xl text-card-foreground">
          {/* Top Bar: Book Number, Level, Finished Date & Close button */}
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono tracking-wider uppercase text-muted-foreground">
              {book.bookNumber && (
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  #{book.bookNumber}
                </span>
              )}
              {book.level && (
                <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border/60">
                  {book.level}
                </span>
              )}
              {book.recommender ? (
                <span className="flex items-center gap-1 text-primary">
                  <User className="w-3.5 h-3.5" />
                  <span>Recommended by {book.recommender}</span>
                </span>
              ) : book.finished && !book.level ? (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Finished {book.finished}</span>
                </span>
              ) : null}
            </div>

            <button
              type="button"
              id="close-book-detail-button"
              onClick={handleRetract}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-auto"
              aria-label="Close detail view"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Book Title & Author */}
          <div className="mt-5">
            <h2 className="font-display text-3xl md:text-4xl font-normal leading-tight tracking-tight text-foreground">
              {book.title}
            </h2>
            <p className="font-sans text-lg text-muted-foreground mt-1.5 font-light">
              by {book.author}
            </p>
          </div>

          {/* Metadata Row: Year, Binding, Rating, Publisher */}
          <div className="flex flex-wrap items-center gap-4 mt-4 py-3 border-y border-border/40 text-sm font-mono text-muted-foreground">
            {book.year > 0 && (
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{book.year}</span>
              </span>
            )}

            <span className="capitalize">{book.binding} binding</span>

            {book.publisher && (
              <span className="text-muted-foreground/80">{book.publisher}</span>
            )}

            <div className="ml-auto flex items-center gap-1 text-primary">
              {book.rating > 0 ? (
                <>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < book.rating
                            ? "fill-primary text-primary"
                            : "text-border"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs ml-1 font-mono">{book.rating}.0</span>
                </>
              ) : (
                <span className="text-xs font-mono text-muted-foreground">Unrated</span>
              )}
            </div>
          </div>

          {/* Blurb */}
          <div className="mt-4 max-h-36 overflow-y-auto pr-2 text-sm md:text-base font-sans leading-relaxed text-foreground/85">
            <p>{book.blurb || "No blurb available for this volume."}</p>
          </div>

          {/* Genre Tags */}
          {book.genres && book.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-5">
              {book.genres.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-1 rounded-full text-xs font-mono bg-accent text-accent-foreground border border-border/60"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Footer Controls: Previous, Next, Shelve It */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/60">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="prev-book-button"
                onClick={onPrev}
                disabled={!hasPrev}
                className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="Previous book (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                id="next-book-button"
                onClick={onNext}
                disabled={!hasNext}
                className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="Next book (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              id="shelve-book-button"
              onClick={handleRetract}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-sans font-medium bg-foreground text-background hover:bg-foreground/90 transition shadow cursor-pointer"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>Return to Shelf</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
