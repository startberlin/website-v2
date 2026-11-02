import type { ImageMetadata } from 'astro';
import sapCrowd from '../assets/member-journey/start-x-sap-crowd.jpg';
import sprintCeremony from '../assets/member-journey/start-sprint-award-ceremony.jpg';
import cofounderNight from '../assets/member-journey/cofounder-matching-night.jpg';
import groupPicture from '../assets/member-journey/start-group-picture.jpg';
import langdockVisit from '../assets/member-journey/langdock-visit.jpg';
import mahirIsikli from '../assets/member-journey/stories/mahir-isikli.jpg';
import anouarSpringer from '../assets/member-journey/stories/anouar-springer.jpg';
import polinaShcheglova from '../assets/member-journey/stories/polina-shcheglova.jpg';
import lionAbboudHerbert from '../assets/member-journey/stories/lion-abboud-herbert.jpg';
import soenkePeters from '../assets/member-journey/stories/soenke-peters.jpg';
// Existing member portraits are reused rather than duplicated.
import antoniaHill from '../assets/members/antonia-hill.webp';
import rhemaTamunoiyowuna from '../assets/members/rhema-tamunoiyowuna.webp';

// Member Journey page content. All public text is approved copy; keep it
// verbatim and change it only together with the content owner.

export interface JourneyPhoto {
	src: ImageMetadata;
	alt: string;
	position?: string;
}

export interface JourneyStage {
	id: string;
	number: string;
	title: string;
	intro: string;
	points: string[];
	photo?: JourneyPhoto;
}

export interface Department {
	id: string;
	name: string;
	paragraphs: string[];
}

export interface MemberStory {
	name: string;
	role: string;
	quote: string;
	portrait?: ImageMetadata;
	featured?: boolean;
}

export const hero = {
	// Rendered as two lines: the first in the accent colour, the second outlined.
	accent: 'Your START Berlin',
	outline: 'Journey',
};

export const stages: JourneyStage[] = [
	{
		id: 'application',
		number: '01',
		title: 'Application',
		intro: 'Your entry into START Berlin. Two stages that tell us who you are and what drives you.',
		points: [
			'Apply in April or October',
			'Stage 1: Written application',
			'Stage 2: Personal interview',
			'Open to students at any university in Berlin',
		],
		photo: { src: sapCrowd, alt: 'Students filling an event room for a START Berlin and SAP talk' },
	},
	{
		id: 'start-sprint',
		number: '02',
		title: 'START Sprint',
		intro: "During your first month at START, you'll get the opportunity to bond with ambitious people, get to know the Berlin startup community, and learn how to build a real product by taking part in the START Sprint as part of a team.",
		points: [
			'Develop your own idea from concept to MVP in just four weeks',
			'Workshops on the foundations of building a startup',
			'Final pitch in front of a jury',
		],
		// Cropped to the right-hand group so no certificate names are legible.
		photo: { src: sprintCeremony, alt: 'START Berlin members on stage at the START Sprint award ceremony, one holding a microphone' },
	},
	{
		id: 'departments',
		number: '03',
		title: 'Departments',
		intro: "Finish the Sprint and you're officially a STARTie. Contribute meaningful work inside one of our departments and shape the direction of START Berlin alongside the people around you.",
		points: [
			'Become part of one of our five departments: Events, Partnerships, Operations & Digital, People and Growth',
			'Work on real projects with visible impact inside and outside START',
			'Learn useful startup skills in practice',
			'Contribute for one full year, with at least six months based in Berlin',
		],
		photo: { src: cofounderNight, alt: 'Four people at the START Berlin Co-Founder Matching Night in front of the event screen' },
	},
	{
		id: 'active-member',
		number: '04',
		title: 'Active Member',
		intro: 'Enjoy the benefits of being a STARTie and expand your network through exclusive opportunities.',
		points: [
			'Become part of the START Network, with 23 chapters worldwide',
			'Get access to exclusive, member-only events',
			'Membership fee: €20 per semester',
		],
		photo: { src: groupPicture, alt: 'START Berlin members in navy team shirts posing and laughing together' },
	},
	{
		id: 'start-alumni',
		number: '05',
		title: 'START Alumni',
		intro: 'Once a STARTie, always a STARTie. After two active semesters, you can stay connected as you build your own path.',
		points: [
			'Find co-founders, investors and collaborators across the START Network',
			'Give back by mentoring and supporting new STARTies',
			'Stay involved as much as you want; department work is optional',
		],
		// Portrait source shown in the shared 4:3 frame; 20% keeps both speakers' faces in view.
		photo: { src: langdockVisit, alt: 'Two guests on stage talking with an audience of students', position: '50% 20%' },
	},
];

export const departmentsSection = {
	// "Departments" is outlined in the heading.
	headingSolid: 'Our',
	headingOutline: 'Departments',
	subheading: 'Find your place in the team and contribute to our community.',
};

export const departments: Department[] = [
	{
		id: 'events',
		name: 'Events',
		paragraphs: [
			'The Events department is the engine room of START Berlin, bringing the startup ecosystem to life through founder talks, startup and VC visits, workshops, panels, and larger-scale events such as RTSS. We create opportunities for students to connect with founders, investors, and fellow entrepreneurs, turning ideas into meaningful experiences. From political panels exploring the intersection of entrepreneurship and policy to conversations about scaling a food business, we believe great events start with bold ideas. We value ownership, initiative, and out-of-the-box thinking, empowering every team member to take the lead and bring their ideas to life.',
		],
	},
	{
		id: 'growth',
		name: 'Growth',
		paragraphs: [
			"The Growth department shapes START Berlin's public presence. We create content for our social and marketing channels and build the brand and visual identity, with the aim of growing our community of members and partners.",
		],
	},
	{
		id: 'operations-digital',
		name: 'Operations & Digital',
		paragraphs: [
			'Operations & Digital builds the tools and processes that keep START Berlin running. We develop our website and internal systems so every department can work more easily. Here, you take ownership of projects and turn an idea into something our team uses.',
		],
	},
	{
		id: 'people',
		name: 'People',
		paragraphs: [
			'The People department builds and supports the START Berlin community. We help recruit new members and support them from interviews to onboarding. Through regular internal events and engaging team activities, we make sure that our members stay connected and collaborative.',
		],
	},
	{
		id: 'partnerships',
		name: 'Partnerships',
		paragraphs: [
			'We own the whole partner journey, from the first conversation to long-term collaboration. We find the right partners, learn what they actually need, and turn shared goals into events, programmes and relationships that last. Every partner has a dedicated person on our team, so no relationship is left to chance.',
			'Joining Partnerships means learning to pitch, negotiate and build trust with founders, investors and industry leaders. Those skills stay with you long after START.',
		],
	},
];

export const storiesSection = {
	heading: 'Member Stories',
	subheading: 'Words of our alumni and current STARTies',
};

export const memberStories: MemberStory[] = [
	{
		name: 'Mahir Isikli',
		role: 'President 23/24',
		portrait: mahirIsikli,
		quote: "START was the best learning environment I've ever been in. At 23, I led a team, made mistakes, and actually learned how to get things done – not just alone, but with others.",
		featured: true,
	},
	{
		name: 'Anouar Springer',
		role: 'Head of Partnerships 23/24',
		portrait: anouarSpringer,
		quote: "START Berlin changed everything. I found a community of driven, like-minded people who inspired me to grow both personally and professionally. START opened doors I didn't know existed.",
	},
	{
		name: 'Polina Shcheglova',
		role: 'Member 19/20',
		portrait: polinaShcheglova,
		quote: 'START Berlin gave me so much value – not just during my time as a member, but long after. Through the community, I landed my first job and built lasting friendships here in Berlin.',
	},
	{
		name: 'Lion Abboud Herbert',
		role: 'President 2026',
		portrait: lionAbboudHerbert,
		quote: 'I had never experienced such a concentrated amount of inspiring, curious and driven people before. People with different stories and backgrounds, but the same desire to learn, build and grow. This is not something you simply find at university or anywhere. It happens when you build a community like START Berlin, a place that brings these people together and gives them space to grow.',
	},
	{
		name: 'Antonia Hill',
		role: 'President 2026/27',
		portrait: antoniaHill,
		quote: "I came to Berlin a year ago without knowing many people. Through START Berlin, I've gotten to know an amazing community and discovered opportunities I otherwise wouldn't have known much about.",
	},
	{
		name: 'Sönke Peters',
		role: 'Vice President 2025/26',
		portrait: soenkePeters,
		quote: "At START Berlin I had more responsibility and freedom to do things than I'd ever had before, and I learned a lot. Along the way I met so many cool people, and that network put me in touch with some of Berlin's best startups. One of those connections turned into my next job and changed the course of my career.",
	},
	{
		name: 'Rhema Tamunoiyowuna',
		role: 'Head of Growth 2026/27',
		portrait: rhemaTamunoiyowuna,
		quote: "START gave me the community I'd been looking for as a student in Berlin: ambitious people who inspire me to build. Through the chapters in Munich, Paris and beyond, my connections now reach far past Berlin. In a short time, it has completely changed how I see the tech world.",
	},
];

// Reserved for the shared game another team member is building. Keep this
// false until the integration is ready; the section is not rendered otherwise.
// Integration requirements: an <iframe> with a title, a reserved aspect ratio,
// loading="lazy" and sandbox="allow-scripts" plus only the permissions it
// needs (never allow-scripts together with allow-same-origin for same-origin
// content). postMessage handlers must check event.origin against an exact
// allow-list and event.source against the iframe window, validate the message
// shape, and send with an explicit targetOrigin, never '*'.
export const game = {
	id: 'member-journey-game',
	enabled: false,
};
