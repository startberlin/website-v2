import type { ImageMetadata } from 'astro';
import heroPhoto from '../assets/events/hero.jpg';
import founderTalksPhoto from '../assets/events/founder-talks.jpg';
import startupVisitsPhoto from '../assets/events/startup-visits.jpg';
import vcVisitsPhoto from '../assets/events/vc-visits.jpg';
import workshopsPhoto from '../assets/events/workshops.jpg';
// START Berlin's own event graphics, also used as the Luma covers; rights confirmed by the page owner.
import qontoGraphic from '../assets/events/past/2026-10-21-qonto.jpg';
import foundersTalkGraphic from '../assets/events/past/2026-10-19-founders-talk.jpg';
import runGraphic from '../assets/events/past/2026-10-18-5k-run.jpg';
import procurosGraphic from '../assets/events/past/2026-10-14-procuros.jpg';
// A name badge on the left portrait is blurred so it cannot be read.
import ideaToImpactGraphic from '../assets/events/past/2026-04-23-idea-to-impact.jpg';

// Events page content. All public text is approved copy; keep it verbatim
// and change it only together with the content owner.

export interface EventPhoto {
	src: ImageMetadata;
	alt: string;
}

export interface EventFormat {
	id: string;
	title: string;
	text: string;
	photo: EventPhoto;
}

export const hero = {
	// Cropped below the projected title and without the half-cut face at the
	// right edge; badge text is illegible at this size.
	photo: { src: heroPhoto, alt: "A large group of students and guests posing together in front of a stage, two of them holding up a winner's board" },
	// Keep the group in view on wide screens and the central faces on phones.
	imagePosition: '50% 0%',
	mobileImagePosition: '70% 50%',
	title: ['Meet the', 'Startup Scene'] as const,
};

export const introduction = "START Berlin connects students with the city's startup scene. We visit startups and venture capital firms to see how they work. At founder talks and hands-on workshops, you can ask questions and try out your own ideas.";

export const formatsSection = {
	// "Event Formats" is outlined in the heading.
	headingSolid: 'Our',
	headingOutline: 'Event Formats',
};

export const formats: EventFormat[] = [
	{
		id: 'founder-talks',
		title: 'Founder Talks',
		text: "Meet founders from Berlin's startup ecosystem and hear first-hand about their entrepreneurial journeys, the challenges they face and the lessons they have learned along the way.",
		photo: { src: founderTalksPhoto, alt: 'Three people seated on a stage during a talk, the person in the middle speaking into a microphone' },
	},
	{
		id: 'startup-visits',
		title: 'Startup Visits',
		text: 'Get a behind-the-scenes look at exciting startups, meet the teams building them and learn how innovative businesses operate in practice.',
		photo: { src: startupVisitsPhoto, alt: 'A group of students posing together in an office, one holding up a large company logo' },
	},
	{
		id: 'vc-visits',
		title: 'VC Visits',
		text: 'Meet venture capital investors and hear what they look for when deciding which startups to back.',
		photo: { src: vcVisitsPhoto, alt: 'START Berlin group posing for a photo during a visit to Antler' },
	},
	{
		id: 'workshops',
		title: 'Workshops',
		text: 'Develop practical entrepreneurial skills through interactive workshops, collaborative sessions and exchanges with experienced professionals.',
		// Cropped below the TV's tab bar and dialog; only generic button labels remain.
		photo: { src: workshopsPhoto, alt: 'Three students working on laptops around a table in a meeting room' },
	},
];

export const calendarSection = {
	id: 'upcoming-events',
	heading: 'Upcoming Public Events',
};

export const membersOnly = {
	heading: 'Events for Members',
	text: 'Most of our events are reserved for members. We open a select few to everyone. As a START Berlin member, you can join every event we host, including all our internal events.',
	// No application link while applications are closed.
	link: { label: 'Explore the Member Journey', href: '/member-journey' },
};

export interface PastEvent {
	title: string;
	/** Calendar date in Berlin, YYYY-MM-DD. */
	date: string;
	/** As published on Luma; not shown on the card. */
	location: string;
	url: string;
	/** Decorative inside the card link, whose name is the title and date. */
	graphic?: ImageMetadata;
}

export const pastEvents = {
	heading: 'Past Public Events',
	lead: 'Browse the events we have hosted on Luma.',
	linkLabel: 'View past public events on Luma',
};

// Selected events, newest first, as published on Luma.
export const pastEventList: PastEvent[] = [
	{
		title: 'Qonto x START Berlin',
		date: '2026-10-21',
		location: 'Online',
		url: 'https://luma.com/ffitsdbl',
		graphic: qontoGraphic,
	},
	{
		title: 'START Berlin Founders Talk',
		date: '2026-10-19',
		location: 'EDGE Grand Central Berlin',
		url: 'https://luma.com/i573fz95',
		graphic: foundersTalkGraphic,
	},
	{
		title: 'MEET START: 5K RUN',
		date: '2026-10-18',
		location: 'Mitte',
		url: 'https://luma.com/apcq3do7',
		graphic: runGraphic,
	},
	{
		title: 'Startup Visit: Procuros',
		date: '2026-10-14',
		location: 'Mitte',
		url: 'https://luma.com/7a9xzzap',
		graphic: procurosGraphic,
	},
	{
		title: 'From Idea to Impact: Meet 3 START Founders',
		date: '2026-04-23',
		location: 'Invalidenstraße 65',
		url: 'https://luma.com/yfw6i1zl',
		graphic: ideaToImpactGraphic,
	},
];
