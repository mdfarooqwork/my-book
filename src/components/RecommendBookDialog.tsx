import React, { useState, useEffect, useRef } from "react";
import { searchBooks, OpenLibraryResult, buildBook } from "../lib/openLibrary";
import { Book } from "../data/books";
import { Search, X, Loader2, Sparkles, Check, BookPlus } from "lucide-react";

interface RecommendBookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRecommend: (book: Book) => void;
}

export const RecommendBookDialog: React.FC<RecommendBookDialogProps> = ({
  isOpen,
  onClose,
  onRecommend,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OpenLibraryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<OpenLibraryResult | null>(null);

  const [recommender, setRecommender] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const found = await searchBooks(query, controller.signal);
        setResults(found);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError("Failed to search Open Library. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setSelected(null);
    setRecommender("");
    setNote("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      setError("Please pick a book first.");
      return;
    }
    const cleanRecommender = recommender.trim();
    if (cleanRecommender.length < 1 || cleanRecommender.length > 60) {
      setError("Please enter your name (1–60 characters).");
      return;
    }
    if (note.length > 500) {
      setError("Note must be 500 characters or less.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const newBook = await buildBook(selected, {
        recommender: cleanRecommender,
        note: note.trim(),
      });
      onRecommend(newBook);
      handleClose();
    } catch (err: any) {
      setError("Failed to create recommendation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="recommend-dialog-modal"
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-background/70 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 md:p-8 text-card-foreground">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <BookPlus className="w-5 h-5 text-primary" />
            <h3 className="font-display italic text-2xl text-foreground">
              Recommend a book
            </h3>
          </div>
          <button
            type="button"
            id="close-recommend-dialog"
            onClick={handleClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Search & Pick */}
        {!selected ? (
          <div className="mt-5 space-y-4">
            <p className="font-sans text-sm text-muted-foreground">
              Search any published book by title or author to recommend it to this library:
            </p>

            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                id="recommend-search-input"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title or author…"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
              {loading && (
                <Loader2 className="absolute right-3.5 top-3.5 w-4 h-4 text-primary animate-spin" />
              )}
            </div>

            {/* Results list */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {results.length > 0 ? (
                results.map((r) => (
                  <div
                    key={r.key}
                    onClick={() => setSelected(r)}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={r.coverUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0 bg-muted"
                      />
                      <div className="text-left">
                        <div className="font-display font-medium text-base text-foreground line-clamp-1 group-hover:text-primary transition">
                          {r.title}
                        </div>
                        <div className="font-sans text-xs text-muted-foreground mt-0.5">
                          {r.author} {r.year > 0 ? `(${r.year})` : ""}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg text-xs font-mono bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition cursor-pointer"
                    >
                      Pick
                    </button>
                  </div>
                ))
              ) : query.trim().length >= 2 && !loading ? (
                <div className="py-8 text-center text-sm font-mono text-muted-foreground">
                  No books found on Open Library matching "{query}".
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          /* Step 2: Confirmation & Personal Note */
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Picked Book Summary */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/60 border border-border">
              <div className="flex items-center gap-3">
                <img
                  src={selected.coverUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-10 h-14 object-cover rounded shadow flex-shrink-0"
                />
                <div>
                  <div className="font-display font-medium text-lg leading-tight text-foreground line-clamp-1">
                    {selected.title}
                  </div>
                  <div className="font-sans text-xs text-muted-foreground mt-0.5">
                    {selected.author} {selected.year > 0 ? `(${selected.year})` : ""}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs font-mono text-primary hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Recommender Name */}
            <div>
              <label
                htmlFor="recommender-name"
                className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Your Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                id="recommender-name"
                required
                maxLength={60}
                placeholder="e.g. Elena, Marcus, or anonymous"
                value={recommender}
                onChange={(e) => setRecommender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>

            {/* Why should I read it? */}
            <div>
              <label
                htmlFor="recommend-note"
                className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Why should I read it? <span className="opacity-70">(optional, max 500 chars)</span>
              </label>
              <textarea
                id="recommend-note"
                rows={3}
                maxLength={500}
                placeholder="What made this book unforgettable to you?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
              />
              <div className="text-right text-[11px] font-mono text-muted-foreground mt-1">
                {note.length} / 500
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-600">
                {error}
              </div>
            )}

            {/* Submit button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-sans text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-recommendation-button"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-sans font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition shadow cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Shelving…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Shelve Recommendation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
