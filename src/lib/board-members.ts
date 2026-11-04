import team from '../data/team.json';
import content from '../data/board-profiles.json';
import { memberProfiles, memberSlug } from './member-profiles';

export interface RosterMember {
	name: string;
	role?: string;
	batch?: number;
	board?: boolean;
}

export interface TeamSeason {
	label: string;
	board: RosterMember[];
	departments: { name: string; members: RosterMember[] }[];
}

export interface CvEntry {
	title: string;
	organisation?: string;
	period?: string;
	url?: string;
}

export interface BoardProfileContent {
	introduction: string;
	experience: CvEntry[];
	education: CvEntry[];
	volunteering: CvEntry[];
	projects: CvEntry[];
}

const leadershipRoles = ['President', 'Vice President', 'Head of Finance'];

export function boardGroups(season: TeamSeason): [RosterMember[], RosterMember[]] {
	const all = [...season.board, ...season.departments.flatMap((department) => department.members.filter((member) => member.board))];
	const members = [...new Map(all.map((member) => [member.name, member])).values()];
	return [
		leadershipRoles.flatMap((role) => members.filter((member) => member.role === role)),
		members.filter((member) => !leadershipRoles.includes(member.role ?? '')),
	];
}

const currentSeason = team.seasons[0];
const profileContent: Record<string, BoardProfileContent> = content;
export const boardMembers = boardGroups(currentSeason).flat().map((member) => {
	const profile = memberProfiles[member.name];
	const biography = profileContent[member.name];
	if (!profile || !biography || !member.role) throw new Error(`Missing board profile data for ${member.name}`);
	for (const entry of [...biography.experience, ...biography.education, ...biography.volunteering, ...biography.projects]) {
		if (entry.url && new URL(entry.url).protocol !== 'https:') throw new Error(`Invalid project URL for ${member.name}`);
	}
	return { ...member, role: member.role, ...profile, content: biography, slug: memberSlug(member.name), season: currentSeason.label };
});

export type BoardMember = typeof boardMembers[number];
export function boardProfileIsIndexable(member: BoardMember): boolean {
	return Boolean(member.content.introduction);
}

export function boardProfilePath(name: string): string | undefined {
	const member = boardMembers.find((candidate) => candidate.name === name);
	return member ? `/members/${member.slug}` : undefined;
}
