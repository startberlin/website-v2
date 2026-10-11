# Partners navigation, 11 October 2026

The shared Header now renders Partners as a direct `/partners` link on desktop and mobile. For Partners and Our Partners are removed from the shared navigation data. The existing link renderer provides the same visual treatment and keyboard access as Events; Community remains a disclosure. No style or client-script change is needed.

The Notion Website v2 Overhaul backlog now has one active Partners task combining the partner presentation and prospective-partner contact journey. The former For Partners task is marked Archived with a link to Partners. The planned legacy `/for-partners.html` redirect now targets `/partners`. Assignees and deadlines are preserved. These are planning updates; the actual Partners page and legacy redirect remain implementation work.

Verification used Node.js 22.23.3 and a fresh isolated Node build in `.astro/partners-navigation-build`. The temporary built-server browser check is stopped. The source preview runs at [127.0.0.1:4321](http://127.0.0.1:4321/), with no Cockpit credentials or external requests used for these checks.

| Check | Result |
| --- | --- |
| Design and SEO guards | Pass |
| Existing SEO tests | 9 pass |
| Astro typecheck | 109 files, zero errors/warnings, six existing hints |
| Isolated Node build | Pass; tracked `dist/` preserved |
| Shared Header routes | 18, including all eight Board profiles, Jobs/form/privacy/error views and the Partners 404 |
| Browser views | 202; widths 320, 390, 768, 1024, 1087, 1088, 1280, 1440 and 1920, plus phone/tablet landscape and four 200% text views |
| Partners link | One direct link per visible menu, no submenu button/panel, 44-pixel targets, no horizontal overflow or obscured target |
| Interactions | Direct desktop keyboard and mobile activation, visible focus, Community disclosure/Escape, mobile inert state/tab order/focus return, mobile-to-desktop resizing |
| Browser exceptions | None |

[Full results](checks.json), [desktop screenshot](desktop.png), [mobile screenshot](mobile.png).

The reserved `/partners` destination still returns HTTP 404. Partners page content is outside this navigation change. The Jobs listing returns its controlled 503 without Cockpit configuration. No form was submitted and no spoken screen-reader audit was performed.
