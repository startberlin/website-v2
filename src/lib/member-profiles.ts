import profiles from '../data/member-profiles.json';

export interface MemberProfile {
	linkedin?: string;
	email?: string;
	portrait?: string;
}

export const memberProfiles: Record<string, MemberProfile> = profiles;

export function memberEmailUrl(email: string, name: string): string {
	if (!/^[a-z0-9][a-z0-9._+-]*@start-berlin\.com$/i.test(email)) {
		throw new Error(`Invalid START email for ${name}`);
	}
	return `mailto:${email}`;
}

export function memberSlug(name: string): string {
	return name.toLowerCase()
		.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
		.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function memberLinkedinUrl(profileUrl: string, name: string): string {
	const url = new URL(profileUrl);
	if (url.protocol !== 'https:' || !/^(www\.|[a-z]{2}\.)?linkedin\.com$/.test(url.hostname)
		|| !/^\/in\/[^/]+\/?$/.test(url.pathname)) {
		throw new Error(`Invalid LinkedIn profile for ${name}`);
	}
	url.search = '';
	url.hash = '';
	url.searchParams.set('utm_source', 'start-berlin.com');
	url.searchParams.set('utm_medium', 'referral');
	url.searchParams.set('utm_campaign', 'members');
	url.searchParams.set('utm_content', memberSlug(name));
	return url.href;
}
