import React, { useState, useMemo } from "react";
import { books as defaultBooks, Book } from "./data/books";
import { TypedTitle } from "./components/TypedTitle";
import { Shelf } from "./components/Shelf";
import { LibraryFilter } from "./components/LibraryFilter";
import { RecommendBookDialog } from "./components/RecommendBookDialog";
import { useRecommendations } from "./hooks/useRecommendations";
import { parseGoodreadsExport } from "./lib/goodreadsImport";
import {
  BookPlus,
  UploadCloud,
  Library,
  Sparkles,
  Info,
  CheckCircle2,
  FileText,
} from "lucide-react";

export function App() {
  const [personalBooks, setPersonalBooks] = useState<Book[]>(defaultBooks);
  const [filteredBooks, setFilteredBooks] = useState<Book[] | null>(null);
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const { recommendations, justAdded, addRecommendation } = useRecommendations();

  const handleFilterChange = React.useCallback((filtered: Book[] | null) => {
    setFilteredBooks(filtered);
  }, []);

  // Active book list on the main shelf
  const displayedBooks = useMemo(() => {
    return filteredBooks !== null ? filteredBooks : personalBooks;
  }, [filteredBooks, personalBooks]);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus("Reading your Goodreads library export…");
    try {
      const text = await file.text();
      const imported = await parseGoodreadsExport(text);
      if (imported.length === 0) {
        setImportStatus("No 'read' or 'currently-reading' volumes found in this CSV.");
        return;
      }
      setPersonalBooks(imported);
      setFilteredBooks(null);
      setImportStatus(`Successfully loaded ${imported.length} books from your Goodreads export!`);
      setTimeout(() => {
        setIsImportOpen(false);
        setImportStatus(null);
      }, 1600);
    } catch (err) {
      setImportStatus("Error parsing Goodreads CSV. Please check the file format.");
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col grain overflow-x-hidden">
      {/* Warm atmospheric radial lighting */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 opacity-70 animate-drift"
        style={{
          background:
            "radial-gradient(circle at 50% 15%, oklch(0.88 0.035 75 / 0.45) 0%, oklch(0.91 0.015 90 / 0.2) 45%, transparent 80%)",
        }}
      />

      {/* Top Header & Controls */}
      <header className="w-full pt-10 pb-6 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center space-y-5">
        {/* Editorial Sub-tag & Actions */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Library className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-[11px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground select-none">
              A Personal Archive
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Goodreads CSV button */}
            <button
              type="button"
              id="open-import-button"
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/70 bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground text-xs font-mono transition cursor-pointer"
              title="Import Goodreads Export"
            >
              <UploadCloud className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Import Goodreads</span>
            </button>

            {/* Recommend a book button */}
            <button
              type="button"
              id="open-recommend-button"
              onClick={() => setIsRecommendOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-mono font-medium shadow-xs hover:shadow transition cursor-pointer"
            >
              <BookPlus className="w-3.5 h-3.5" />
              <span>Recommend a book</span>
            </button>
          </div>
        </div>

        {/* Typed Title */}
        <div className="py-2">
          <TypedTitle />
        </div>

        {/* Library Count */}
        <div className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
          {displayedBooks.length} {displayedBooks.length === 1 ? "volume" : "volumes"}{" "}
          {filteredBooks !== null && "filtered"}
        </div>

        {/* Search & Genre Filter Bar */}
        <div className="w-full max-w-2xl pt-2">
          <LibraryFilter
            books={personalBooks}
            onChange={handleFilterChange}
          />
        </div>
      </header>

      {/* Primary Shelf Rail */}
      <main className="w-full flex-1 flex flex-col justify-start pb-12">
        {displayedBooks.length > 0 ? (
          <div className="pb-2">
            <Shelf books={displayedBooks} shelfId="main-shelf" />
          </div>
        ) : (
          <div className="py-24 px-6 text-center max-w-md mx-auto space-y-3">
            <p className="font-display italic text-2xl text-foreground">
              No volumes found
            </p>
            <p className="font-sans text-sm text-muted-foreground">
              None of the books on the shelves matched your search. Try asking for a
              different theme, author, or genre.
            </p>
          </div>
        )}

        {/* Secondary Shelf: "Recommended to me" (Visitor Recommendations) */}
        {recommendations.length > 0 && (
          <div className="mt-8 pt-2">
            <Shelf
              books={recommendations}
              justAdded={justAdded}
              shelfId="recommended-shelf"
              shelfTitle="Recommended to me"
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-xs font-mono text-muted-foreground border-t border-border/40 select-none">
        <p>Virtual Library &bull; Rendered with physical 3D bindings and sampled cover palettes</p>
      </footer>

      {/* Recommend a book modal */}
      {isRecommendOpen && (
        <RecommendBookDialog
          isOpen={isRecommendOpen}
          onClose={() => setIsRecommendOpen(false)}
          onRecommend={(newBook) => addRecommendation(newBook)}
        />
      )}

      {/* Goodreads Import Guidance & Upload Modal */}
      {isImportOpen && (
        <div
          id="goodreads-import-modal"
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-background/70 backdrop-blur-md"
        >
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 md:p-8 text-card-foreground">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-display italic text-2xl text-foreground">
                  Load your Goodreads Library
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm font-sans text-muted-foreground">
              <p>
                You can import your own real books directly into this bookshelf:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-xs font-mono bg-muted/40 p-4 rounded-xl border border-border/60 text-foreground/80">
                <li>Go to Goodreads &rarr; <strong>My Books</strong></li>
                <li>On the left: <strong>Import and export</strong> &rarr; <strong>Export Library</strong></li>
                <li>Download your <strong>goodreads_library_export.csv</strong> file</li>
                <li>Attach it in chat or upload it below:</li>
              </ol>

              {/* Upload Input */}
              <div className="pt-2">
                <label
                  htmlFor="goodreads-file-input"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border hover:border-primary/60 rounded-xl cursor-pointer bg-background/50 hover:bg-background/80 transition"
                >
                  <UploadCloud className="w-8 h-8 text-primary mb-2" />
                  <span className="text-sm font-medium text-foreground">
                    Select your goodreads_library_export.csv
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Only "read" and "currently-reading" books will be shelved
                  </span>
                  <input
                    id="goodreads-file-input"
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {importStatus && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs font-mono text-primary">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-border/60">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-sans text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
