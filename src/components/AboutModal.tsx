import React, { useEffect } from "react";
import { X, BookOpen, Layers, Compass } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Dim backdrop */}
      <div
        className="fixed inset-0 bg-foreground/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Editorial Card */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-md shadow-xl p-6 sm:p-8 text-foreground z-10 animate-rise">
        <div className="flex items-center justify-between pb-4 border-b border-border/70">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              Archival Notes
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <h2 className="font-display italic text-2xl sm:text-3xl text-foreground font-light leading-snug">
            A Curated Canon of One Thousand Volumes
          </h2>

          <p className="font-sans text-sm text-muted-foreground leading-relaxed">
            This virtual library is a private architectural archive structured across 24 disciplines of human thought—from psychological fiction, philosophy, and cognitive neuroscience to strategy, economics, and classical masterworks.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 border border-border/60 rounded-[3px] bg-background/50 space-y-1">
              <div className="flex items-center gap-1.5 text-primary text-xs font-mono">
                <BookOpen className="w-3.5 h-3.5" />
                <span>1,000</span>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                Total Volumes
              </p>
            </div>

            <div className="p-3 border border-border/60 rounded-[3px] bg-background/50 space-y-1">
              <div className="flex items-center gap-1.5 text-primary text-xs font-mono">
                <Layers className="w-3.5 h-3.5" />
                <span>24</span>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                Curated Fields
              </p>
            </div>

            <div className="p-3 border border-border/60 rounded-[3px] bg-background/50 space-y-1">
              <div className="flex items-center gap-1.5 text-primary text-xs font-mono">
                <Compass className="w-3.5 h-3.5" />
                <span>5 Tiers</span>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                Foundation to Master
              </p>
            </div>
          </div>

          <p className="font-sans text-xs text-muted-foreground/80 leading-relaxed pt-2">
            Each spine on the shelf reproduces authentic binding dimensions, cloth textures, and gilded foil typography. Click any volume to examine the front edition cover and cataloguing record.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-border/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-foreground text-background font-mono text-xs uppercase tracking-wider rounded-[3px] hover:opacity-90 transition cursor-pointer"
          >
            Return to Shelf
          </button>
        </div>
      </div>
    </div>
  );
};
