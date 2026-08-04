/* START Berlin homepage v2 — draft renderer.
   All content comes from DATA (assets/js/data.js). Nothing is hard-coded here
   except structure, so Phase 2 edits happen in exactly one file. */

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* Wrap a value in placeholder marking when it isn't verified yet. */
  const ph = (value, verified, note) =>
    verified
      ? esc(value)
      : `<span data-ph title="Placeholder — needs Phase 2 input${note ? ": " + note : ""}">${esc(value)}</span>`;

  /* ---- hero ------------------------------------------------------------- */
  const c = DATA.cycle;
  $("#hero-deadline").innerHTML = `Apply — closes ${ph(c.applicationDeadline.value, c.applicationDeadline.verified)}`;
  $("#hero-cost").innerHTML =
    `${esc(c.applyMinutes.value)} · ${esc(c.applyRequires.value)} · ` +
    `START Sprint ${ph(c.sprintDates.value, c.sprintDates.verified)} is mandatory — block it now`;
  $("#hero-stats").innerHTML = DATA.stats
    .map((s) => `<div class="hero__stat"><b>${ph(s.value, s.verified)}</b><span>${esc(s.label)}</span></div>`)
    .join("");

  /* Verb rotation — the brand signature, demoted to a kicker. */
  const verbs = ["connecting", "creating", "empowering", "inspiring", "uniting"];
  const kicker = $("#hero-kicker");
  let vi = 0;
  const paintKicker = () =>
    (kicker.innerHTML = verbs.map((v, i) => (i === vi ? `<b>${v}</b>` : v)).join(" · "));
  paintKicker();
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setInterval(() => {
      vi = (vi + 1) % verbs.length;
      paintKicker();
    }, 2200);
  }

  /* ---- dimensions ------------------------------------------------------- */
  $("#dims").innerHTML = DATA.dimensions
    .map(
      (d) => `
      <article class="dim reveal">
        <div class="dim__photo"><img src="${d.photo}" alt="${esc(d.alt)}" loading="lazy"></div>
        <div class="dim__body">
          <p class="dim__q">${esc(d.question)}</p>
          <h3>${esc(d.title)}</h3>
          <p class="dim__lede">${esc(d.lede)}</p>
          <ul>${d.items.map((i) => `<li>${ph(i.text, i.verified)}</li>`).join("")}</ul>
        </div>
      </article>`
    )
    .join("");

  /* ---- numbers ---------------------------------------------------------- */
  $("#numbers").innerHTML = DATA.stats
    .map((s) => `<div class="number reveal"><b>${ph(s.value, s.verified)}</b><span>${esc(s.label)}</span></div>`)
    .join("");

  /* ---- testimonials ----------------------------------------------------- */
  const track = $("#quotes-track");
  track.innerHTML = DATA.testimonials
    .map((t) => {
      if (!t.verified) {
        return `
        <article class="quote quote--empty">
          <div class="quote__tag">${esc(t.status)} · ${esc(t.dimension)}</div>
          <p>${ph("Testimonial slot — " + t.brief, false)}</p>
          <div class="quote__who">
            <div class="avatar-blank"></div>
            <div><b>${ph(t.name, false)}</b><span>${esc(t.role)}</span></div>
          </div>
        </article>`;
      }
      return `
      <article class="quote">
        <div class="quote__tag">${esc(t.status)} · ${esc(t.dimension)}</div>
        <p>“${esc(t.quote)}”</p>
        <div class="quote__who">
          <img src="${t.photo}" alt="${esc(t.name)}" loading="lazy">
          <div><b>${esc(t.name)}</b><span>${esc(t.role)}</span></div>
        </div>
      </article>`;
    })
    .join("");

  /* Auto-scroll with pause on hover/focus and manual controls. */
  let auto = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const step = () => Math.min(450, track.clientWidth * 0.9);
  const nudge = (dir) => {
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    if (dir > 0 && atEnd) track.scrollTo({ left: 0, behavior: "smooth" });
    else track.scrollBy({ left: dir * step(), behavior: "smooth" });
  };
  $("#q-prev").addEventListener("click", () => nudge(-1));
  $("#q-next").addEventListener("click", () => nudge(1));
  const autoLabel = $("#q-auto");
  const toggleAuto = () => {
    auto = !auto;
    autoLabel.textContent = auto ? "auto-scroll on" : "auto-scroll paused";
  };
  autoLabel.addEventListener("click", toggleAuto);
  autoLabel.textContent = auto ? "auto-scroll on" : "auto-scroll paused";
  let hovering = false;
  track.addEventListener("mouseenter", () => (hovering = true));
  track.addEventListener("mouseleave", () => (hovering = false));
  track.addEventListener("focusin", () => (hovering = true));
  setInterval(() => {
    if (auto && !hovering) nudge(1);
  }, 5000);

  /* ---- journey ---------------------------------------------------------- */
  $("#journey-steps").innerHTML = DATA.journey
    .map((s, i) => {
      const detail = s.branches
        ? `<div class="branches">${s.branches
            .map((b) => `<div class="branch"><b>${esc(b.title)}</b><p>${ph(b.text, b.verified)}</p></div>`)
            .join("")}</div>`
        : `<ul>${s.body.map((b) => `<li>${ph(b.text, b.verified)}</li>`).join("")}</ul>`;
      return `
      <div class="step reveal" open-state="${i === 0 ? 1 : 0}">
        <button class="step__head" aria-expanded="${i === 0}" aria-controls="step-panel-${i}">
          <span class="step__month">${esc(s.month)}</span>
          <span>
            <span class="step__title">${esc(s.title)}</span>
            <span class="step__short">${ph(s.short, s.verified)}</span>
          </span>
          <span class="step__toggle" aria-hidden="true">+</span>
        </button>
        <div class="step__panel" id="step-panel-${i}">
          <div></div>
          <div>${detail}</div>
          <img src="${s.photo}" alt="${esc(s.title)} at START Berlin" loading="lazy">
        </div>
      </div>`;
    })
    .join("");

  document.querySelectorAll(".step__head").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stepEl = btn.parentElement;
      const open = stepEl.getAttribute("open-state") === "1";
      stepEl.setAttribute("open-state", open ? "0" : "1");
      btn.setAttribute("aria-expanded", String(!open));
    });
  });

  /* ---- events ----------------------------------------------------------- */
  $("#events").innerHTML = DATA.events
    .map(
      (e) => `
      <div class="event reveal${e.kind === "Key date" || e.kind === "Deadline" ? " event--key" : ""}">
        <div class="event__date">${ph(e.date, e.verified)}</div>
        <div class="event__title">${ph(e.title, e.verified, e.note)}</div>
        <div class="event__kind">${esc(e.kind)}</div>
      </div>`
    )
    .join("");

  /* ---- map -------------------------------------------------------------- */
  const map = $("#map");
  map.insertAdjacentHTML(
    "beforeend",
    DATA.chapters.cities
      .map(
        (city) => `
      <div class="map__pin${city.home ? " map__pin--home" : ""}" style="left:${city.x}%;top:${city.y}%">
        <span class="map__dot"></span>
        <span>${esc(city.name)}${city.home ? ` — ${ph(city.members, city.verified)} members` : ""}</span>
      </div>`
      )
      .join("")
  );
  $("#chapter-list").innerHTML = DATA.chapters.cities
    .map(
      (city) =>
        `<a href="#" aria-disabled="true" title="Cross-chapter link — planned, see brainstorming: gemeinsames Modul">${esc(
          city.name
        )}</a>`
    )
    .join("");
  $("#chapter-count").innerHTML = ph(DATA.chapters.total.value, DATA.chapters.total.verified);

  /* ---- partners (footer only — homepage is newcomer-only) --------------- */
  $("#partner-logos").innerHTML = DATA.partners
    .map((p) => `<img src="${p.logo}" alt="${esc(p.name)}" loading="lazy">`)
    .join("");

  /* ---- closing CTA ------------------------------------------------------ */
  $("#close-deadline").innerHTML = `Apply — closes ${ph(c.applicationDeadline.value, c.applicationDeadline.verified)}`;
  $("#close-cost").innerHTML =
    `${esc(c.applyMinutes.value)} · ${esc(c.applyRequires.value)} · interviews until ` +
    `${ph(c.interviewsUntil.value, c.interviewsUntil.verified)}`;

  /* ---- apply links ------------------------------------------------------ */
  document.querySelectorAll("[data-apply]").forEach((a) => (a.href = DATA.links.apply));
  document.querySelectorAll("[data-newsletter]").forEach((a) => (a.href = DATA.links.newsletter));

  /* ---- placeholder banner toggle ---------------------------------------- */
  $("#ph-toggle").addEventListener("click", () => {
    document.body.classList.toggle("ph-hidden");
    $("#ph-toggle").textContent = document.body.classList.contains("ph-hidden")
      ? "show placeholders"
      : "hide placeholders";
  });

  /* ---- scroll reveal ---------------------------------------------------- */
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }),
    { rootMargin: "0px 0px -60px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* Inert nav links must not navigate. */
  document.querySelectorAll('a[aria-disabled="true"]').forEach((a) =>
    a.addEventListener("click", (e) => e.preventDefault())
  );
})();
