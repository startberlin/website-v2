import type { ImageMetadata } from 'astro';
import heroPhoto from '../assets/events/hero.jpg';
import founderTalksPhoto from '../assets/events/founder-talks.jpg';
import startupVisitsPhoto from '../assets/events/startup-visits.jpg';
import workshopsPhoto from '../assets/events/workshops.jpg';

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
	// Keeps every head in view on wide screens; the phone position and the
	// phone shade keep the long description at 4.5:1 over the busy right half.
	imagePosition: '50% 0%',
	mobileImagePosition: '70% 50%',
	title: 'Events',
	description: "START Berlin connects students with Berlin's startup ecosystem through founder talks, startup visits and hands-on workshops. Our events offer insights into the realities of entrepreneurship, opportunities to learn directly from founders and teams, and a space to connect with others who share an interest in building something new.",
};

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
		id: 'workshops',
		title: 'Workshops',
		text: 'Develop practical entrepreneurial skills through interactive workshops, collaborative sessions and exchanges with experienced professionals.',
		// Cropped below the TV's tab bar and dialog; only generic button labels remain.
		photo: { src: workshopsPhoto, alt: 'Three students working on laptops around a table in a meeting room' },
	},
];

export const calendarSection = {
	id: 'upcoming-events',
	heading: 'Upcoming Events',
	lead: 'Register for our public events directly on Luma.',
};

export const membersOnly = {
	heading: 'Members Only',
	text: 'As a START Berlin member, you get access to exclusive workshops, startup visits and internal community events. These formats offer opportunities to learn directly from founders and startup teams, connect more closely with fellow STARTies and take part in experiences that are not generally open to the public.',
	// No application link while applications are closed.
	link: { label: 'Explore the Member Journey', href: '/member-journey' },
};

export const pastEvents = {
	heading: 'Past Events',
	lead: 'Browse the events we have hosted on Luma.',
	linkLabel: 'View past events on Luma',
};
