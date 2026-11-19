# START Berlin V2 design system

Design values live in [tokens.css](src/styles/tokens.css). Shared controls and layout classes live in [primitives.css](src/styles/primitives.css). Read the [component guide](docs/STYLE_GUIDE.md) before changing a page or component.

## Layout and spacing

Values in pixels assume the default 16 px root type size. Rem-based dimensions grow with text settings.

| Role | Token or class | Measure |
| --- | --- | --- |
| Page edge | .page-container and --layout-page | 80 rem of usable content with minimum gutters of 16 px, 24 px from 640 px, and 32 px from 1024 px |
| Reading column | .readable and --layout-reading | 44 rem inside the page edge, including legal pages and long job details |
| Lead copy | --layout-lead | 32 rem for short introductory copy over wide photos |
| Long form | --layout-form | 52 rem inside the page edge for employer submissions |
| Content after a hero | .page-flow and --space-page-start | 40 px, then 64 px from 1024 px |
| Between major sections | .section-stack and --space-section | 64 px, then 96 px from 1024 px. The stack supplies the gap once. |
| Heading to section content | --space-heading | 24 px, then 32 px from 1024 px |
| Card grids and interiors | --space-grid and --space-card | 16 px, then 24 px from 768 px |
| Dense controls and grids | --space-grid-dense | 12 px, then 16 px from 768 px |
| Text and photo columns | --space-columns | 32 px, then 64 px from 1024 px |

Use the 4 px spacing scale for smaller gaps, insets and offsets. Set the section rhythm on the parent stack. Photo bands such as the newsletter use internal padding to make room for the content over the image. Header, content and footer share the page edge. Hero backgrounds and the announcement may span the viewport. Use container-width queries for layouts that depend on their own available space, such as the directory, Journey and Events.

## Geometry, colour and typography

| Role | Token | Measure |
| --- | --- | --- |
| Buttons and small action tiles | --radius-control | 4 px |
| Fields and filter trays | --radius-field | 8 px |
| Cards, overlays and photo frames | --radius-card | 12 px |
| News photo cards | --radius-news-card | 16 px |
| Badges, circular portraits and Social links in News | --radius-pill | Fully rounded |
| Dividers and active edges | --border-width and --border-width-accent | 1 px and 2 px |
| Elevated menu | --shadow-overlay | Black at 25 percent, with 25 px vertical offset, 50 px blur and -12 px spread |
| Crop or frame | --ratio-square, --ratio-photo, --ratio-portrait | 1:1, 16:10 and 4:5 |

Use navy for the page, white for primary text and cyan for accents. Use navy text on cyan. Use the semantic border and surface roles for controls, cards and errors. Keep text at 4.5:1 where required and essential control indicators at 3:1. Check these against the actual background on image overlays. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

Keep the Avenir stack and its system fallbacks. Use 16 px for body text and inputs, 18 px for long editorial copy, 14 px for labels and actions, and at least 12 px for badges. Use the shared leading values of 1.65 for copy, 1.4 for controls and 1.05 for display text. [SectionHeading](src/components/SectionHeading.astro) supplies the standard section heading and a compact title for cards. Outlined display text gets a solid fill in forced-colors mode.

Use one overlay shadow. The application-status dot has its own accent ring, the country picker uses a border for invalid state, and the Journey rail uses a backdrop that reaches into the gutters. Each effect has a separate purpose.

## Controls and access

| Control | Use |
| --- | --- |
| .button | Filled primary action, usually white with navy text |
| .button.button--outline | Secondary action with a visible border |
| .text-action | Standalone text action with a 44 px minimum target |
| .icon-action | Labeled icon action with a 44 by 44 px minimum target |
| .ui-control | Labeled input, select or textarea with an 8 px radius |

Buttons and fields start at 48 px high and can grow for wrapped text. Use the same classes in Astro and React. Links navigate and buttons perform actions. Isolated text links get a 44 px target. Links in paragraphs follow the line height of the text. Opt in to the cyan fill with data-accent for the Events member CTA and the Newsletter CTA. The filled and outlined buttons share geometry and states.

Keep the shared keyboard focus outline at 2 px with a 4 px offset. Use an inset outline inside clipped rows and overlays and a dark outline on the cyan announcement. The shared layout offers "Skip to main content" before navigation. It offsets focus and fragment targets from the sticky header. Members adds the measured filter-bar height on tall screens, and Journey accounts for its own sticky rail.

Across forms, keep the visible label in the accessible name. Connect errors and hints to their fields, preserve entries on error, and return focus to the search field after clearing filters. Describe asynchronous results in the relevant status region. The standalone navigation is available through a native disclosure when scripts are unavailable.

## Deliberate exceptions

- The header links "Apply Now" and "Jobs" form a pair of white, uppercase buttons. Use the 2 px divider and 4 px outer corners. Desktop uses the compact 44 px minimum. Mobile uses the roomier navigation row. The main navigation uses plain links without an underline and exposes the current page through aria-current.
- Home keeps equal spacing before and after the partner strip through --home-partner-gap. The current values are 128 px below 640 px and 160 px from 640 px. The strips use their original logo dimensions and spacing while moving.
- Latest News keeps its 48/60 px editorial heading, rounded Social links and 16 px photo cards with original image proportions. The desktop cards use a height of up to 475 px. Text remains in the card's layout so it can enlarge. A sufficiently tall desktop with a fine pointer can scroll through the pinned horizontal row. Keyboard entry, short viewports and reduced motion use the native scrollable row. Phones keep a stacked list with "Show more". The newly revealed card receives focus.
- Member Stories portraits use 56 px selection targets, growing to 64 px from 768 px. A badge on a member card is centred over the portrait edge. Board portraits and event graphics retain their square crop. The portrait column on Board profiles follows the available content width.
- The full-width announcement link has a 44 px minimum height. The footer's animation control pauses the ticker, slideshow, automatic News scrolling, moving logos, city names and automatic story rotation for the browser tab. Reduced-motion settings or disabled scripts use readable static states. The manual story selector remains available when scripts are enabled.
- Luma owns the calendar within its frame. The standalone and panel layouts reserve space for the iframe. Keep the direct calendar link and the frame label available. See the [Luma component guide](docs/STYLE_GUIDE.md#shared-components).

## Verification

Run the repository design check for spacing, radii, shadows, type and colour values. Verify sitewide changes on all route types at 320, 390, 768, 1024, 1280, 1440 and 1920 CSS pixels. Include landscape, 200 percent text size, keyboard focus, reduced motion and forced colours. Check the mobile and desktop News treatments and the native menu without JavaScript. Follow the repository's [verification commands](AGENTS.md#commands) and [component guide](docs/STYLE_GUIDE.md#verification) for build and release checks.
