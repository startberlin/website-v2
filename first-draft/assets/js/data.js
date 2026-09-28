/* ---------------------------------------------------------------------------
   START Berlin v2 — single content source
   ---------------------------------------------------------------------------
   Every value the page renders comes from this file. Two flags matter:

     verified: true   → harvested from the current live site (start-berlin.com)
     verified: false  → PLACEHOLDER. Rendered with a dotted underline and
                        listed in CONTENT-TODO.md. Must be replaced in Phase 2.

   When the Cockpit sync exists, this object is what gets replaced by a fetch.
--------------------------------------------------------------------------- */

const DATA = {
  cycle: {
    // Dates below are last cycle's REAL dates, reused so the "applications
    // open" state can be seen. They must be re-set for the new batch.
    applicationDeadline: { value: "26 April", verified: false },
    interviewsUntil: { value: "12 May", verified: false },
    sprintDates: { value: "5–7 June", verified: false },
    batchLabel: { value: "Batch 26/27", verified: false },
    applyMinutes: { value: "20–30 min", verified: true },
    applyRequires: { value: "questionnaire + CV", verified: true },
  },

  stats: [
    { value: "500", label: "members in Berlin", verified: true },
    { value: "1,000", label: "alumni worldwide", verified: true },
    { value: "20+", label: "nationalities", verified: true },
    { value: "2013", label: "founded", verified: true },
  ],

  dimensions: [
    {
      key: "social",
      title: "Social",
      lede: "A group of people who are actually building things — not a lecture hall.",
      question: "Will I find my people here?",
      items: [
        { text: "500 members across every Berlin university", verified: true },
        { text: "START Sprint — a 3-day onboarding trip where you meet the whole batch", verified: true },
        { text: "A department team you work with weekly, not a group project you endure", verified: true },
        { text: "Community events, socials and network trips through the year", verified: true },
      ],
      photo: "assets/img/community-4.jpeg",
      alt: "START Berlin members together at a community event",
    },
    {
      key: "entrepreneurship",
      title: "Entrepreneurship",
      lede: "Access to the room where it happens, and the chance to run something yourself.",
      question: "What can I learn here that a seminar can't teach me?",
      items: [
        { text: "Road to START Summit — pitch competition; winners pitch at START Summit (6,000+ attendees)", verified: true },
        { text: "VC visits — ask investors directly what they look for", verified: true },
        { text: "Start-up visits — founders on their real decisions, not the case-study version", verified: true },
        { text: "Workshops on legal, go-to-market, financial planning, marketing", verified: true },
      ],
      photo: "assets/img/rtss-153.jpg",
      alt: "Road to START Summit pitch event",
    },
    {
      key: "career",
      title: "Career",
      lede: "You leave with a network and a track record, not a certificate.",
      question: "What does this actually do for me afterwards?",
      items: [
        { text: "Partner network — SAP, Antler, HU Berlin, Langdock, Rows and more", verified: true },
        { text: "Real ownership: budgets, events, partnerships you can point at in an interview", verified: true },
        { text: "1,000 alumni in founding, VC and operating roles", verified: true },
        { text: "15 START chapters across Europe and South America", verified: true },
      ],
      photo: "assets/img/community-2.jpg",
      alt: "START Berlin members at a company visit",
    },
  ],

  testimonials: [
    {
      quote:
        "START was the best learning environment I've ever been in. At 23, I led a team, made mistakes, and actually learned how to get things done — not just alone, but with others.",
      name: "Mahir Isikli",
      role: "President 23/24",
      status: "Alumnus",
      dimension: "Social",
      photo: "assets/img/p-mahir.jpg",
      verified: true,
    },
    {
      quote:
        "START Berlin changed everything. I found a community of driven, like-minded people who inspired me to grow both personally and professionally. START opened doors I didn't know existed.",
      name: "Anouar Springer",
      role: "Head of Partnerships 23/24",
      status: "Alumnus",
      dimension: "Career",
      photo: "assets/img/p-anouar.png",
      verified: true,
    },
    {
      quote:
        "START Berlin gave me so much value — not just during my time as a member, but long after. Through the community, I landed my first job and built lasting friendships here in Berlin.",
      name: "Polina Shcheglova",
      role: "Member 19/20",
      status: "Alumna",
      dimension: "Career",
      photo: "assets/img/p-polina.jpg",
      verified: true,
    },
    {
      quote: null,
      name: "Active member",
      role: "Entrepreneurship dimension",
      status: "Active batch",
      dimension: "Entrepreneurship",
      photo: null,
      verified: false,
      brief:
        "Why did you join? What did you move at START? What came out of it? — active member, ideally someone who pitched at Road to START Summit or founded something.",
    },
    {
      quote: null,
      name: "Active member",
      role: "Social dimension",
      status: "Active batch",
      dimension: "Social",
      photo: null,
      verified: false,
      brief:
        "Why did you join? What did you move at START? What came out of it? — active member, ideally a department lead speaking to team and Sprint experience.",
    },
  ],

  journey: [
    {
      month: "Month 0",
      title: "Application",
      short: "20–30 minutes, once.",
      verified: true,
      body: [
        { text: "A short questionnaire plus your CV. You'll get a confirmation email straight away.", verified: true },
        { text: "You'll be asked what you want to build or change at START — this answer is read, and it shapes where you land.", verified: false },
        { text: "We look for: enrolled at university · a real interest in entrepreneurship · based in Berlin for the next 6 months · ready to be active for one full year.", verified: true },
      ],
      photo: "assets/img/community-3.png",
    },
    {
      month: "Month 0–1",
      title: "Interview",
      short: "A conversation with two members.",
      verified: true,
      body: [
        { text: "After screening, selected candidates have a short interview with current START members.", verified: true },
        { text: "It is a conversation, not an exam — we're working out where you'd fit and what you'd want to run.", verified: false },
        { text: "Decisions are communicated shortly after interviews close.", verified: true },
      ],
      photo: "assets/img/rtss-70.jpg",
    },
    {
      month: "Month 1",
      title: "START Sprint",
      short: "Three days. Mandatory. The reason nobody stays a stranger.",
      verified: false,
      body: [
        { text: "Your first event as an official STARTie: the whole batch, off-site, for three days.", verified: true },
        { text: "You meet everyone at once — which is the point. Nobody has to walk into a room of strangers alone later.", verified: false },
        { text: "Block the dates when you apply; this is the one non-negotiable in the calendar.", verified: true },
      ],
      photo: "assets/img/rtss-66.jpg",
    },
    {
      month: "Month 1–12",
      title: "Department work",
      short: "You get a seat, a team and something real to run.",
      verified: true,
      body: [
        { text: "Every member sits in one department: Events, Growth, Operations & Digital, Community, or Partnerships.", verified: true },
        { text: "Weekly team work with real responsibility — budgets, partners, events that happen because you made them happen.", verified: false },
        { text: "Flexible around exams, an exchange semester, a start-up or competitive sport — tell your department lead, it gets planned around.", verified: false },
        { text: "Membership fee: €40 per semester.", verified: true },
      ],
      photo: "assets/img/community-1.png",
    },
    {
      month: "Month 12+",
      title: "Two ways on",
      short: "Lead a department — or join 1,000 alumni.",
      verified: false,
      branches: [
        {
          title: "Lead role",
          text: "After roughly a year, active members can take a department lead or board role — a real team and a real budget.",
          verified: false,
        },
        {
          title: "Active alumni",
          text: "Alumni stay in the network: mentoring, hiring, investing, and the reason the partner and alumni network is worth anything.",
          verified: false,
        },
      ],
      photo: "assets/img/rtss-175.jpg",
    },
  ],

  events: [
    { date: "18 April", title: "Online info session with the Chapter Lead", kind: "Info", verified: false, note: "Brainstorming asks for two info sessions with the Chapter Lead." },
    { date: "23 April", title: "Founder Fail Tales", kind: "Public event", verified: false },
    { date: "25 April", title: "In-person info session with the Chapter Lead", kind: "Info", verified: false },
    { date: "26 April", title: "Applications close", kind: "Deadline", verified: false },
    { date: "until 12 May", title: "Interviews", kind: "Milestone", verified: false },
    { date: "5–7 June", title: "START Sprint — mandatory onboarding", kind: "Key date", verified: false },
  ],

  chapters: {
    total: { value: "15", verified: true },
    // Positions are STYLISED, not geographic — spaced for legibility.
    // Europe sits right, South America left; relative order is roughly true.
    cities: [
      { name: "Berlin", members: "500", verified: true, home: true, x: 58, y: 42 },
      { name: "Helsinki", members: "—", verified: false, x: 64, y: 15 },
      { name: "Hamburg", members: "—", verified: false, x: 50, y: 28 },
      { name: "Maastricht", members: "—", verified: false, x: 40, y: 35 },
      { name: "Paris", members: "—", verified: false, x: 35, y: 49 },
      { name: "Nuremberg", members: "—", verified: false, x: 49, y: 56 },
      { name: "Munich", members: "—", verified: false, x: 60, y: 61 },
      { name: "Stuttgart", members: "—", verified: false, x: 40, y: 63 },
      { name: "Vaduz", members: "—", verified: false, x: 72, y: 52 },
      { name: "St. Gallen", members: "—", verified: false, x: 74, y: 70, note: "START Global HQ · START Summit" },
      { name: "Lausanne", members: "—", verified: false, x: 57, y: 76 },
      { name: "Lisbon", members: "—", verified: false, x: 30, y: 72 },
      { name: "Barcelona", members: "—", verified: false, x: 41, y: 85 },
      { name: "Bogotá", members: "—", verified: false, x: 9, y: 44 },
      { name: "Quito", members: "—", verified: false, x: 7, y: 60 },
      { name: "Lima", members: "—", verified: false, x: 11, y: 78 },
    ],
  },

  partners: [
    { name: "SAP", logo: "assets/img/partner-sap.png" },
    { name: "Antler", logo: "assets/img/partner-antler.png" },
    { name: "HU Berlin", logo: "assets/img/partner-hu.png" },
    { name: "Langdock", logo: "assets/img/partner-langdock.svg" },
    { name: "Rows", logo: "assets/img/partner-rows.svg" },
    { name: "LexMea", logo: "assets/img/partner-lexmea.svg" },
    { name: "Bits & Pretzels", logo: "assets/img/partner-bits-and-pretzels.svg" },
    { name: "Edge Workspaces", logo: "assets/img/partner-edge-workspaces.png" },
    { name: "FOMO", logo: "assets/img/partner-fomo.png" },
  ],

  links: {
    apply:
      "#tally-open=w7EQzP&tally-layout=modal&tally-width=700&tally-emoji-text=%F0%9F%91%8B&tally-emoji-animation=wave",
    newsletter:
      "https://ffd0351e.sibforms.com/serve/MUIFABE1GEpZuFXtz9SsjdgzP_JtBAVwZkfnx4c1FJrDcNQW3eiVx9Eljn2r4f3c4tgfaUhwuqhvH0l-J4hTMWH74kGGzrwjCy3qrZOKifXmGBEsze8eGLsOEX34hsuSwErd3jR-ZjSyFjQePiNf2uXbvrLY6SaQvTcG1JtzrP8yL_grECLqPaJ_8Kedw8WleR6RZMmHvVbJmqoT",
    instagram: "https://www.instagram.com/start_berlin/",
    linkedin: "https://www.linkedin.com/company/start-berlin-e-v-",
    legal: "../website-raw/legal/legal-notice.html",
    privacy: "../website-raw/legal/privacy.html",
  },
};
