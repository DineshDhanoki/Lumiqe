# Design System Document: Obsidian Luxe Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Atelier."** 

This is not a standard SaaS interface; it is a high-end editorial experience curated by artificial intelligence. We are moving away from the "app-like" density of traditional platforms and toward the spacious, authoritative feel of a luxury fashion lookbook. 

The design breaks the "template" look through:
*   **Intentional Asymmetry:** Overlapping elements and off-center typography that guide the eye through a narrative rather than a grid.
*   **High-Contrast Scale:** Dramatically large display type paired with microscopic, high-precision labels.
*   **Tonal Depth:** Replacing physical lines with shifting depths of "Obsidian" black and "Glass" translucency.

---

## 2. Colors & Tonal Depth
The palette is built on a foundation of "Obsidian" tones, designed to make imagery and gold accents feel illuminated from within.

### The Obsidian Hierarchy
*   **Background (`#09090B`):** The absolute void. Used for the deepest layer of the experience.
*   **Surface-1 (`#111116`):** The primary canvas for editorial sections.
*   **Surface-2 (`#18181F`):** For interactive components and elevated cards.

### Accents (The Light)
*   **Primary (`#C4973E` / `primary_container`):** Our signature gold. Use for precision accents, active states, and high-value CTAs.
*   **Secondary (`#8B7FE8`):** AI Violet. Represents the "intelligence" layer—use for AI-generated insights or processing states.
*   **Tertiary (`#E87F8B`):** Beauty Rose. Represents the "human" layer—use for personalization, skin-tone analysis, and floral/product badges.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning content. Boundaries must be defined solely through background color shifts. 
*   *Example:* A `surface_container_low` section sitting on a `surface` background provides all the separation needed. If the design feels "muddy," increase the whitespace, do not add a line.

---

## 3. Typography
Our typography is a dialogue between timeless elegance and technical precision.

*   **Display (`Cormorant Garamond`):** Used for large hero titles and "editorial moments." This font carries the heritage and luxury of the brand. Use with tight letter-spacing for a "high-fashion" feel.
*   **Headings (`Plus Jakarta Sans`):** Used for navigation and functional headers. It provides a modern, geometric counterweight to the serif display type.
*   **Body (`Inter`):** Our workhorse for readability. Reserved for product descriptions and AI analysis text.
*   **Labels (`DM Sans`):** Used for micro-copy and metadata.
*   **Mono (`JetBrains Mono`):** Used for "AI Raw Data" or technical skin metrics to convey scientific accuracy.

---

## 4. Elevation & Depth
In this design system, depth is achieved through **Tonal Layering** and **Atmospheric Glass**, never through traditional drop shadows.

### The Layering Principle
Stack surfaces to create hierarchy. 
*   **Base:** `surface` (#131315)
*   **Mid:** `surface_container` (#201F22)
*   **Top:** `surface_container_highest` (#353437)

### Glassmorphism & The 16px Blur
For floating elements (modals, dropdowns, navigation bars), use a semi-transparent `surface` color with a **16px backdrop-blur**. This allows the "Obsidian" background to bleed through, softening the interface and making it feel like a physical lens.

### Ambient Shadows
If a floating element requires a shadow, it must be an "Ambient Glow":
*   **Shadow Color:** A tinted version of the surface color (not black).
*   **Blur:** 40px - 60px.
*   **Opacity:** 4%-8%.

### The "Ghost Border"
When a container requires a border for accessibility or to showcase the signature gold, use a **Ghost Border**. This is a `0.5px` or `1px` stroke using the `primary` (Gold) token at **15% - 20% opacity**. It should feel like a catch-light on a metal edge, not a box.

---

## 5. Components

### Buttons (10px Radius)
*   **Primary:** A subtle gradient from `primary_container` to `primary`. Text is `on_primary` (dark).
*   **Secondary (Glass):** Semi-transparent background with a 16px blur and a 1px "Ghost Border" in Gold.
*   **Tertiary:** Text-only in `primary` gold, using `JetBrains Mono` for an "Analysis" aesthetic.

### Cards (16px - 24px Radius)
*   **Rules:** Forbid the use of divider lines inside cards. Use vertical white space (from the Spacing Scale) or a 2% shift in background value to separate the "Header" from the "Body" of a card.
*   **Style:** Background `surface_container`, with a 16px blur if overlaid on imagery.

### Input Fields
*   **Style:** Minimalist. No background fill—only a bottom stroke using `outline_variant`.
*   **Active State:** The bottom stroke transitions to `primary` Gold, and the label (in `DM Sans`) floats upward.

### Seasonal Color Badges
*   Use the `tertiary_container` (Rose) for "Spring/Summer" trends and the `secondary_container` (Violet) for "Tech-Powered" features. Badges should be pill-shaped (`full` roundedness) with `label-sm` typography.

---

## 6. Do's and Don'ts

### Do:
*   **Use Generous Whitespace:** If you think there is enough space, double it. Luxury is defined by the "waste" of space.
*   **Embrace High Contrast:** Pair your warmest off-whites (`#F2EDE8`) against the deepest obsidian for a "lit" look.
*   **Layer Imagery:** Allow product photography to bleed behind glass cards or overlap section boundaries.

### Don't:
*   **Don't use 100% Opacity Borders:** High-contrast borders look "cheap" and "default." Keep them "Ghosted."
*   **Don't use Standard Grids:** Break the grid occasionally. Let a headline or an image sit off-center to create an editorial flow.
*   **Don't use Grey Shadows:** Shadows should always be a dark tint of the underlying obsidian or a faint glow of the primary gold.