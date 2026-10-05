# Members and shared photo heroes

Updated 5 October 2026.

The members directory contains 45 people in season 26/27. The corrected roster removes Paul Steinau, Bo Ehrich, Marta Kielpinski and Kalina Petrykowska. There are 44 LinkedIn profiles and 43 local portraits. Seoyoung's profile lookup was skipped on request. Daria has a LinkedIn destination and an initials avatar.

`src/data/team.json` stores season roles and departments. `src/data/member-profiles.json` stores each person's START email, optional public profile URL and portrait filename. Profile keys match the roster names. Board heads reuse the same record in both listings. The two JSON files total 10,823 bytes; portrait sources total 230,764 bytes. The page remains prerendered, with lazy 96- and 192-pixel WebP portraits.

LinkedIn and mail icons share a centered row below the role. Their visible size is 18 pixels, with separate 44-pixel touch targets and shared keyboard focus. Hover and focus use the site accent colour. All 45 START email addresses were read from Cockpit's Admin > People > Members > START Email field on 5 October. Addresses are stored verbatim, including `jean-philipp.donie@start-berlin.com`. The mail helper accepts only START's domain and creates a `mailto:` link. Seoyoung has a mail-only profile; the earlier decision to skip the LinkedIn lookup remains in place.

LinkedIn links retain `utm_source=start-berlin.com`, `utm_medium=referral`, `utm_campaign=members` and a person-specific `utm_content`. These parameters identify referral traffic; they do not create a separate click analytics service. The directory uses an 8-rem minimum card width to reduce its column count at enlarged text sizes. Its scroll offset keeps focused links below the sticky header and filters.

Department and Board badges overlap the portrait's lower edge. One- and two-line badges retain at least 23 pixels before the name. Search includes the default Member role. The result count sits below the filters and counts people once across repeated Board and department cards. Invalid season parameters fall back to the newest populated season.

`PageHero.astro` shares the photo gradients, typography and content spacing across Home, Join, Members and Jobs. Home keeps its taller landing variant and slideshow; reduced-motion preferences prevent rotation. Members reuses the existing `hero-3.jpg`. Responsive WebP widths are bounded by the original image resolution. The two Join hero buttons have equal width and 50-pixel height below 640 pixels. The Join statistics fit at 320 pixels.

## Verification, 30 September 2026

Astro typechecking passed with zero errors and zero warnings; three existing Zod deprecation hints remain. The production build passed using `.astro/members-build`, preserving tracked `dist/`. The 47 existing Jobboard helper/API/route tests pass with mocked provider responses.

Browser verification covers 26 hero/breakpoint combinations and all 50 member cards at six CSS widths from 320 to 1440 pixels. There are no horizontal overflows or clipped card labels. Search and department filters update the unique-person count correctly. The four mobile Join button checks include the 639/640-pixel boundary. All 86 portrait variants and all 11 inspected photo-hero variants returned HTTP 200.

- [Members card checks](verification/member-badges-2026-09-30/browser-qa.json)
- [Portrait storage and delivery](verification/member-badges-2026-09-30/storage-image-qa.json)
- [Hero checks](verification/page-heroes-2026-09-30/browser-qa.json)
- [Button checks](verification/page-heroes-2026-09-30/join-buttons-qa.json)
- [Unique-person count checks](verification/page-heroes-2026-09-30/member-count-qa.json)
- [Production artifact checks](verification/page-heroes-2026-09-30/build-qa.json)
- [Hero image delivery](verification/page-heroes-2026-09-30/image-delivery-qa.json)

![Members photo hero](verification/page-heroes-2026-09-30/members-desktop.jpg)
![Mobile Join buttons](verification/page-heroes-2026-09-30/join-mobile.jpg)
![Board cards](verification/member-badges-2026-09-30/desktop-board.jpg)

## Contact verification, 5 October 2026

Design check, Astro typecheck and the isolated `.astro/member-contacts-build` production build pass. Typecheck reports zero errors and warnings with three existing Zod hints. All 44 earlier LinkedIn/portrait records are preserved, and all 50 rendered mail links match the 45 unique Cockpit contacts. No emails were sent.

Fifteen browser views cover all 50 cards at 320, 359, 360, 390, 639, 640, 767, 768, 1023, 1024, 1280, 1440 and 1920 CSS pixels, plus phone/tablet landscape. Seven enlarged-text views use a temporary copy of the built Members HTML with a 32-pixel root font at 320, 390, 768, 1024, 1280, 1440 and 1920 pixels. Card text and portraits stay inside their bounds, contact targets do not overlap, and keyboard focus stays visible below the sticky controls. Search, every department filter, empty results and the mail-only profile pass. Native accessibility names and decorative SVG states were inspected; screen-reader speech was not audited. The temporary route was removed after verification.

Evidence and screenshots: [Member contacts verification](verification/member-contacts-2026-10-05/README.md). Verification was local; the contact data and components are part of the V2 source. Production configuration remains separate.

## Runtime boundary

The local Jobs preview currently renders its unavailable state because `COCKPIT_API_URL` and `JOBBOARD_READ_API_KEY` are absent. Its hero and Post a role destination passed inspection. The current live job list and external form delivery were not validated in this design pass. Deployment configuration remains necessary for the server-rendered Jobboard; see `.env.example` and the existing integration plan.
