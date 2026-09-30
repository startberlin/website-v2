import { Icon } from '../icons/Icon';
import { clampPage, getPageRange, getPageTokens, type PageToken } from '../../lib/jobboard/pagination';
import './pagination.css';

export interface JobPaginationProps {
	page: number;
	pageCount: number;
	total: number;
	onPageChange: (page: number) => void;
}

export function JobPagination({ page, pageCount, total, onPageChange }: JobPaginationProps) {
	const range = getPageRange(total, page);
	const current = clampPage(page, pageCount);
	const desktop = getPageTokens(current, pageCount);
	const mobile = getPageTokens(current, pageCount, true);
	// One list keeps shared buttons, their focus and aria-current stable at every width.
	const position = (token: PageToken) =>
		token === 'gap-left' ? (1 + current) / 2 : token === 'gap-right' ? (current + pageCount) / 2 : token;
	const tokens = [...new Set([...desktop, ...mobile])].sort((a, b) => position(a) - position(b));
	if (!range.total) return null;

	return (
		<nav className="jb-pagination" aria-label="Job results pages">
			<p className="jb-pagination__range" role="status" aria-live="polite" aria-atomic="true">
				Showing {range.start}–{range.end} of {range.total} {range.total === 1 ? 'role' : 'roles'}
			</p>
			{pageCount > 1 ? (
				<ul className="jb-pagination__controls">
					<li>
						<button className="jb-pagination__button" type="button" aria-controls="job-results" aria-label="Previous page" disabled={current === 1} onClick={() => onPageChange(current - 1)}>
							<Icon name="arrow-left" size={18} />
						</button>
					</li>
					{tokens.map((token) => (
						<li key={token} className={!mobile.includes(token) ? 'jb-pagination__desktop-only' : !desktop.includes(token) ? 'jb-pagination__mobile-only' : undefined}>
							{typeof token === 'number' ? (
								<button
									className="jb-pagination__button"
									type="button" aria-controls="job-results"
									aria-label={token === current ? `Page ${token}` : `Go to page ${token}`}
									aria-current={token === current ? 'page' : undefined}
									onClick={() => { if (token !== current) onPageChange(token); }}
								>
									{token}
								</button>
							) : <span className="jb-pagination__gap" aria-hidden="true">…</span>}
						</li>
					))}
					<li>
						<button className="jb-pagination__button" type="button" aria-controls="job-results" aria-label="Next page" disabled={current === pageCount} onClick={() => onPageChange(current + 1)}>
							<Icon name="arrow-right" size={18} />
						</button>
					</li>
				</ul>
			) : null}
		</nav>
	);
}
