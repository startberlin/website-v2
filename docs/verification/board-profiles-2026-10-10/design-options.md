# Board profile layout comparison

The editorial split is selected. It gives the person a clear identity before the CV and keeps a consistent reading column for the introduction and background. The existing navy and Cyan palette is preserved.

All five working variants were compared at 320, 390, 768, 1024 and 1440 CSS pixels. Their content is Jannik's researched background and requested personal draft. The comparison route was removed from the application; its [source fixture](profile-variants.astro.txt) remains as evidence.

| Variant | Composition | Assessment | Views |
| --- | --- | --- | --- |
| 1. Editorial split, selected | Square portrait left; identity and introduction right; quote and CV below. | Consistent reading column, light CV rows and a simple mobile reading order. | [Desktop](variants/split-1440.jpg), [mobile](variants/split-390.jpg), [CV](variants/split-background-1440.jpg) |
| 2. Centred portrait | Round portrait above centred identity and introduction. | Suits a short biography, but needs more vertical space before the CV. | [Desktop](variants/centered-1440.jpg), [mobile](variants/centered-390.jpg), [CV](variants/centered-background-1440.jpg) |
| 3. Compact dossier | Small portrait, compact identity and a two-column CV card grid. | Easy to scan, but the cards add more visual weight than these short backgrounds need. | [Desktop](variants/dossier-1440.jpg), [mobile](variants/dossier-390.jpg), [CV](variants/dossier-background-1440.jpg) |
| 4. Vita timeline | Dates before CV titles, with vertical guide lines. | Emphasises chronology. Undated entries make the timeline less useful here. | [Desktop](variants/timeline-1440.jpg), [mobile](variants/timeline-390.jpg), [CV](variants/timeline-background-1440.jpg) |
| 5. Profile sidebar | Portrait, identity and introduction in a side column; quote and CV alongside. | Brings the CV higher, but makes the introduction narrow and long. The desktop change offers little benefit on mobile. | [Desktop](variants/sidebar-1440.jpg), [mobile](variants/sidebar-390.jpg), [CV](variants/sidebar-background-1440.jpg) |

The selected implementation uses a 60-rem container query instead of a fixed viewport breakpoint. Enlarged text therefore keeps the stacked layout when a reading column would become too narrow. Portrait width is bounded by available space. CV categories use plain rows with optional dates and project links.
