export type Category = (typeof CATEGORIES)[number];

export const CATEGORIES = [
  "Psychological Fiction",
  "Productivity & Time Management",
  "Psychology & Human Behaviour",
  "Emotional Intelligence",
  "Communication & Social Skills",
  "Persuasion & Influence",
  "Philosophy",
  "Existentialism",
  "Business & Entrepreneurship",
  "Management & Leadership",
  "Strategy",
  "Marketing & Sales",
  "Negotiation",
  "Finance & Investing",
  "Economics",
  "Wealth & Money Psychology",
  "Biographies & Autobiographies",
  "History",
  "Neuroscience",
  "Reading & Thinking",
  "Creativity",
  "Career & Professional Development",
  "Education Management & Policy",
  "Great Works / Must-Read Classics",
] as const;

export type Book = {
  id: string;
  bookNumber?: number;
  title: string;
  author: string;
  genres?: string[];          // genre tags shown as filter pills
  category?: string;
  level?: "Foundation" | "Core" | "Intermediate" | "Advanced" | "Masterwork" | string;
  cover: string;               // real cover art (Open Library URL)
  year: number;
  blurb: string;
  rating: number;              // 0 means unrated
  finished: string;            // e.g. "Jul 2026"
  recommender?: string;        // set only when a visitor recommended it
  publisher: string;
  binding: "hardcover" | "paperback" | "mass";
  finish: "cloth" | "gloss" | "matte";   // spine surface material
  spine: string;               // base color, sampled from the cover's left edge
  band?: string;               // accent pulled from the cover art
  ink: string;                 // lettering color
  face: "serif" | "sans" | "mono";       // lettering style
  caps?: boolean;
  width: number;               // spine width in px
  height: number;              // spine height in px
  lean: number;                // degrees of lean on the shelf
  depth: number;               // how far forward/back the book sits, px
  wear: number;                // 0–1 edge wear and ink fade
  spineImage?: string;
};

import { rawBooks } from "./booksList";

export const books: Book[] = rawBooks;
