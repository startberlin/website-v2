import { useRef, useState, type Ref } from 'react';
import { Icon } from '../icons/Icon';
import { filterCountries, getCountryName, MAX_ELIGIBLE_COUNTRIES } from '../../lib/jobboard/countries';
import './country-picker.css';

export interface CountryPickerProps {
	id: string;
	label?: string;
	value: string[];
	onChange: (value: string[]) => void;
	onBlur?: () => void;
	describedBy?: string;
	invalid?: boolean;
	inputRef?: Ref<HTMLElement>;
}

export function CountryPicker({ id, label = 'Eligible countries', value, onChange, onBlur, describedBy, invalid = false, inputRef }: CountryPickerProps) {
	const [query, setQuery] = useState('');
	const detailsRef = useRef<HTMLDetailsElement>(null);
	const summaryRef = useRef<HTMLElement>(null);
	const selected = new Set(value);
	const selectedCodes = [...selected];
	const results = filterCountries(query);
	const atLimit = selected.size >= MAX_ELIGIBLE_COUNTRIES;

	const removeCountry = (code: string) => onChange(value.filter((item) => item !== code));
	const toggleCountry = (code: string) => {
		if (selected.has(code)) removeCountry(code);
		else if (!atLimit) onChange([...value, code]);
	};

	return (
		<div
			className="jb-country-picker"
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) onBlur?.();
			}}
			onKeyDown={(event) => {
				if (event.key === 'Escape' && detailsRef.current?.open) {
					event.preventDefault();
					event.stopPropagation();
					detailsRef.current.open = false;
					summaryRef.current?.focus();
				}
			}}
		>
			<details
				ref={detailsRef}
				className="jb-country-picker__disclosure"
				onToggle={(event) => {
					if (!event.currentTarget.open) setQuery('');
				}}
			>
				<summary
					id={id}
					ref={(node) => {
						summaryRef.current = node;
						if (typeof inputRef === 'function') inputRef(node);
						else if (inputRef) inputRef.current = node;
					}}
					className="jb-country-picker__summary"
					aria-label={`${label}. ${selected.size} selected`}
					aria-invalid={invalid}
					aria-describedby={describedBy}
				>
					<span>Choose countries</span>
					<span className="jb-country-picker__count">{selected.size} selected</span>
					<Icon name="chevron-down" size={16} />
				</summary>
				<div className="jb-country-picker__panel">
					<label className="jb-country-picker__search">
						<span className="jb-country-picker__sr-only">Search countries by name</span>
						<Icon name="search" size={18} />
						<input
							type="search"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search countries"
							autoComplete="off"
							spellCheck={false}
						/>
					</label>
					<p className="jb-country-picker__status" aria-live="polite" aria-atomic="true">
						{atLimit ? `You can select up to ${MAX_ELIGIBLE_COUNTRIES} countries. Remove one to add another.` : `${results.length} ${results.length === 1 ? 'country' : 'countries'} found`}
					</p>
					<div className="jb-country-picker__options" role="group" aria-label={`${label} options`}>
						{results.map((country) => (
							<label key={country.code} className="jb-country-picker__option">
								<input
									type="checkbox"
									checked={selected.has(country.code)}
									disabled={atLimit && !selected.has(country.code)}
									onChange={() => toggleCountry(country.code)}
								/>
								<span>{country.name}</span>
							</label>
						))}
						{results.length === 0 ? <p className="jb-country-picker__empty">No countries found. Try another name.</p> : null}
					</div>
				</div>
			</details>
			{selectedCodes.length > 0 ? (
				<ul className="jb-country-picker__selected" aria-label="Selected countries">
					{selectedCodes.map((code) => (
						<li key={code}>
							<button type="button" className="jb-country-picker__chip" aria-label={`Remove ${getCountryName(code)}`} onClick={() => removeCountry(code)}>
								<span>{getCountryName(code)}</span>
								<Icon name="close" size={14} />
							</button>
						</li>
					))}
				</ul>
			) : null}
			<span className="jb-country-picker__sr-only" role="status" aria-live="polite">{selected.size} {selected.size === 1 ? 'country' : 'countries'} selected.</span>
		</div>
	);
}
