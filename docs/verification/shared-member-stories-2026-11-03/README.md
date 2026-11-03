# Shared Member Stories verification

Verified on 3 November 2026 with Node.js 22.23.4 and Chromium. The comparison baseline is `3e4bf8e1422e8312cd5754f3c2d4f1371410ed9c`, after all five dependency PRs were merged.

The complete Member Journey section is extracted into `src/components/MemberStories.astro` and used by both `/member-journey` and `/join`. The section retains all seven portraits and the first story's full-width featured treatment. Its heading, copy, responsive grid and spacing come from Member Journey. Join's replaced markup, initials helper and card styles are removed. The story records remain the shared source in `src/data/member-journey.ts`.

## Validation

- Design and SEO guards pass. All 95 tests pass.
- Typecheck: 116 files, zero errors, zero warnings and six existing hints.
- Isolated Node and Vercel builds pass, including packaged-function startup and built-server smoke.
- At nine viewports, both routes render identical normalized story-section HTML. Each has one section with seven portraits and one featured story.
- Relative card geometry on Join matches Member Journey within 0.2 pixels. The extracted Member Journey section also matches its previous layout within 0.2 pixels, with the same text.
- Viewports: 320 × 640, 390 × 844, 768 × 1024, 1024 × 768, 1280 × 800, 1440 × 900, 1920 × 1080, 844 × 390 and 1180 × 820.
- Both routes pass the full matrix with JavaScript enabled and disabled: 36 views with no horizontal overflow or page errors. Keyboard tabs and journey anchors pass. Both pages reflow at a 32-pixel root font at 320, 768 and 1280 pixels.
- Phone and desktop screenshots were visually inspected. No new dependency, client script or image source is introduced.

No Safari, Firefox, spoken screen-reader pass, real-device zoom or external form delivery is established by this local check. Production publication remains a separate release.
