# Team and member archive

Updated 28 September 2026 against `website-v2/main` at `fecf796`. The original [START Global team page](https://www.startglobal.org/team) remains the recorded product reference. Extend the current `/members` implementation rather than starting another directory.

## Present in the new version

`src/pages/members.astro` and `MemberCard.astro` render the board and departments with name/role search, a department filter and an empty state. Season tabs and URL selection are implemented; `src/data/team.json` currently contains only season 26/27. Each card displays its batch when available, and the search text includes that batch.

These are implemented controls, not remaining design tasks. The data is a dated Cockpit snapshot, not a live integration. After the 30 September corrections, the roster has 45 members with 44 LinkedIn links and 43 local portraits. Initials remain for Daria and Seoyoung; Seoyoung's profile lookup was explicitly skipped. Department and Board badges overlap the portrait's lower edge. LinkedIn and START email icons now share a row below the role; all 45 START email contacts are implemented.

## Remaining from Jannik's idea

- A separate batch selector, including an all-batches option, plus a clear filter reset. Batch-aware text search does not replace the requested control.
- Approved historical seasons so the existing season switch has more than one team to browse.
- The remaining portrait and profile assignment, plus ongoing maintenance of the public roster snapshot. Confirm the current roster before publishing.
- Optional profile extensions: a short introduction or mini CV and completed projects. LinkedIn links are implemented.

Keep board term and joining batch distinct. Reuse the existing season layout and preserve historical role assignments as the data grows. Decide whether the long-term source is a maintained file, a public Cockpit interface or an approved Notion export before adding an integration. Do not infer public membership from private attendance notes.
