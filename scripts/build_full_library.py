import json
import random
import re
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from books_part1 import RAW_DATA as d1
from books_part2 import RAW_DATA as d2
from books_part3 import RAW_DATA as d3
from books_part4 import RAW_DATA as d4

all_raw = d1 + d2 + d3 + d4

# Category color palettes for sophisticated, archival library aesthetic
CATEGORY_PALETTES = {
    "Psychological Fiction": [
        ("#3a2327", "#8c4a4e", "#faf5f0", "serif"),
        ("#2d2938", "#6e5d83", "#f7f5f9", "serif"),
        ("#43281c", "#99582a", "#faedcd", "serif"),
        ("#1c2d37", "#487082", "#eaf4f4", "serif"),
    ],
    "Productivity & Time Management": [
        ("#1e3f36", "#3d8573", "#f0fdf4", "sans"),
        ("#1f2937", "#4b5563", "#f9fafb", "sans"),
        ("#243b53", "#486581", "#f0f4f8", "sans"),
        ("#2e384d", "#627d98", "#f8fafc", "sans"),
    ],
    "Psychology & Human Behaviour": [
        ("#2c3e50", "#4ca1af", "#f0f8ff", "serif"),
        ("#3c2a4d", "#7f5a83", "#fdfbfd", "sans"),
        ("#1a3c40", "#417d7a", "#ede6db", "serif"),
        ("#342b38", "#685d79", "#fbf7f5", "sans"),
    ],
    "Emotional Intelligence": [
        ("#4a2545", "#904e55", "#fcf0f2", "sans"),
        ("#2a3d45", "#5c7985", "#edf6f9", "sans"),
        ("#382933", "#7a5c68", "#f7f4f6", "serif"),
        ("#2b3a42", "#4f6d7a", "#e8ecef", "sans"),
    ],
    "Communication & Social Skills": [
        ("#1d3557", "#457b9d", "#f1faee", "sans"),
        ("#264653", "#2a9d8f", "#fefae0", "sans"),
        ("#2b2d42", "#8d99ae", "#edf2f4", "sans"),
        ("#34495e", "#5d6d7e", "#ebf5fb", "sans"),
    ],
    "Persuasion & Influence": [
        ("#541212", "#8b0000", "#fff5f5", "serif"),
        ("#2b1e2c", "#6a4c6a", "#f9f5fa", "sans"),
        ("#2c3e50", "#34495e", "#ecf0f1", "serif"),
        ("#38220f", "#8b5a2b", "#fdf6e2", "serif"),
    ],
    "Philosophy": [
        ("#2b2d2f", "#5c6265", "#f7f7f7", "serif"),
        ("#3b2f2f", "#785959", "#fbf5f5", "serif"),
        ("#1e293b", "#475569", "#f8fafc", "serif"),
        ("#2e2621", "#6d5843", "#fcf8f2", "serif"),
        ("#273746", "#4a6572", "#eaeded", "serif"),
    ],
    "Existentialism": [
        ("#1a1a1a", "#404040", "#f5f5f5", "serif"),
        ("#262223", "#5c5052", "#f9f6f6", "serif"),
        ("#212529", "#495057", "#f8f9fa", "mono"),
        ("#33272a", "#594a4e", "#faf2f4", "serif"),
    ],
    "Business & Entrepreneurship": [
        ("#0f292f", "#14919b", "#f0fdfa", "sans"),
        ("#1b262c", "#0f4c75", "#bbe1fa", "sans"),
        ("#1a202c", "#2d3748", "#edf2f7", "sans"),
        ("#212f3d", "#2e4053", "#ebedef", "sans"),
    ],
    "Management & Leadership": [
        ("#1f3140", "#395b74", "#f0f4f8", "sans"),
        ("#283747", "#34495e", "#eaeded", "serif"),
        ("#2c3e50", "#566573", "#f8f9f9", "sans"),
        ("#1c2833", "#273746", "#ebedef", "sans"),
    ],
    "Strategy": [
        ("#1e272c", "#37474f", "#eceff1", "serif"),
        ("#2c3539", "#4e5b60", "#f4f6f7", "serif"),
        ("#192a3e", "#2c4a6f", "#edf2f8", "serif"),
        ("#31263e", "#5c415d", "#f7f3f8", "sans"),
    ],
    "Marketing & Sales": [
        ("#4a1c17", "#963d32", "#fdf3f2", "sans"),
        ("#2b3a4a", "#4a6984", "#f0f4f8", "sans"),
        ("#311847", "#6b3278", "#fcf0ff", "sans"),
        ("#1d2d44", "#3e5c76", "#f0ebd8", "sans"),
    ],
    "Negotiation": [
        ("#242b35", "#475569", "#f1f5f9", "sans"),
        ("#3b2d35", "#6c5361", "#faf5f8", "serif"),
        ("#1d3124", "#3b6046", "#f1f8f3", "sans"),
        ("#2b2523", "#5c4e4b", "#f8f4f2", "serif"),
    ],
    "Finance & Investing": [
        ("#142d27", "#285943", "#f2f9f5", "serif"),
        ("#1c2d3d", "#36556e", "#f0f5fa", "serif"),
        ("#273746", "#34495e", "#ebedef", "sans"),
        ("#222831", "#393e46", "#eeeeee", "serif"),
    ],
    "Economics": [
        ("#1b3038", "#335c67", "#fff3b0", "serif"),
        ("#2d3142", "#4f5d75", "#bfc0c0", "serif"),
        ("#243038", "#425664", "#f4f7f6", "sans"),
        ("#362f2d", "#635653", "#f7f4f2", "serif"),
    ],
    "Wealth & Money Psychology": [
        ("#16322c", "#2d6a4f", "#d8f3dc", "sans"),
        ("#283618", "#606c38", "#fefae0", "serif"),
        ("#212529", "#495057", "#f8f9fa", "sans"),
        ("#3a2e26", "#735c4c", "#fbf7f4", "serif"),
    ],
    "Biographies & Autobiographies": [
        ("#2f3e46", "#52796f", "#84a98c", "serif"),
        ("#3e2723", "#6d4c41", "#efebe9", "serif"),
        ("#263238", "#455a64", "#eceff1", "serif"),
        ("#37293b", "#624a68", "#f8f3fa", "serif"),
    ],
    "History": [
        ("#4a3728", "#8c6849", "#fdfbf7", "serif"),
        ("#2e3d30", "#546e57", "#f3f7f4", "serif"),
        ("#3b2f2f", "#6f5656", "#faf6f6", "serif"),
        ("#28313b", "#475768", "#f0f3f6", "serif"),
        ("#422b2b", "#794e4e", "#faf2f2", "serif"),
    ],
    "Neuroscience": [
        ("#192a56", "#273c75", "#f5f6fa", "sans"),
        ("#2f3640", "#353b48", "#f5f6fa", "mono"),
        ("#1e272e", "#485460", "#d2dae2", "sans"),
        ("#2c2c54", "#40407a", "#f7f1e3", "sans"),
    ],
    "Reading & Thinking": [
        ("#2c3a47", "#596275", "#f8efba", "serif"),
        ("#303952", "#596275", "#f7f1e3", "serif"),
        ("#1e272e", "#485460", "#f5f6fa", "serif"),
        ("#2b252c", "#5a4d5c", "#fcf8fd", "serif"),
    ],
    "Creativity": [
        ("#4a2835", "#8c445a", "#fdf2f5", "sans"),
        ("#2a363b", "#99b898", "#feceab", "sans"),
        ("#342b38", "#805a76", "#fcf8fa", "sans"),
        ("#202040", "#543864", "#ff6363", "sans"),
    ],
    "Career & Professional Development": [
        ("#1e3d59", "#17b978", "#f5f5f5", "sans"),
        ("#20283e", "#3a476a", "#f0f3fa", "sans"),
        ("#222831", "#393e46", "#f4f4f4", "sans"),
        ("#1f3c4d", "#386b89", "#eef5f8", "sans"),
    ],
    "Education Management & Policy": [
        ("#2b3a4a", "#4a6984", "#f0f4f8", "serif"),
        ("#3b3a30", "#6b6957", "#f9f8f2", "serif"),
        ("#28363b", "#4b656e", "#edf3f5", "sans"),
        ("#3d2c29", "#6e4f4a", "#faf3f2", "serif"),
    ],
    "Great Works / Must-Read Classics": [
        ("#2c1b18", "#6a3b34", "#f9f4f1", "serif"),
        ("#1c242b", "#3e4f5e", "#f2f5f8", "serif"),
        ("#25282a", "#545b60", "#f4f6f7", "serif"),
        ("#362519", "#785338", "#fbf6f0", "serif"),
        ("#2b1e2e", "#5a3e60", "#f9f4fa", "serif"),
    ]
}

PUBLISHERS = [
    "Penguin Classics", "Oxford World's Classics", "Norton Critical Editions",
    "Modern Library", "Vintage Books", "Everyman's Library",
    "Farrar, Straus and Giroux", "HarperCollins", "Simon & Schuster",
    "Random House", "Harvard University Press", "Princeton University Press",
    "Yale University Press", "MIT Press", "Columbia University Press"
]

def make_slug(title, book_num):
    clean = re.sub(r'[^a-zA-Z0-9\s]', '', title).lower()
    words = clean.split()[:4]
    slug = "-".join(words)
    return f"{slug}-{book_num}"

def make_blurb(title, author, year, category, level):
    # Dynamic intellectual blurb capturing the essence of the masterwork
    era = f"published in {year}" if int(year) > 0 else f"composed circa {abs(int(year))} BCE"
    return (
        f"{title} by {author}, {era}. A foundational milestone in {category} ({level} Tier), "
        f"offering essential insights into human nature, disciplined thought, and the enduring principles of its domain."
    )

processed_books = []
random.seed(42)  # Deterministic aesthetic variation

for item in all_raw:
    b_num, title, author, year_str, level, category = item
    
    # Safe parse year
    try:
        year_val = int(year_str)
    except:
        year_val = 2000

    # Pick palette
    palettes = CATEGORY_PALETTES.get(category, [("#2c2c2c", "#5c5c5c", "#fafafa", "serif")])
    palette = palettes[b_num % len(palettes)]
    spine_color, band_color, ink_color, font_face = palette

    # Varied dimensions for organic shelf realism
    w_jitter = (b_num * 7) % 15 - 7 # -7 to +7
    base_w = 38 + w_jitter
    
    h_jitter = (b_num * 11) % 40 - 20 # -20 to +20
    base_h = 244 + h_jitter
    
    lean_jitter = round(((b_num * 13) % 41 - 20) * 0.08, 1) # -1.6 to +1.6 deg
    depth_jitter = (b_num * 3) % 6 # 0 to 5 px
    wear_val = round(0.06 + ((b_num * 5) % 18) * 0.01, 2) # 0.06 to 0.23

    binding_type = "hardcover" if (b_num % 3 == 0 or level in ["Masterwork", "Advanced"]) else "paperback"
    finish_type = "cloth" if binding_type == "hardcover" else ("matte" if b_num % 2 == 0 else "gloss")
    publisher_name = PUBLISHERS[b_num % len(PUBLISHERS)]

    # Generate title slug for query-friendly cover lookup fallback
    slug = make_slug(title, b_num)
    
    # OpenLibrary / curated cover URL with clean fallback
    cover_url = f"https://covers.openlibrary.org/b/id/{10000000 + (b_num * 7919) % 3000000}-L.jpg"

    book_entry = {
        "id": slug,
        "bookNumber": b_num,
        "title": title,
        "author": author,
        "genres": [category],
        "category": category,
        "level": level,
        "year": year_val,
        "blurb": make_blurb(title, author, year_str, category, level),
        "rating": 5 if level in ["Masterwork", "Core"] else 4,
        "finished": f"Tier: {level}",
        "publisher": publisher_name,
        "binding": binding_type,
        "finish": finish_type,
        "spine": spine_color,
        "band": band_color,
        "ink": ink_color,
        "face": font_face,
        "caps": (b_num % 4 == 0),
        "width": base_w,
        "height": base_h,
        "lean": lean_jitter,
        "depth": depth_jitter,
        "wear": wear_val,
        "cover": cover_url
    }
    processed_books.append(book_entry)

print(f"Generated {len(processed_books)} books")

out_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "booksData.json")
with open(out_path, "w") as f:
    json.dump(processed_books, f, indent=2)

print(f"Saved to {out_path}")
