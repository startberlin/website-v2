// Events page content. All public text is approved copy; keep it verbatim
// and change it only together with the content owner.

export interface EventFormat {
	id: string;
	title: string;
	text: string;
}

export const hero = {
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
	},
	{
		id: 'startup-visits',
		title: 'Startup Visits',
		text: 'Get a behind-the-scenes look at exciting startups, meet the teams building them and learn how innovative businesses operate in practice.',
	},
	{
		id: 'workshops',
		title: 'Workshops',
		text: 'Develop practical entrepreneurial skills through interactive workshops, collaborative sessions and exchanges with experienced professionals.',
	},
];

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
