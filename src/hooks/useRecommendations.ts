import { useState, useEffect, useCallback } from "react";
import { Book } from "../data/books";

const STORAGE_KEY = "virtual_library_recommendations_v1";

const INITIAL_RECOMMENDATIONS: Book[] = [
  {
    id: "rec-the-midnight-library-haig--101",
    title: "The Midnight Library",
    author: "Matt Haig",
    genres: ["Fantasy", "Fiction"],
    cover: "https://covers.openlibrary.org/b/id/10313768-L.jpg",
    year: 2020,
    blurb: "Between life and death there is a library where every book offers a chance to try another life you could have lived.",
    rating: 0,
    finished: "Recommended by Sophie",
    recommender: "Sophie",
    publisher: "Viking",
    binding: "hardcover",
    finish: "matte",
    spine: "#152438",
    band: "#e3b85d",
    ink: "#faf7f0",
    face: "serif",
    caps: false,
    width: 34,
    height: 242,
    lean: -2.0,
    depth: 1.0,
    wear: 0.12,
  },
  {
    id: "rec-anxious-people-backman--102",
    title: "Anxious People",
    author: "Fredrik Backman",
    genres: ["Fiction", "Mystery & Thriller"],
    cover: "https://covers.openlibrary.org/b/id/10398687-L.jpg",
    year: 2019,
    blurb: "A failed bank robber locks himself in with an overly enthusiastic real estate agent, two bitter Ikea addicts, and a pregnant woman.",
    rating: 0,
    finished: "Recommended by Julian",
    recommender: "Julian",
    publisher: "Atria Books",
    binding: "paperback",
    finish: "gloss",
    spine: "#3f271d",
    band: "#db5a38",
    ink: "#faf7f0",
    face: "sans",
    caps: true,
    width: 30,
    height: 226,
    lean: 0,
    depth: -1.5,
    wear: 0.22,
  },
  {
    id: "rec-piranesi-susanna-clarke--103",
    title: "Piranesi",
    author: "Susanna Clarke",
    genres: ["Fantasy", "Mystery & Thriller"],
    cover: "https://covers.openlibrary.org/b/id/10344406-L.jpg",
    year: 2020,
    blurb: "Piranesi lives in the House. Infinite rooms lined with thousands upon thousands of statues, into which ocean tides surge and recede.",
    rating: 0,
    finished: "Recommended by Claire",
    recommender: "Claire",
    publisher: "Bloomsbury",
    binding: "hardcover",
    finish: "cloth",
    spine: "#222a27",
    band: "#948259",
    ink: "#faf8f2",
    face: "serif",
    caps: true,
    width: 28,
    height: 238,
    lean: -3.5,
    depth: 2.2,
    wear: 0.15,
  },
];

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<Book[]>(() => {
    if (typeof window === "undefined") return INITIAL_RECOMMENDATIONS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load recommendations from storage:", e);
    }
    return INITIAL_RECOMMENDATIONS;
  });

  const [justAdded, setJustAdded] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recommendations));
    } catch (e) {
      console.warn("Failed to persist recommendations:", e);
    }
  }, [recommendations]);

  const addRecommendation = useCallback((newBook: Book) => {
    setRecommendations((prev) => [newBook, ...prev]);
    setJustAdded(newBook.id);

    const timer = setTimeout(() => {
      setJustAdded(null);
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  return {
    recommendations,
    justAdded,
    addRecommendation,
  };
}
