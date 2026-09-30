import type { PublicJob } from '../../lib/jobboard/contracts';
import { Icon } from '../icons/Icon';
import {
	employmentLabels,
	remoteLabels,
	salaryLabel,
	jobHref,
	type Source,
} from '../../lib/jobboard/public-utils';

export type JobSummary = Pick<
	PublicJob,
	'id' | 'slug' | 'status' | 'publishedAt' | 'expiresAt'
> & {
	company: Pick<PublicJob['company'], 'id' | 'name'>;
	content: Omit<PublicJob['content'], 'description' | 'applyUrl'>;
};

export function summarizeJob(job: PublicJob): JobSummary {
	const { description: _, applyUrl: __, ...content } = job.content;
	return {
		id: job.id,
		slug: job.slug,
		status: job.status,
		publishedAt: job.publishedAt,
		expiresAt: job.expiresAt,
		company: { id: job.company.id, name: job.company.name },
		content,
	};
}

export function JobRow({ job, source = 'direct' }: { job: JobSummary; source?: Source }) {
	return (
		<article className="jb-job-row">
			<a className="jb-job-row-link" href={jobHref(job, source)}>
				<span className="jb-company-icon" aria-hidden="true">
					<Icon name="company" size={24} />
				</span>
				<div className="jb-job-row-main">
					<p className="jb-company-name">{job.company.name}</p>
					<h3>{job.content.title}</h3>
					<p className="jb-job-meta">
						<span>{job.content.locations.join(' · ')}</span>
						<span>{remoteLabels[job.content.remoteMode]}</span>
						<span>{employmentLabels[job.content.employmentType]}</span>
					</p>
				</div>
				<div className="jb-job-row-extra">
					<span className={`jb-pay-label ${job.content.salaryStatus === 'disclosed' ? 'jb-pay-disclosed' : ''}`}>
						{salaryLabel(job.content)}
					</span>
					<span className="jb-row-language">{job.content.languages.join(' / ')}</span>
				</div>
				<span className="jb-row-arrow" aria-hidden="true"><Icon name="arrow-up-right" size={20} /></span>
			</a>
		</article>
	);
}
