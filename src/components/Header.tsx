import React from "react";
import { Info, BookOpen } from "lucide-react";

interface HeaderProps {
  totalVolumes?: number;
  filteredCount?: number | null;
  onResetToLibrary?: () => void;
  onScrollToCollections?: () => void;
  onOpenAbout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalVolumes = 1000,
  filteredCount = null,
  onResetToLibrary,
  onScrollToCollections,
  onOpenAbout,
}) => {
  return (
    <header className="w-full border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-13 flex items-center justify-between">
        {/* Left: Refined Library Mark & Title */}
        <div
          onClick={onResetToLibrary}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
          title="Virtual Library Archive"
        >
          <div className="w-6 h-6 rounded-[3px] border border-foreground/20 bg-card/60 flex items-center justify-center text-foreground group-hover:border-foreground/50 transition-colors">
            <BookOpen className="w-3.5 h-3.5 stroke-[1.5]" />
          </div>
          <span className="font-mono text-[11px] sm:text-xs tracking-[0.24em] uppercase text-foreground font-medium">
            Virtual Library
          </span>
        </div>

        {/* Center / Secondary Area: Minimalist Editorial Navigation */}
        <nav className="hidden md:flex items-center gap-7 select-none">
          <button
            type="button"
            onClick={onResetToLibrary}
            className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Library
          </button>
          <button
            type="button"
            onClick={onScrollToCollections}
            className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Collections
          </button>
          <button
            type="button"
            onClick={onOpenAbout}
            className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            About
          </button>
        </nav>

        {/* Right: Volumes Indicator & Minimal Info Icon */}
        <div className="flex items-center gap-3 select-none">
          <div className="font-mono text-[11px] tracking-widest text-muted-foreground/80 uppercase">
            {filteredCount !== null ? (
              <span>
                <span className="text-foreground font-medium">{filteredCount}</span>
                <span className="opacity-40 mx-1">/</span>
                <span>{totalVolumes.toLocaleString()}</span>
                <span className="hidden sm:inline text-[10px] ml-1 opacity-70">vol</span>
              </span>
            ) : (
              <span>
                <span className="text-foreground font-medium">{totalVolumes.toLocaleString()}</span>
                <span className="ml-1 text-[10px] opacity-70">Volumes</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenAbout}
            className="w-7 h-7 rounded-[3px] border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors cursor-pointer"
            aria-label="About the Library"
            title="About this personal archive"
          >
            <Info className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </header>
  );
};
