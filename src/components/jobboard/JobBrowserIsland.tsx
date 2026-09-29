import { useRef } from 'react';
import { Icon } from '../icons/Icon';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { employmentTypes } from '../../lib/jobboard/contracts';
import {
	employmentLabels,
	sourceFrom,
	isActive,
} from '../../lib/jobboard/public-utils';
import { JobRow, type JobSummary } from './JobRow';
import { JobPagination } from './JobPagination';
import { getPageRange } from '../../lib/jobboard/pagination';

export type JobBrowserIslandProps = {
	jobs: JobSummary[];
	initialSource: string;
	serverSearch: string;
};

export function JobBrowserIsland({ serverSearch, ...props }: JobBrowserIslandProps) {
	return (
		<NuqsAdapter serverSearch={serverSearch}>
			<JobBrowser {...props} />
		</NuqsAdapter>
	);
}

const filterParsers = {
	q: parseAsString.withDefault(''),
	type: parseAsString.withDefault(''),
	mode: parseAsString.withDefault(''),
	location: parseAsString.withDefault(''),
	page: parseAsInteger.withDefault(1),
};

function JobBrowser({ jobs, initialSource }: Omit<JobBrowserIslandProps, 'serverSearch'>) {
	const [{ page: requestedPage, ...filters }, setFilters] = useQueryStates(filterParsers, { history: 'replace', shallow: true });
	const resultsHeading = useRef<HTMLParagraphElement>(null);
	const active = jobs.filter((job) => isActive(job));
	const locations = [...new Set(active.flatMap((job) => job.content.locations))].sort();
	const query = filters.q.toLocaleLowerCase().trim();
	const matches = active.filter((job) => {
		const content = job.content;
		return (
			(!query || `${content.title} ${job.company.name} ${content.locations.join(' ')}`.toLocaleLowerCase().includes(query)) &&
			(!filters.type || content.employmentType === filters.type) &&
			(!filters.mode || content.remoteMode === filters.mode) &&
			(!filters.location || content.locations.includes(filters.location))
		);
	});
	const range = getPageRange(matches.length, requestedPage);
	const filtered = Object.values(filters).some(Boolean);
	const update = (field: keyof typeof filters, value: string) => {
		void setFilters({ [field]: value, page: null });
	};
	const reset = () => {
		void setFilters(null);
	};

	const changePage = (page: number) => {
		void setFilters({ page }, { history: 'push' }).then(() => {
			resultsHeading.current?.focus({ preventScroll: true });
			resultsHeading.current?.scrollIntoView({
				block: 'start',
				behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
			});
		});
	};

	return (
		<section className="jb-board" aria-label="Open jobs">
			<div className="jb-filters" role="search" aria-label="Filter jobs">
				<label className="jb-filter-field jb-filter-search">
					<span>Search</span>
					<span className="jb-search-input">
						<Icon name="search" size={18} />
						<input
							name="q"
							autoComplete="off"
							spellCheck={false}
							type="search"
							maxLength={180}
							placeholder="Role or company"
							value={filters.q}
							onChange={(event) => update('q', event.target.value)}
						/>
					</span>
				</label>
				<label className="jb-filter-field">
					<span>Role type</span>
					<select name="type" value={filters.type} onChange={(event) => update('type', event.target.value)}>
						<option value="">Any role type</option>
						{employmentTypes.map((type) => <option key={type} value={type}>{employmentLabels[type]}</option>)}
					</select>
				</label>
				<label className="jb-filter-field">
					<span>Location</span>
					<select name="location" value={filters.location} onChange={(event) => update('location', event.target.value)}>
						<option value="">Anywhere</option>
						{locations.map((location) => <option key={location}>{location}</option>)}
					</select>
				</label>
				<label className="jb-filter-field">
					<span>Working setup</span>
					<select name="mode" value={filters.mode} onChange={(event) => update('mode', event.target.value)}>
						<option value="">Any setup</option>
						<option value="onsite">On-site</option>
						<option value="hybrid">Hybrid</option>
						<option value="remote">Remote</option>
					</select>
				</label>
			</div>
			<div className="jb-results-heading">
				<p className="jb-results-count" ref={resultsHeading} tabIndex={-1} aria-live="polite" aria-atomic="true">
					{matches.length} {matches.length === 1 ? 'open role' : 'open roles'}{filtered ? ' matching your filters' : ''}
					{range.pageCount > 1 ? ` · Page ${range.page} of ${range.pageCount}` : ''}
				</p>
				{filtered ? <button className="jb-text-button" type="button" onClick={reset}>Clear filters</button> : null}
			</div>
			<div className="jb-results" id="job-results">
				{matches.length ? matches.slice(range.offset, range.offset + range.limit).map((job) => <JobRow key={job.id} job={job} source={sourceFrom(initialSource)} />) : (
					<div className="jb-empty-state">
						<h2>{filtered ? 'No roles match your search.' : 'No open roles right now.'}</h2>
						<p>{filtered ? 'Try a broader search or clear the filters.' : 'Check back for new opportunities from the START network.'}</p>
						{filtered ? <button className="jb-button jb-button-outline" type="button" onClick={reset}>Clear filters</button> : <a className="jb-link" href="/jobs/submit">Post a role <span aria-hidden="true">↗</span></a>}
					</div>
				)}
			</div>
			<JobPagination
				page={range.page}
				pageCount={range.pageCount}
				total={range.total}
				onPageChange={changePage}
			/>
		</section>
	);
}
