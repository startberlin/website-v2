/** Identifies a form attempt, not a person. State lives only in this form instance. */
export function createSubmissionAttempt(makeId: () => string) {
	let previous = "";
	let requestId = "";
	return (values: unknown): string => {
		const serialized = JSON.stringify(values);
		if (!requestId || serialized !== previous) {
			requestId = makeId();
			previous = serialized;
		}
		return requestId;
	};
}
