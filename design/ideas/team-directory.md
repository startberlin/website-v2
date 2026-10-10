# Team and member archive

Updated 28 September 2026 against `website-v2/main` at `fecf796`. The original [START Global team page](https://www.startglobal.org/team) remains the recorded product reference. Extend the current `/members` implementation rather than starting another directory.

## Present in the new version

`src/pages/members.astro` and `MemberCard.astro` render the board and departments with name/role search, a department filter and an empty state. Season tabs and URL selection are implemented; `src/data/team.json` currently contains only season 26/27. Each card displays its batch when available, and the search text includes that batch.

These are implemented controls, not remaining design tasks. The data is a dated Cockpit snapshot, not a live integration. After the 30 September corrections, the roster has 45 members with 44 LinkedIn links and 43 local portraits. Initials remain for Daria and Seoyoung; Seoyoung's profile lookup was explicitly skipped. Department and Board badges overlap the portrait's lower edge. LinkedIn and START email icons now share a row below the role; all 45 START email contacts are implemented.

## Remaining from Jannik's idea

Update, 10 October 2026: the Board has President, Vice President and Head of Finance in a separate first row, followed by the department heads. All eight current Board members have linked detail pages with contacts, an introduction and selected plain CV/project entries. Normal members have no detail routes. Public facts were researched from LinkedIn. After Jannik's corrections, quotes and CV descriptions are removed, the left category labels remain and the sticky portrait releases before Experience. [Design comparison](../../docs/verification/board-profiles-2026-10-10/README.md), [current verification](../../docs/verification/board-profiles-2026-10-10/sidebar-update/README.md).

- A separate batch selector, including an all-batches option, plus a clear filter reset. Batch-aware text search does not replace the requested control.
- Approved historical seasons so the existing season switch has more than one team to browse.
- The remaining portrait and profile assignment, plus ongoing maintenance of the public roster snapshot. Confirm the current roster before publishing.
- Missing selected CV facts or periods for the implemented Board profiles. Keep the public facts current.
- Optional profile extensions for normal members, plus completed-project history. Board-only introductions/CVs and existing LinkedIn links are already implemented.

Keep board term and joining batch distinct. Reuse the existing season layout and preserve historical role assignments as the data grows. Decide whether the long-term source is a maintained file, a public Cockpit interface or an approved Notion export before adding an integration. Do not infer public membership from private attendance notes.
