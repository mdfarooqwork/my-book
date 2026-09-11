import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Book } from "../data/books";
import { COVER_W, faceFont } from "./bookFaces";
import { Star } from "lucide-react";

interface BookSpineProps {
  book: Book;
  onOpen: (rect: DOMRect) => void;
  ry?: number; // angle from curved perspective
  isShelvingIn?: boolean;
}

export const BookSpine: React.FC<BookSpineProps> = ({
  book,
  onOpen,
  ry = 0,
  isShelvingIn = false,
}) => {
  const [hovered, setHovered] = useState(false);
  const [cardPos, setCardPos] = useState<{ left: number; top: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const leaveTimerRef = useRef<number | null>(null);

  const pull = hovered ? 96 : 0;
  const lift = hovered ? -26 : 0;
  const lean = hovered ? 0 : book.lean;

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const top = rect.top - 14;
      setCardPos({ left: center, top });
    }
    setHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimerRef.current = window.setTimeout(() => {
      setHovered(false);
      setCardPos(null);
    }, 90);
  };

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const handleClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      onOpen(rect);
    }
  };

  // Sheen overlay per surface finish
  const finishSheen =
    book.finish === "gloss"
      ? "linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.38) 32%, rgba(255,255,255,0.05) 70%, rgba(0,0,0,0.25) 100%)"
      : book.finish === "cloth"
      ? "linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.14) 28%, rgba(0,0,0,0.08) 75%, rgba(0,0,0,0.2) 100%)"
      : "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.18) 30%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0.22) 100%)";

  return (
    <>
      {/* Stationary outer button maintains the hit target */}
      <button
        ref={buttonRef}
        type="button"
        data-spine-btn="true"
        id={`book-spine-${book.id}`}
        aria-label={`${book.title} by ${book.author}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative inline-block cursor-pointer outline-none select-none text-left p-0 bg-transparent border-none ${
          isShelvingIn ? "animate-shelve-in" : ""
        }`}
        style={{
          width: `${book.width}px`,
          height: `${book.height}px`,
          zIndex: hovered ? 40 : 10,
          perspective: 1400,
        }}
      >
        {/* Inner span that physically moves in 3D */}
        <span
          className="absolute inset-0 block transition-transform duration-300 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(var(--spine-ry, ${ry}deg)) rotateZ(${lean}deg) translateZ(${
              pull + book.depth
            }px) translateY(${lift}px)`,
          }}
        >
          {/* Main Spine Face */}
          <span
            className="absolute inset-0 block overflow-hidden rounded-[1.5px] shadow-sm"
            style={{
              backgroundColor: book.spine,
              boxShadow: `
                inset 1px 0 0 rgba(255,255,255,0.18),
                inset -1px 0 0 rgba(0,0,0,0.35),
                0 4px 10px rgba(0,0,0,0.18)
              `,
            }}
          >
            {/* 1. Cover Art Wraparound (Left edge bleeding slightly) */}
            {book.cover && (
              <span
                className="absolute inset-0 opacity-20 bg-cover bg-left pointer-events-none mix-blend-multiply"
                style={{ backgroundImage: `url(${book.cover})` }}
              />
            )}

            {/* 2. Base color settle layer */}
            <span
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                background: `linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(255,255,255,0.06) 12%, rgba(0,0,0,0.15) 100%)`,
              }}
            />

            {/* 3. Head & Foot Rules in band accent */}
            {book.band && (
              <>
                <span
                  className="absolute top-2.5 left-1 right-1 h-[2px] opacity-85"
                  style={{ backgroundColor: book.band }}
                />
                <span
                  className="absolute bottom-2.5 left-1 right-1 h-[2px] opacity-85"
                  style={{ backgroundColor: book.band }}
                />
              </>
            )}

            {/* 4 & 5. Lettering Container (Vertical text) */}
            <span
              className={`absolute inset-x-0 top-6 bottom-6 flex flex-col items-center justify-between pointer-events-none ${
                faceFont[book.face] || "font-display"
              } ${book.caps ? "uppercase tracking-wider" : ""}`}
              style={{ color: book.ink }}
            >
              {/* Vertical Title */}
              <span
                className="text-[12px] font-medium leading-tight max-h-[72%] overflow-hidden text-ellipsis whitespace-nowrap opacity-95"
                style={{
                  writingMode: "vertical-rl",
                  textOrientation: "mixed",
                  filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))",
                }}
              >
                {book.title}
              </span>

              {/* Vertical Author (if spine width >= 44) */}
              {book.width >= 44 && (
                <span
                  className="text-[10px] font-normal tracking-wide opacity-80 mt-2 max-h-[22%] overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                  }}
                >
                  {book.author}
                </span>
              )}

              {/* Publisher Mark at foot (if spine width >= 30) */}
              {book.width >= 30 && book.publisher && (
                <span
                  className="text-[8px] font-mono tracking-widest opacity-60 uppercase overflow-hidden text-ellipsis whitespace-nowrap max-w-[85%]"
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                  }}
                >
                  {book.publisher.slice(0, 10)}
                </span>
              )}
            </span>

            {/* 7. Material Texture over the ink */}
            {book.finish === "cloth" ? (
              <span
                className="absolute inset-0 pointer-events-none opacity-25"
                style={{
                  backgroundImage: `radial-gradient(rgba(0,0,0,0.3) 1px, transparent 1px)`,
                  backgroundSize: "3px 3px",
                  mixBlendMode: "overlay",
                }}
              />
            ) : (
              <span
                className="absolute inset-0 pointer-events-none opacity-15"
                style={{
                  backgroundImage: `linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                  backgroundSize: "100% 4px",
                }}
              />
            )}

            {/* 8. Cylindrical sheen */}
            <span
              className="absolute inset-0 pointer-events-none"
              style={{ background: finishSheen }}
            />

            {/* 9. Edge wear */}
            {book.wear > 0 && (
              <span
                className="absolute inset-0 pointer-events-none"
                style={{
                  opacity: book.wear,
                  background:
                    "linear-gradient(90deg, rgba(250,240,225,0.45) 0%, transparent 8%, transparent 92%, rgba(250,240,225,0.45) 100%), linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 6%, transparent 94%, rgba(0,0,0,0.4) 100%)",
                }}
              />
            )}

            {/* 10. Inset Highlight */}
            <span
              className="absolute inset-0 pointer-events-none rounded-[1.5px]"
              style={{
                boxShadow: "inset 0 0 1px 1px rgba(255,255,255,0.1)",
              }}
            />
          </span>

          {/* Hinged Front Cover Face (attached at left-full, rotateY(90deg)) */}
          <span
            className="absolute top-0 bottom-0 overflow-hidden rounded-r-[2px] pointer-events-none shadow-md"
            style={{
              left: `${book.width}px`,
              width: `${COVER_W}px`,
              transformOrigin: "left center",
              transform: "rotateY(90deg)",
              backgroundColor: book.spine,
            }}
          >
            {book.cover ? (
              <img
                src={book.cover}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none"
              />
            ) : (
              <span className="w-full h-full flex flex-col justify-center items-center p-3 text-center bg-muted/60 text-foreground">
                <span className="font-display text-sm font-semibold">{book.title}</span>
                <span className="text-xs font-sans mt-1 text-muted-foreground">{book.author}</span>
              </span>
            )}
            {/* Soft lighting overlay across front cover depth */}
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 15%, transparent 100%)",
              }}
            />
          </span>

          {/* Page Block (Tops the spine) */}
          <span
            className="absolute left-0 overflow-hidden pointer-events-none"
            style={{
              top: 0,
              width: `${book.width}px`,
              height: `${COVER_W}px`,
              transformOrigin: "top center",
              transform: "rotateX(78deg)",
              backgroundColor: "#f5eee0",
              boxShadow: "inset 0 0 8px rgba(0,0,0,0.3)",
            }}
          >
            {/* Page line striations */}
            <span
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 3px)",
              }}
            />
            {/* Hardcover Headband Strip */}
            {book.binding === "hardcover" && (
              <span
                className="absolute top-0 inset-x-0 h-[3px]"
                style={{
                  backgroundColor: book.band || "#8b2c24",
                  borderBottom: "1px solid rgba(0,0,0,0.2)",
                }}
              />
            )}
          </span>
        </span>
      </button>

      {/* Floating Hover Metadata Card (Portaled to document.body) */}
      {hovered && cardPos && typeof document !== "undefined" && (
        createPortal(
          <div
            id={`hover-card-${book.id}`}
            className="fixed z-[100] w-[248px] pointer-events-none select-none animate-rise"
            style={{
              left: `${Math.max(12, Math.min(window.innerWidth - 260, cardPos.left - 124))}px`,
              top: `${cardPos.top}px`,
              transform: "translateY(-100%)",
            }}
          >
            <div className="bg-card/95 backdrop-blur-md border border-border/80 rounded-xl p-3.5 shadow-xl text-card-foreground">
              {/* Title */}
              <h3 className="font-display text-[20px] font-medium leading-snug tracking-tight line-clamp-2">
                {book.title}
              </h3>

              {/* Author */}
              <p className="font-sans text-[15px] text-muted-foreground mt-1">
                {book.author}
              </p>

              {/* Metadata row */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/60 text-muted-foreground">
                <span className="font-mono text-[13px] uppercase tracking-wider">
                  {book.year > 0 ? book.year : ""}
                </span>
                <span className="font-mono text-[13px] capitalize">
                  {book.binding}
                </span>
                {book.rating > 0 ? (
                  <span className="flex items-center gap-1 font-mono text-[13px] text-primary">
                    <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                    <span>{book.rating}</span>
                  </span>
                ) : (
                  <span className="font-mono text-[12px] opacity-75">Unrated</span>
                )}
              </div>

              {/* Genre Pills */}
              {book.genres && book.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {book.genres.map((g) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded-full text-[12px] font-mono bg-accent/70 text-accent-foreground border border-border/50"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Recommender badge if applicable */}
              {book.recommender && (
                <div className="mt-2 text-[12px] font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                  Recommended by {book.recommender}
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      )}
    </>
  );
};
