// START Berlin's recent and upcoming public Luma events, read on the server from the
// calendar's iCalendar feed. Results stay in memory for the feed's own refresh
// interval (12 hours). When Luma is unreachable the last result, or an empty list,
// is returned, so callers keep their curated fallback.
import { lumaCalendar } from './luma';

export interface LumaEvent {
	title: string;
	start: Date;
	/** Short event link on luma.com, as used elsewhere on the site. */
	url: string;
	location?: string;
}

const refreshMs = 12 * 60 * 60 * 1000;
let cache: { at: number; events: LumaEvent[] } | undefined;

// Lines starting with a space or tab continue the previous line (RFC 5545).
function unfold(text: string) {
	return text.replace(/\r?\n[ \t]/g, '');
}

function unescapeText(value: string) {
	return value.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');
}

function parseDate(value: string) {
	const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/);
	if (!match) return undefined;
	const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
	return new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute, +second));
}

export function parseLumaFeed(ics: string): LumaEvent[] {
	const events: LumaEvent[] = [];
	for (const block of unfold(ics).split('BEGIN:VEVENT').slice(1)) {
		const field = (name: string) => block.match(new RegExp(`^${name}(?:;[^:\\r\\n]*)?:(.*)$`, 'm'))?.[1]?.trim();
		const title = field('SUMMARY');
		const start = parseDate(field('DTSTART') ?? '');
		const description = unescapeText(field('DESCRIPTION') ?? '');
		const location = unescapeText(field('LOCATION') ?? '');
		const url = description.match(/https:\/\/luma\.com\/[\w-]+/)?.[0] ?? location.match(/https:\/\/luma\.com\/[\w/-]+/)?.[0];
		if (!title || !start || !url) continue;
		events.push({ title: unescapeText(title), start, url, location: location.startsWith('http') ? undefined : location || undefined });
	}
	return events;
}

export async function lumaEvents(): Promise<LumaEvent[]> {
	if (cache && Date.now() - cache.at < refreshMs) return cache.events;
	try {
		const response = await fetch(lumaCalendar.feedUrl, { signal: AbortSignal.timeout(4000) });
		if (!response.ok) throw new Error(`Luma feed returned ${response.status}`);
		cache = { at: Date.now(), events: parseLumaFeed(await response.text()) };
	} catch {
		// Keep serving the last good result; try again on a later request.
		if (cache) cache.at = Date.now() - refreshMs + 10 * 60 * 1000;
	}
	return cache?.events ?? [];
}
