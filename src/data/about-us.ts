import groupPicture from '../assets/member-journey/start-group-picture.jpg';
import heroPhoto from '../assets/join/team-four.jpg';
import { departments, memberStories, type MemberStory } from './member-journey';

// About Us page content. Member quotes are approved Member Stories, quoted verbatim
// from src/data/member-journey.ts; department summaries quote one sentence of each
// department's own text from the same file.
// DRAFT: every `text`, `lead` and `description` below is draft copy awaiting
// approval from Growth / People. Facts marked "confirm" are not yet signed off.

const story = (name: string): MemberStory => {
	const match = memberStories.find((entry) => entry.name === name);
	if (!match) throw new Error(`Missing member story for ${name}`);
	return match;
};

export const hero = {
	// PageHero: solid first part, cyan outlined second part.
	title: ['Who we', 'are'] as const,
	photo: { src: heroPhoto, alt: 'Four START Berlin members smiling together in navy START shirts.' },
	// One short sentence, as the hero guide asks. Home counts 13 years in Berlin (since 2013).
	description: "Berlin's student-run entrepreneurship community, bringing students and founders together since 2013.",
};

export const purpose = {
	heading: 'Learn by doing',
	text: [
		'We believe the best way to understand entrepreneurship is to practise it. Members take on real responsibility early: they run events, manage partnerships, build our digital tools and pitch their own ideas.',
		'Lectures teach the theory. Here, members learn from founders and investors first-hand and make mistakes in a safe place, so they leave with practical skills, a network and the confidence to start something of their own.',
	],
	voice: story('Sönke Peters'),
};

export const community = {
	headingSolid: 'Our',
	headingOutline: 'community',
	text: [
		'Our members study business, engineering, computer science, law and more at universities across Berlin. They come from different countries and backgrounds and share the same drive to create something.',
		'Every season a new batch joins through the START Sprint and works side by side with members who have been here longer.',
	],
	photo: { src: groupPicture, alt: 'START Berlin members in navy team shirts posing and laughing together' },
};

// One sentence per department, chosen from its approved text for a consistent "we"
// voice and length. The build fails if a sentence no longer appears verbatim.
const summaries: Record<string, string> = {
	events: 'We create opportunities for students to connect with founders, investors, and fellow entrepreneurs, turning ideas into meaningful experiences.',
	growth: 'We create content for our social and marketing channels and build the brand and visual identity, with the aim of growing our community of members and partners.',
	'operations-digital': 'We develop our website and internal systems so every department can work more easily.',
	people: 'We help recruit new members and support them from interviews to onboarding.',
	partnerships: 'We find the right partners, learn what they actually need, and turn shared goals into events, programmes and relationships that last.',
};

export const departmentSummaries = departments.map((department) => {
	const summary = summaries[department.id];
	if (!summary || !department.paragraphs.some((paragraph) => paragraph.includes(summary))) {
		throw new Error(`The About Us summary for ${department.name} must quote its approved department text`);
	}
	return { id: department.id, name: department.name, summary };
});

export const organisation = {
	heading: "How we're organised",
	// Every department head sits on the board (src/data/team.json, season 26/27).
	lead: 'Five departments run START Berlin, each led by a member of the board. Every member contributes to one of them for a full year.',
	moreLink: { label: 'Read about every department', href: '/member-journey#departments' },
	boardHeading: 'Executive board',
	boardText: 'Leads START Berlin together with the five department heads and looks after its finances.',
};

export const network = {
	heading: 'The START Network',
	// Confirm: START was founded in 1996 at the University of St. Gallen.
	text: [
		'START began in 1996 as a student initiative at the University of St. Gallen and has grown into a network of chapters across Europe and Latin America, including START Global.',
		'Members exchange ideas across chapters and meet at international events like the START Summit. After their active seasons they stay part of it: alumni find co-founders and investors, mentor new STARTies and open doors for the next batch.',
	],
	// Shown with the shared CommunityStats tiles. 22 cities plus the START Global
	// chapter make 23 chapters; countries and members match the homepage Network section.
	stats: [
		{ count: 23, label: 'Chapters' },
		{ count: 22, label: 'Cities' },
		{ count: 17, label: 'Countries' },
		{ count: 1800, suffix: '+', label: 'Members' },
	],
	statsLabel: 'The START Network in numbers',
	voice: story('Rhema Tamunoiyowuna'),
};

export const join = {
	heading: 'Join START Berlin',
	// Approved Member Journey copy: "Apply in April or October".
	text: 'Applications open twice a year, in April and October. Find out what membership involves and how to apply.',
	primary: { label: 'How to join', href: '/join' },
};
