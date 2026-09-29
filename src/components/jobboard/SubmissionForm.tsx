import { useRef, useState } from "react";
import { Controller, useForm, type FieldErrors, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	submissionInputSchema,
	submissionResponseSchema,
	employmentTypes,
	seniorities,
} from "../../lib/jobboard/contracts";
import { employmentLabels, seniorityLabels } from "../../lib/jobboard/public-utils";
import { createSubmissionAttempt } from "../../lib/jobboard/submission-attempt";
import { CountryPicker } from "./CountryPicker";

const formSchema = submissionInputSchema
	.omit({ requestId: true, permissionToPublish: true })
	.extend({
		permissionToPublish: z
			.boolean()
			.refine(
				(value) => value,
				"Confirm that you are authorised to submit this listing.",
			),
		websiteConfirmation: z.string().max(200).default(""),
	});
type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;
const splitValues = (value: unknown) =>
	Array.isArray(value)
		? value
		: String(value)
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
const nullableNumber = (value: unknown) =>
	value === "" || value === null || value === undefined ? null : Number(value);

function fieldError(
	errors: FieldErrors<FormInput>,
	name: string,
): string | undefined {
	let value: unknown = errors;
	for (const part of name.split("."))
		value =
			value && typeof value === "object"
				? (value as Record<string, unknown>)[part]
				: undefined;
	if (
		value &&
		typeof value === "object" &&
		"message" in value &&
		typeof value.message === "string"
	) {
		if (name === "job.countryCodes" && "type" in value && value.type === "too_small")
			return "Choose at least one hiring country.";
		return value.message;
	}
	if (Array.isArray(value)) return value.find((item) => item?.message)?.message;
	return undefined;
}

export function SubmissionForm() {
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState("");
	const attempt = useRef(createSubmissionAttempt(() => crypto.randomUUID()));
	const {
		register,
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<FormInput, unknown, FormOutput>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			company: { name: "", website: "", description: "" },
			contact: { name: "", email: "", role: "", phone: "", notes: "" },
			job: {
				title: "",
				description: "",
				employmentType: "full_time",
				seniority: "entry",
				locations: ["Berlin"],
				countryCodes: ["DE"],
				remoteMode: "hybrid",
				languages: ["English"],
				applyUrl: "",
				salaryStatus: "not_disclosed",
				salaryMin: null,
				salaryMax: null,
				salaryCurrency: "EUR",
				salaryPeriod: "year",
				weeklyHours: null,
				internshipDurationMonths: null,
			},
			permissionToPublish: false,
			websiteConfirmation: "",
		},
	});
	const salaryStatus = watch("job.salaryStatus");
	const employmentType = watch("job.employmentType");
	const err = (name: FieldPath<FormInput>) => fieldError(errors, name);
	const inputProps = (name: FieldPath<FormInput>) => ({
		id: name,
		"aria-invalid": !!err(name),
		"aria-describedby": err(name) ? `${name}-error` : undefined,
	});
	const errorText = (name: FieldPath<FormInput>) =>
		err(name) ? (
			<p className="jb-field-error" id={`${name}-error`}>
				{err(name)}
			</p>
		) : null;
	async function onSubmit(values: FormOutput) {
		setError("");
		const { websiteConfirmation, ...formValues } = values;
		const normalised = {
			...formValues,
			permissionToPublish: true as const,
			job: {
				...formValues.job,
				...(formValues.job.salaryStatus === "disclosed"
					? {}
					: { salaryMin: null, salaryMax: null }),
				...(formValues.job.employmentType === "internship"
					? {}
					: { internshipDurationMonths: null }),
			},
		};
		const requestId = attempt.current(normalised);
		try {
			const response = await fetch("/api/jobboard/submissions", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ ...normalised, requestId, websiteConfirmation }),
				signal: AbortSignal.timeout(15_000),
			});
			if (response.ok) {
				submissionResponseSchema.parse(await response.json());
				setSubmitted(true);
				return;
			}
			if (response.status === 429) {
				const seconds = Number(response.headers.get("retry-after"));
				const minutes =
					Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds / 60) : 1;
				setError(
					`There have been several submissions recently. Please wait ${minutes} ${minutes === 1 ? "minute" : "minutes"} before trying again.`,
				);
				return;
			}
			if (response.status === 400 || response.status === 413) {
				setError(
					"Please check the listing details and their length, then submit again.",
				);
				return;
			}
			if (response.status === 409) {
				attempt.current = createSubmissionAttempt(() => crypto.randomUUID());
				setError(
					"This attempt conflicts with an earlier submission. Please check the form and submit again as a new attempt.",
				);
				return;
			}
			setError(
				"We could not confirm receipt. Please try again. Retrying this unchanged form will not create a second submission.",
			);
		} catch {
			setError(
				"We could not confirm receipt. Please check your connection and try again. Your form is still here.",
			);
		}
	}
	if (submitted)
		return (
			<section
				className="jb-submission-success"
				role="status"
				tabIndex={-1}
				ref={(node) => {
					node?.focus();
				}}
			>
				<span className="jb-success-mark" aria-hidden="true">
					✓
				</span>
				<p className="jb-eyebrow">RECEIVED</p>
				<h2>Your role is ready for review.</h2>
				<p>
					Your role is with the START team for review. We will contact you at
					the email address you provided to agree on publication terms and any
					referral-based fee before the role goes live.
				</p>
				<a className="jb-button jb-button-dark" href="/jobs">
					Back to jobs ↗
				</a>
			</section>
		);
	return (
		<form
			className="jb-submission-form"
			method="post"
			action="/api/jobboard/submissions"
			aria-busy={isSubmitting}
			onSubmit={handleSubmit(onSubmit)}
			noValidate
		>
			<fieldset>
				<legend>
					The company
				</legend>
				<div className="jb-form-grid">
					<div className="jb-field">
						<label htmlFor="company.name">Company name</label>
						<input
							{...register("company.name")}
							{...inputProps("company.name")}
							autoComplete="organization"
							maxLength={160}
							required
						/>
						{errorText("company.name")}
					</div>
					<div className="jb-field">
						<label htmlFor="company.website">Company website</label>
						<input
							{...register("company.website")}
							{...inputProps("company.website")}
							type="url"
							placeholder="https://"
							maxLength={2048}
							required
						/>
						{errorText("company.website")}
					</div>
					<div className="jb-field jb-full">
						<label htmlFor="company.description">
							About the company <span>Optional</span>
						</label>
						<textarea
							{...register("company.description")}
							{...inputProps("company.description")}
							rows={3}
							maxLength={4000}
							placeholder="What are you building?"
						/>
						{errorText("company.description")}
					</div>
				</div>
			</fieldset>
			<fieldset>
				<legend>
					The opportunity
				</legend>
				<div className="jb-form-grid">
					<div className="jb-field jb-full">
						<label htmlFor="job.title">Job title</label>
						<input
							{...register("job.title")}
							{...inputProps("job.title")}
							maxLength={180}
							required
							placeholder="e.g. Founder's Associate, Working Student"
						/>
						{errorText("job.title")}
					</div>
					<div className="jb-field">
						<label htmlFor="job.employmentType">Role type</label>
						<select
							{...register("job.employmentType", {
								onChange: (event) => {
									if (event.target.value !== "internship")
										setValue("job.internshipDurationMonths", null);
								},
							})}
							{...inputProps("job.employmentType")}
						>
							{employmentTypes.map((value) => (
								<option value={value} key={value}>
									{employmentLabels[value]}
								</option>
							))}
						</select>
						{errorText("job.employmentType")}
					</div>
					<div className="jb-field">
						<label htmlFor="job.seniority">Experience</label>
						<select
							{...register("job.seniority")}
							{...inputProps("job.seniority")}
						>
							{seniorities.map((value) => (
								<option value={value} key={value}>
									{seniorityLabels[value]}
								</option>
							))}
						</select>
						{errorText("job.seniority")}
					</div>
					<div className="jb-field">
						<label htmlFor="job.locations">Locations</label>
						<input
							{...register("job.locations", { setValueAs: splitValues })}
							{...inputProps("job.locations")}
							required
							placeholder="Berlin, Munich"
						/>
						<p className="jb-field-hint">
							Separate locations with commas. For remote roles, describe the
							eligible area.
						</p>
						{errorText("job.locations")}
					</div>
					<div className="jb-field">
						<div className="jb-field-label">Hiring countries</div>
						<Controller
							name="job.countryCodes"
							control={control}
							render={({ field, fieldState }) => (
								<CountryPicker
									id="job.countryCodes"
									label="Hiring countries"
									value={field.value}
									onChange={field.onChange}
									onBlur={field.onBlur}
									inputRef={field.ref}
									invalid={fieldState.invalid}
									describedBy={`job.countryCodes-help${fieldState.invalid ? " job.countryCodes-error" : ""}`}
								/>
							)}
						/>
						<p className="jb-field-hint" id="job.countryCodes-help">
							Select where the role can be based, including remote locations.
						</p>
						{errorText("job.countryCodes")}
					</div>
					<div className="jb-field">
						<label htmlFor="job.remoteMode">Working setup</label>
						<select
							{...register("job.remoteMode")}
							{...inputProps("job.remoteMode")}
						>
							<option value="onsite">On-site</option>
							<option value="hybrid">Hybrid</option>
							<option value="remote">Fully remote</option>
						</select>
						{errorText("job.remoteMode")}
					</div>
					<div className="jb-field">
						<label htmlFor="job.languages">Working languages</label>
						<input
							{...register("job.languages", { setValueAs: splitValues })}
							{...inputProps("job.languages")}
							required
							placeholder="English, German"
						/>
						{errorText("job.languages")}
					</div>
					<div className="jb-field jb-full">
						<label htmlFor="job.description">Full job description</label>
						<textarea
							{...register("job.description")}
							{...inputProps("job.description")}
							rows={10}
							minLength={40}
							maxLength={20000}
							required
							placeholder="Describe the responsibilities, what someone will learn, the skills you need and what you offer. Use plain text with paragraph breaks."
						/>
						<p className="jb-field-hint">
							Plain text only. Include the complete role and its requirements.
						</p>
						{errorText("job.description")}
					</div>
					<div className="jb-field jb-full">
						<label htmlFor="job.applyUrl">Direct application link</label>
						<input
							{...register("job.applyUrl")}
							{...inputProps("job.applyUrl")}
							type="url"
							placeholder="https://your-company.com/careers/role"
							maxLength={2048}
							required
						/>
						{errorText("job.applyUrl")}
					</div>
				</div>
			</fieldset>
			<fieldset>
				<legend>
					The practical details
				</legend>
				<div className="jb-form-grid">
					<div className="jb-field">
						<label htmlFor="job.salaryStatus">Compensation</label>
						<select
							{...register("job.salaryStatus", {
								onChange: (event) => {
									if (event.target.value !== "disclosed") {
										setValue("job.salaryMin", null);
										setValue("job.salaryMax", null);
									}
								},
							})}
							{...inputProps("job.salaryStatus")}
						>
							<option value="not_disclosed">Not disclosed</option>
							<option value="disclosed">Include a salary or range</option>
							<option value="unpaid">Unpaid</option>
						</select>
						{errorText("job.salaryStatus")}
					</div>
					<div className="jb-field">
						<label htmlFor="job.weeklyHours">
							Hours per week <span>Optional</span>
						</label>
						<input
							{...register("job.weeklyHours", { setValueAs: nullableNumber })}
							{...inputProps("job.weeklyHours")}
							type="number"
							min={1}
							max={168}
						/>
						{errorText("job.weeklyHours")}
					</div>
					{salaryStatus === "disclosed" ? (
						<>
							<div className="jb-field">
								<label htmlFor="job.salaryMin">Salary / lower bound</label>
								<input
									{...register("job.salaryMin", { setValueAs: nullableNumber })}
									{...inputProps("job.salaryMin")}
									type="number"
									step="0.01"
									min="0.01"
									required
								/>
								{errorText("job.salaryMin")}
							</div>
							<div className="jb-field">
								<label htmlFor="job.salaryMax">
									Upper bound <span>Optional</span>
								</label>
								<input
									{...register("job.salaryMax", { setValueAs: nullableNumber })}
									{...inputProps("job.salaryMax")}
									type="number"
									step="0.01"
									min="0.01"
								/>
								{errorText("job.salaryMax")}
							</div>
							<div className="jb-field">
								<label htmlFor="job.salaryCurrency">Currency</label>
								<input
									{...register("job.salaryCurrency", {
										setValueAs: (value) => String(value).trim().toUpperCase(),
									})}
									{...inputProps("job.salaryCurrency")}
									type="text"
									list="currency-suggestions"
									minLength={3}
									maxLength={3}
									pattern="[A-Z]{3}"
									autoCapitalize="characters"
									autoComplete="off"
									spellCheck={false}
									placeholder="EUR"
									onInput={(event) => {
										event.currentTarget.value =
											event.currentTarget.value.toUpperCase();
									}}
									required
								/>
								<datalist id="currency-suggestions">
									<option value="EUR" />
									<option value="CHF" />
									<option value="GBP" />
									<option value="USD" />
								</datalist>
								{errorText("job.salaryCurrency")}
							</div>
							<div className="jb-field">
								<label htmlFor="job.salaryPeriod">Salary period</label>
								<select
									{...register("job.salaryPeriod")}
									{...inputProps("job.salaryPeriod")}
								>
									<option value="year">Per year</option>
									<option value="month">Per month</option>
									<option value="hour">Per hour</option>
								</select>
								{errorText("job.salaryPeriod")}
							</div>
						</>
					) : null}
					{employmentType === "internship" ? (
						<div className="jb-field">
							<label htmlFor="job.internshipDurationMonths">
								Duration in months <span>Optional</span>
							</label>
							<input
								{...register("job.internshipDurationMonths", {
									setValueAs: nullableNumber,
								})}
								{...inputProps("job.internshipDurationMonths")}
								type="number"
								min="1"
								max="60"
							/>
							{errorText("job.internshipDurationMonths")}
						</div>
					) : null}
				</div>
			</fieldset>
			<fieldset>
				<legend>
					Our contact at your company
				</legend>
				<p className="jb-fieldset-note">
					We will use these details to discuss publication and any referral-based
					fee with you. Your contact details stay with the START team and are
					not published on the listing.
				</p>
				<div className="jb-form-grid">
					<div className="jb-field">
						<label htmlFor="contact.name">Your name</label>
						<input
							{...register("contact.name")}
							{...inputProps("contact.name")}
							autoComplete="name"
							maxLength={160}
							required
						/>
						{errorText("contact.name")}
					</div>
					<div className="jb-field">
						<label htmlFor="contact.email">Work email</label>
						<input
							{...register("contact.email")}
							{...inputProps("contact.email")}
							type="email"
							spellCheck={false}
							autoComplete="email"
							maxLength={254}
							required
						/>
						{errorText("contact.email")}
					</div>
					<div className="jb-field">
						<label htmlFor="contact.role">
							Your role <span>Optional</span>
						</label>
						<input
							{...register("contact.role")}
							{...inputProps("contact.role")}
							autoComplete="organization-title"
							maxLength={160}
						/>
						{errorText("contact.role")}
					</div>
					<div className="jb-field">
						<label htmlFor="contact.phone">
							Phone <span>Optional</span>
						</label>
						<input
							{...register("contact.phone")}
							{...inputProps("contact.phone")}
							type="tel"
							autoComplete="tel"
							maxLength={80}
						/>
						{errorText("contact.phone")}
					</div>
				</div>
			</fieldset>
			<div className="jb-honey-field" aria-hidden="true">
				<label htmlFor="websiteConfirmation">Leave this field empty</label>
				<input
					{...register("websiteConfirmation")}
					id="websiteConfirmation"
					tabIndex={-1}
					autoComplete="off"
				/>
			</div>
			<div className="jb-submission-confirm">
				<label className="jb-check-label">
					<input
						type="checkbox"
						required
						{...register("permissionToPublish")}
						{...inputProps("permissionToPublish")}
					/>
					<span>
						I am authorised to submit this role on behalf of the company and
						give START Berlin permission to review and publish the company and
						job details once publication terms have been agreed.
					</span>
				</label>
				{errorText("permissionToPublish")}
				<p className="jb-privacy-note">
					Read how we use your contact details in our{" "}
					<a href="/jobs/privacy">privacy notice</a>. Any fee is agreed with you
					before publication. Submitting this form does not create a payment
					obligation or guarantee publication.
				</p>
				{error ? (
					<p className="jb-form-error" role="alert">
						{error}
					</p>
				) : null}
				<button
					className="jb-button jb-button-dark"
					type="submit"
					disabled={isSubmitting}
				>
					{isSubmitting ? "Submitting role" : "Submit for review"}
					<span aria-hidden="true">↗</span>
				</button>
			</div>
		</form>
	);
}
