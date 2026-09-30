export const JOBS_PER_PAGE = 25;

export type PageToken = number | 'gap-left' | 'gap-right';

const nonNegativeInteger = (value: number) =>
	Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

export function getPageCount(total: number): number {
	return Math.ceil(nonNegativeInteger(total) / JOBS_PER_PAGE);
}

/** Page 1 is the empty/default URL state, even when there are no results. */
export function clampPage(page: number, pageCount: number): number {
	const last = Math.max(1, nonNegativeInteger(pageCount));
	const requested = Number.isFinite(page) ? Math.floor(page) : 1;
	return Math.max(1, Math.min(requested, last));
}

export function getPageRange(total: number, page: number) {
	const count = nonNegativeInteger(total);
	const pageCount = getPageCount(count);
	const current = clampPage(page, pageCount);
	const offset = (current - 1) * JOBS_PER_PAGE;
	return {
		total: count,
		page: current,
		pageCount,
		start: count ? offset + 1 : 0,
		end: Math.min(offset + JOBS_PER_PAGE, count),
		offset,
		limit: JOBS_PER_PAGE,
	};
}

/** Compact mode keeps first/current/last visible on narrow screens. */
export function getPageTokens(page: number, pageCount: number, compact = false): PageToken[] {
	const count = nonNegativeInteger(pageCount);
	if (!count) return [];
	const current = clampPage(page, count);
	if (count <= (compact ? 4 : 7)) {
		return Array.from({ length: count }, (_, index) => index + 1);
	}

	const visible = new Set([1, current, count]);
	if (!compact) {
		visible.add(current - 1);
		visible.add(current + 1);
		if (current <= 3) for (const number of [2, 3, 4]) visible.add(number);
		if (current >= count - 2) for (const number of [count - 3, count - 2, count - 1]) visible.add(number);
	}
	const pages = [...visible].filter((number) => number >= 1 && number <= count).sort((a, b) => a - b);
	const tokens: PageToken[] = [];
	for (const number of pages) {
		const previous = tokens.at(-1);
		if (typeof previous === 'number') {
			const distance = number - previous;
			if (!compact && distance === 2) tokens.push(previous + 1);
			else if (distance > 1) tokens.push(number <= current ? 'gap-left' : 'gap-right');
		}
		tokens.push(number);
	}
	return tokens;
}
