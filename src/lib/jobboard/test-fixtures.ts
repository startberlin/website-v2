import { publicJobSchema, type PublicJob } from "./contracts";

export function exampleJob(): PublicJob {
	return publicJobSchema.parse({
		id: "job-example",
		slug: "product-intern",
		status: "active",
		publishedAt: "2026-09-01T00:00:00.000Z",
		expiresAt: "2099-12-31T00:00:00.000Z",
		company: {
			id: "company-example",
			name: "Example Studio",
			website: "https://example.com",
			description: "A synthetic team used exclusively for tests.",
		},
		content: {
			title: "Product Intern",
			description:
				"Work with a small product team on real user research.\n\nLearn through shipping and feedback from the team.",
			employmentType: "internship",
			seniority: "entry",
			locations: ["Berlin"],
			countryCodes: ["DE"],
			remoteMode: "hybrid",
			languages: ["English"],
			applyUrl: "https://example.com/careers/product-intern",
			salaryStatus: "disclosed",
			salaryMin: 1500,
			salaryMax: 1800,
			salaryCurrency: "EUR",
			salaryPeriod: "month",
			weeklyHours: 40,
			internshipDurationMonths: 6,
		},
	});
}
