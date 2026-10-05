Follow-up: remove the Footer's secondary status text, 5 October 2026.

The visible "Coming soon" line, its `aria-describedby` association and unused styles were removed. Donate stays disabled until a real destination is provided. The preview anchor `#footer-donation-status` now belongs to the donation wrapper, so existing preview links still scroll to the footer.

Design check, typecheck and the isolated production build pass. Typecheck reports 59 files, zero errors, zero warnings and three existing hints. [81 browser views](browser-views.json) pass across all nine consuming routes at 320, 390, 768, 1024, 1280, 1440 and 1920 CSS pixels, plus phone/tablet landscape. Each view confirms the caption is absent, Donate is disabled without a dangling description, the old anchor exists, footer links keep 44-pixel targets and there is no page overflow or browser error. No Jobboard behaviour changed, so its tests were not repeated.

The active website plan now explicitly requires redesigning and rebuilding `/join`; this follow-up does not modify the Join page itself. The workspace README and contributor guide reflect the requested changes.

![Footer without secondary text](footer-desktop.jpg)

[Mobile footer](footer-mobile.jpg), [build log](build.log), [typecheck log](typecheck.log).
