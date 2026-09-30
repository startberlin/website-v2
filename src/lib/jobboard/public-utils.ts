import {
	sources,
	type JobContent,
	type PublicJob,
	type MetricEvent,
} from "./contracts";

export type Source = (typeof sources)[number];
export function widgetAncestors(configured?: string): string {
	if (!configured?.trim())
		return "https://www.start-berlin.com https://start-berlin.com";
	const origins = configured.split(",").map((value) => value.trim());
	if (origins.length > 10) throw new Error("Too many widget origins.");
	for (const origin of origins) {
		const url = new URL(origin);
		const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
		if (
			url.origin !== origin ||
			url.username ||
			url.password ||
			(url.protocol !== "https:" && !(local && url.protocol === "http:"))
		)
			throw new Error(
				"Widget framing requires exact HTTPS origins, or local HTTP origins for testing.",
			);
	}
	return origins.join(" ");
}
export function sourceFrom(
	value: unknown,
	fallback: Source = "direct",
): Source {
	if (value === undefined || value === null || value === "") return fallback;
	return typeof value === "string" && sources.includes(value as Source)
		? (value as Source)
		: "unknown";
}

export function jobPath(job: Pick<PublicJob, "id" | "slug">): string {
	return `/jobs/${encodeURIComponent(job.id)}/${encodeURIComponent(job.slug)}`;
}
export function jobHref(
	job: Pick<PublicJob, "id" | "slug">,
	source?: Source,
): string {
	return (
		jobPath(job) + (source && source !== "direct" ? `?source=${source}` : "")
	);
}
/** Add only the recognised attribution value to an internal Jobboard URL. */
export function sourceHref(path: string, source: Source = "direct"): string {
  const namespaced = path === "/" ? "/jobs" : (path === "/jobs" || path.startsWith("/jobs/")) ? path : `/jobs${path}`;
  return namespaced + (source !== "direct" ? `?source=${encodeURIComponent(source)}` : "");
}
export const formatDate = displayDate;

export function isActive(
	job: Pick<PublicJob, "status" | "expiresAt">,
	now = Date.now(),
): boolean {
	return job.status === "active" && Date.parse(job.expiresAt) > now;
}
export function isDocumentRequest(method: string, headers: Headers): boolean {
	if (method !== "GET" || !headers.get("accept")?.includes("text/html"))
		return false;
	if (
		headers.get("rsc") === "1" ||
		headers.has("next-router-prefetch") ||
		headers.has("next-router-segment-prefetch")
	)
		return false;
	if (
		/prefetch|prerender/i.test(
			`${headers.get("purpose") || ""} ${headers.get("sec-purpose") || ""}`,
		)
	)
		return false;
	if (
		/bot|spider|crawler|preview|facebookexternalhit|whatsapp|slackbot|linkedinbot|curl|wget|headless/i.test(
			headers.get("user-agent") || "",
		)
	)
		return false;
	const destination = headers.get("sec-fetch-dest");
	return !destination || destination === "document" || destination === "iframe";
}
export function shareTarget(
	job: PublicJob,
	channel: string,
	origin: string,
): string | null {
	if (channel !== "whatsapp" && channel !== "linkedin") return null;
	const publicUrl = new URL(jobHref(job, channel), origin).toString();
	if (channel === "linkedin")
		return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`;
	const text = `${job.content.title} at ${job.company.name}\n${publicUrl}`;
	return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export const employmentLabels: Record<JobContent["employmentType"], string> = {
	full_time: "Full-time",
	part_time: "Part-time",
	contract: "Contract",
	internship: "Internship",
	working_student: "Working student",
	temporary: "Temporary",
	volunteer: "Volunteer",
	other: "Other",
};
export const seniorityLabels: Record<JobContent["seniority"], string> = {
	entry: "Early career",
	mid: "Mid-level",
	senior: "Senior",
	lead: "Lead",
	all: "All experience levels",
};
export const remoteLabels: Record<JobContent["remoteMode"], string> = {
	onsite: "On-site",
	hybrid: "Hybrid",
	remote: "Remote",
};
export function salaryLabel(
	content: Pick<
		JobContent,
		| "salaryStatus"
		| "salaryMin"
		| "salaryMax"
		| "salaryCurrency"
		| "salaryPeriod"
	>,
): string {
	if (content.salaryStatus === "unpaid") return "Unpaid role";
	if (content.salaryStatus !== "disclosed" || content.salaryMin === null)
		return "Salary not disclosed";
	const format = (value: number) =>
		new Intl.NumberFormat("en-GB", {
			style: "currency",
			currency: content.salaryCurrency,
			maximumFractionDigits: 2,
		}).format(value);
	return `${format(content.salaryMin)}${content.salaryMax === null ? "+" : ` to ${format(content.salaryMax)}`} / ${content.salaryPeriod}`;
}
export function displayDate(date: string): string {
	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "Europe/Berlin",
	}).format(new Date(date));
}
export function safeJsonLd(value: unknown): string {
	return JSON.stringify(value)
		.replace(/</g, "\\u003c")
		.replace(/>/g, "\\u003e")
		.replace(/&/g, "\\u0026")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
export function jobPosting(
	job: PublicJob,
	origin: string,
): Record<string, unknown> | null {
	if (!isActive(job)) return null;
	const c = job.content;
	const employmentMap = {
		full_time: "FULL_TIME",
		part_time: "PART_TIME",
		contract: "CONTRACTOR",
		internship: "INTERN",
		working_student: "PART_TIME",
		temporary: "TEMPORARY",
		volunteer: "VOLUNTEER",
		other: "OTHER",
	};
	const data: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "JobPosting",
		title: c.title,
		description: c.description
			.split(/\n\s*\n/)
			.map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
			.join(""),
		identifier: {
			"@type": "PropertyValue",
			name: job.company.name,
			value: job.id,
		},
		datePosted: job.publishedAt,
		validThrough: job.expiresAt,
		employmentType: employmentMap[c.employmentType],
		hiringOrganization: {
			"@type": "Organization",
			name: job.company.name,
			sameAs: job.company.website,
		},
		url: new URL(jobPath(job), origin).toString(),
	};
	if (c.remoteMode === "remote") {
		data.jobLocationType = "TELECOMMUTE";
		data.applicantLocationRequirements = c.countryCodes.map((name) => ({
			"@type": "Country",
			name,
		}));
	} else if (c.countryCodes.length === 1) {
		data.jobLocation = c.locations.map((addressLocality) => ({
			"@type": "Place",
			address: {
				"@type": "PostalAddress",
				addressLocality,
				addressCountry: c.countryCodes[0],
			},
		}));
	} else {
		// The contract does not pair each city with a country. Do not invent a mapping.
		return null;
	}
	if (c.salaryStatus === "disclosed" && c.salaryMin !== null) {
		data.baseSalary = {
			"@type": "MonetaryAmount",
			currency: c.salaryCurrency,
			value: {
				"@type": "QuantitativeValue",
				minValue: c.salaryMin,
				...(c.salaryMax !== null ? { maxValue: c.salaryMax } : {}),
				unitText: c.salaryPeriod.toUpperCase(),
			},
		};
	}
	return data;
}

export async function retryMetric(
	event: MetricEvent,
	send: (event: MetricEvent) => Promise<void>,
): Promise<boolean> {
	// Reuse the same event ID on the single retry. Cockpit is the deduplication authority.
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			await send(event);
			return true;
		} catch {
			/* bounded best-effort transport */
		}
	}
	return false;
}
