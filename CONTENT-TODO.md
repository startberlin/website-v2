# Phase 2 — content the homepage draft is waiting on

Everything below renders in `index.html` with a **dotted magenta underline**. All of it
lives in one file: `assets/js/data.js`. Nothing else needs editing.

Toggle the marking with the "hide placeholders" button in the draft banner to see how
the page reads once it's filled.

Legend: **owner** = the department the brainstorming implies should supply it.

---

## 1 · Cycle dates — owner: Community / Chapter Lead
`DATA.cycle`

| Field | Currently showing | Needed |
|---|---|---|
| `applicationDeadline` | 26 April | Real deadline for the next batch |
| `interviewsUntil` | 12 May | Real interview window end |
| `sprintDates` | 5–7 June | **START Sprint** dates + rough location, so applicants can block them |
| `batchLabel` | Batch 26/27 | Confirm naming convention |

> The dates shown are **last cycle's real dates**, reused so the "applications open"
> state is visible. They are wrong for the new batch by definition.

**Open naming question:** the current live site calls onboarding the *"Onboarding Trip"*
and *"Onboarding Day"*; the brainstorming calls it the **START Sprint**. The draft uses
START Sprint throughout. Confirm, then make it consistent everywhere.

---

## 2 · Numbers — owner: Operations & Digital
`DATA.stats`

All four (500 members · 1,000 alumni · 20+ nationalities · since 2013) are carried over
from the current live site and marked **verified**. Two things to settle:

- The live site is internally inconsistent: the homepage shows "500 Members / 1000 Alumni",
  `for-students` shows "500 members in berlin". Pick one definition and stick to it.
- Brainstorming asks for **live sync**. `DATA.stats` is deliberately shaped so a Cockpit
  fetch can replace it without touching markup. Needs: does the Cockpit expose these yet,
  and at what endpoint?

---

## 3 · Testimonials — owner: Growth + Community
`DATA.testimonials`

Three real ones are in place (Mahir Isikli, Anouar Springer, Polina Shcheglova) with their
real portraits from the current site.

**Two slots are empty** — both need an *active batch member*, to hit the brainstorming's
70% alumni / 30% active mix and to cover the Entrepreneurship and Social dimensions,
which currently have no active voice.

Each testimonial should answer the three brainstorming questions:
1. Why did I join START?
2. What did I move during my time here?
3. What came of it / what am I doing now?

Plus: a portrait, and confirmation the person is happy to be named publicly.

---

## 4 · Journey detail — owner: Community
`DATA.journey`

Verified from the current site: the application steps, the eligibility criteria, the
five departments, the €40/semester fee.

Unverified and marked:
- "You'll be asked what you want to build or change at START" — the brainstorming wants
  co-creation surfaced as an essential part of the application. **Is this actually a
  question in the Tally form?** If not, it should be, or the claim comes out.
- "It is a conversation, not an exam" — tone claim about the interview, needs a nod from
  whoever runs interviews.
- Flexibility around exams / exchange semester / start-up / competitive sport — the
  brainstorming names this as a real newcomer worry. **Needs an honest, agreed answer.**
  Right now the page promises "it gets planned around". Is that true?
- The two paths after ~12 months (lead role vs active alumni) — confirm the actual
  criteria and timing.

---

## 5 · Key dates & info sessions — owner: Events
`DATA.events`

All six entries are last cycle's dates. Needs the real calendar, plus:
- The brainstorming asks for **two info sessions with the Chapter Lead**. The draft shows
  an online one and an in-person one. Confirm format, dates, and registration route
  (current site used Eventbrite).

---

## 6 · START Global map — owner: Growth / Chapter Lead
`DATA.chapters`

- All 16 city names come from the current site and are real. **Map positions are
  hand-approximated** — fine for a stylised map, but check nothing is badly placed.
- **Per-chapter member counts are all `—`.** The brainstorming wants approximate numbers
  per chapter. Someone has to ask the other chapters.
- Cross-chapter links are inert. The brainstorming proposes a *shared module* with other
  chapters for mutual linking (SEO). That's a conversation with START Global, not a
  code task.

---

## Decisions taken in this draft that Phase 2 may want to reverse

1. **Homepage is newcomer-only.** Partners appear in the nav and footer logo wall only.
   The partner persona's stated wish — "öffentlich sichtbar sein, möglichst präsent,
   mit Testimonial" — is now entirely the job of `/partners`.
2. **Applications-open state only.** The closed state (which is what visitors see most of
   the year) is not designed. The old site's "join our talent pool" is the obvious fill,
   but the layout for it doesn't exist yet.
3. **Avenir Next LT Pro is not in the draft** — it's Adobe-licensed and can't ship in a
   standalone file. A close free stack stands in. Swap `--font-sans` in `style.css`
   when this moves onto a licensed host.
4. **Verb rotation demoted** from headline to a small kicker over the photo.
5. **Timeline naming**: START Sprint, not Onboarding Trip (see §1).

---

## Cross-references to the other planning notes

- `action-items.md` has Leander down for *"2-3 design decisions to present to the member
  community"*. This draft is **one** direction (funnel order, photo-led hero, newcomer-only).
  The forks that were live while building it — and would make the cleanest alternatives to
  present — are: **dimension spine** or **journey spine** instead of funnel order, and a
  **two-door student/partner split** instead of newcomer-only.
- `action-items.md` also has Martin down for *"different design systems"* — this draft
  deliberately keeps the existing brand (navy/magenta/Avenir) so review stays on structure.
  Swapping the design system means editing `:root` in `style.css` and little else.
- `additional-context/wanted-features.md` asks for a **membership hierarchy** page: past
  members by batch, each with name, mini CV and finished projects. That is the "Members"
  nav item — present but inert in this draft, and matches the brainstorming's
  *"Mitglieder nach Batch"* section. Not built; it's a separate page, not homepage scope.
