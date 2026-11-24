import type { ImageMetadata } from 'astro';
import vcVisitsPhoto from '../assets/events/vc-visits.jpg';
import founderTalksPhoto from '../assets/events/founder-talks.jpg';
import workshopsPhoto from '../assets/events/workshops.jpg';
import summitPhoto from '../assets/join/legacy-road-to-start-summit.jpg';
import workingTogetherPhoto from '../assets/home/working-together.jpg';
import sapCrowd from '../assets/member-journey/start-x-sap-crowd.jpg';
import qontoGraphic from '../assets/events/past/2026-10-21-qonto.jpg';
import foundersTalkGraphic from '../assets/events/past/2026-10-19-founders-talk.jpg';
import procurosGraphic from '../assets/events/past/2026-10-14-procuros.jpg';
import { pastEventList } from './events';
import type { LumaEvent } from '../lib/luma-feed';

// Partners page content and the shared partner inventory.
// DRAFT: all `text` and `lead` fields are draft copy, and groups, current status
// and the active formats still need sign-off from Partnerships.

const logos = import.meta.glob<{ default: ImageMetadata }>('../assets/partners/*.{svg,png,jpg,jpeg,webp}', { eager: true });
const logo = (slug: string) => {
	const match = Object.entries(logos).find(([path]) => path.split('/').pop()!.replace(/\.\w+$/, '') === slug);
	if (!match) throw new Error(`Missing partner logo for ${slug}`);
	return match[1].default;
};

export type PartnerGroupId = 'investors' | 'corporates' | 'startups' | 'universities' | 'community';

export interface PartnerGroup {
	id: PartnerGroupId;
	name: string;
}

export interface Partner {
	slug: string;
	name: string;
	group: PartnerGroupId;
	logo: ImageMetadata;
	/** Optical size correction in px for the homepage logo strip (default 48). */
	stripHeight?: number;
}

// Provisional grouping; final groups depend on the confirmed partner list.
export const partnerGroups: PartnerGroup[] = [
	{ id: 'investors', name: 'Investors & accelerators' },
	{ id: 'corporates', name: 'Corporates' },
	{ id: 'startups', name: 'Startups & scaleups' },
	{ id: 'universities', name: 'Universities' },
	{ id: 'community', name: 'Community & venues' },
];

// One inventory for the Partners page and the homepage strip. Only current
// partners belong here; historical logo files stay in src/assets/partners.
// DRAFT: all 22 existing logos are listed until Partnerships confirms which are current.
export const partners: Partner[] = [
	{ slug: 'antler', name: 'Antler', group: 'investors' },
	{ slug: 'atlantic-labs', name: 'Atlantic Labs', group: 'investors' },
	{ slug: 'earlybird', name: 'Earlybird', group: 'investors', stripHeight: 36 },
	{ slug: 'ewor', name: 'EWOR', group: 'investors' },
	{ slug: 'lakestar', name: 'Lakestar', group: 'investors', stripHeight: 60 },
	{ slug: 'project-a', name: 'Project A', group: 'investors' },
	{ slug: 'ey', name: 'EY', group: 'corporates' },
	{ slug: 'sap', name: 'SAP', group: 'corporates' },
	{ slug: 'flaschenpost', name: 'flaschenpost', group: 'startups' },
	{ slug: 'koro', name: 'KoRo', group: 'startups' },
	{ slug: 'lanch', name: 'LANCH', group: 'startups' },
	{ slug: 'langdock', name: 'Langdock', group: 'startups' },
	{ slug: 'lexmea', name: 'LexMea', group: 'startups' },
	{ slug: 'rows', name: 'Rows', group: 'startups' },
	{ slug: 'velsa', name: 'Velsa', group: 'startups' },
	{ slug: 'code-university', name: 'CODE University of Applied Sciences', group: 'universities' },
	{ slug: 'humboldt-university', name: 'Humboldt-Universität zu Berlin', group: 'universities', stripHeight: 60 },
	{ slug: 'university-of-st-gallen', name: 'Universität St.Gallen', group: 'universities' },
	{ slug: 'bits-and-pretzels', name: 'Bits & Pretzels', group: 'community' },
	{ slug: 'edge-workspaces', name: 'EDGE Workspaces', group: 'community' },
	{ slug: 'fomo-berlin', name: 'FOMO Berlin', group: 'community' },
	{ slug: 'handpicked-berlin', name: 'Handpicked Berlin', group: 'community' },
].map((partner) => ({ ...partner, group: partner.group as PartnerGroupId, logo: logo(partner.slug) }));

export const hero = {
	photo: { src: sapCrowd, alt: 'Students filling an event room for a START Berlin and SAP talk' },
	// PageHero: solid first part, cyan outlined second part.
	title: ['Partner with', 'START Berlin'] as const,
	// One short sentence, as the hero guide asks.
	description: 'Meet future founders and hires from universities across Berlin and share what your team knows.',
};

export interface Reason {
	title: string;
	text: string;
}

// Why partner, folded into the offers intro. No reach figures until Partnerships approves them.
export const offersIntro = {
	heading: 'Ways to work with us',
	lead: 'Every collaboration is shaped together with our Partnerships team. These are the formats we offer.',
	reasons: [
		{ title: 'Meet future founders and hires', text: 'Ambitious students from universities across Berlin who want to start companies or join startups.' },
		{ title: 'Share what your team knows', text: 'Talks, workshops and visits give your people a direct line to the next generation.' },
		{ title: 'Connect across 23 chapters', text: 'START Berlin is part of the START Network, with members and alumni across Europe and Latin America.' },
	] satisfies Reason[],
};

export interface Offer {
	id: string;
	title: string;
	text: string;
	photo?: { src: ImageMetadata; alt: string; position?: string };
	link?: { label: string; href: string };
}

// Collaboration formats from the legacy partner page and the Events page; confirm
// with Partnerships which are active and who each suits. Photos reuse approved
// Events, Join and Member Journey images until the photo pool covers each format.
export const offers: Offer[] = [
	{
		id: 'startup-visits',
		title: 'Startup & VC visits',
		text: 'Open your office to a group of STARTies for a behind-the-scenes look at how your team builds, invests or scales.',
		// Approved Events photo of the Antler visit; Antler is in the partner inventory.
		photo: { src: vcVisitsPhoto, alt: 'START Berlin group posing for a photo during a visit to Antler' },
	},
	{
		id: 'talks',
		title: 'Talks & panels',
		text: 'Share your story in a founder talk, panel or evening event that we plan and host together with your team.',
		photo: { src: founderTalksPhoto, alt: 'Three people seated on a stage during a talk, the person in the middle speaking into a microphone' },
	},
	{
		id: 'workshops',
		title: 'Workshops',
		text: 'Teach a practical skill in a hands-on session, from pitching and fundraising to product and growth.',
		photo: { src: workshopsPhoto, alt: 'Three students working on laptops around a table in a meeting room' },
	},
	{
		id: 'road-to-start-summit',
		title: 'Road to START Summit',
		text: 'Get involved in our pitch event, for example on the jury, and meet some of the most promising student founders in Berlin.',
		// Road to START Summit photo from the legacy website, also used on Join.
		photo: { src: summitPhoto, alt: 'Attendees talking in a blue-lit event space' },
	},
	{
		id: 'mentorship',
		title: 'Female Mentorship Program',
		text: 'Pair experienced people from your team with women in our community who are starting their careers in tech and business.',
		// Stand-in until the photo pool has a mentoring photo.
		photo: { src: workingTogetherPhoto, alt: 'START Berlin members working together on laptops around a table' },
	},
	{
		id: 'hiring',
		title: 'Hire from our community',
		text: 'Post internships, working student and full-time roles on our job board and reach STARTies directly.',
		link: { label: 'Post a role', href: '/jobs/submit' },
	},
];

export interface Collaboration {
	title: string;
	/** Calendar date in Berlin, YYYY-MM-DD. */
	date: string;
	/** The event's page on Luma. */
	url: string;
	text?: string;
	/** START Berlin's own event graphic; decorative, because the title names the card. */
	graphic?: ImageMetadata;
}

// Hand-picked collaborations with their own wording and graphics; confirm each
// partner may be named. The page merges them with collaboration events from START
// Berlin's Luma feed and shows the three most recent, so new events appear without
// a code change. Events hosted on a partner's own calendar, like Qonto's, only
// appear through this list.
export const curatedCollaborations: Collaboration[] = [
	{
		title: 'Qonto x START Berlin',
		text: "A founders' finance webinar on banking, tools and insights for startups.",
		date: '2026-10-21',
		url: 'https://luma.com/ffitsdbl',
		graphic: qontoGraphic,
	},
	{
		title: 'Founders Talk at EDGE',
		text: 'A founders talk hosted at EDGE Grand Central, one of the venues that supports our community.',
		date: '2026-10-19',
		url: 'https://luma.com/i573fz95',
		graphic: foundersTalkGraphic,
	},
	{
		title: 'Startup visit: Procuros',
		text: 'STARTies visited Procuros in Mitte for a look at how the team builds and grows its business.',
		date: '2026-10-14',
		url: 'https://luma.com/7a9xzzap',
		graphic: procurosGraphic,
	},
];

// Which Luma events count as collaborations: partner formats in the title, such as
// "Qonto x START Berlin", "Startup Visit: …", founder talks, workshops and panels.
export const collaborationPattern = /\sx\s|visit|talk|workshop|panel|masterclass|webinar/i;

const berlinDate = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(date);

// The most recent past collaborations from the curated list and the Luma feed.
// Feed events reuse the Events graphic for the same Luma link when there is one.
export function recentCollaborations(events: LumaEvent[], now = new Date(), limit = 3): Collaboration[] {
	const graphics = new Map(pastEventList.filter((event) => event.graphic).map((event) => [event.url, event.graphic!]));
	const byUrl = new Map(curatedCollaborations.map((item) => [item.url, item]));
	for (const event of events) {
		if (event.start >= now || byUrl.has(event.url) || !collaborationPattern.test(event.title)) continue;
		byUrl.set(event.url, { title: event.title, date: berlinDate(event.start), url: event.url, graphic: graphics.get(event.url) });
	}
	const today = berlinDate(now);
	return [...byUrl.values()]
		.filter((item) => item.date <= today)
		.sort((a, b) => b.date.localeCompare(a.date))
		.slice(0, limit);
}

// Replaces the general footer contact on this page, so there is one contact box.
export const contact = {
	heading: 'Talk to our Partnerships team',
	// Head of Partnerships in the current season (src/data/team.json).
	person: 'Tobias Burger',
	role: 'Head of Partnerships',
	// Approved copy from the Partnerships department text (src/data/member-journey.ts).
	promise: 'Every partner has a dedicated person on our team, so no relationship is left to chance.',
	text: 'Write to Tobias directly or send us a short message through our form.',
	// Working Tally form from the legacy partner page.
	form: { label: 'Send us a message', href: 'https://forms.start-berlin.com/contact' },
};
