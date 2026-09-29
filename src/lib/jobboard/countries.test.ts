import assert from 'node:assert/strict';
import test from 'node:test';
import { countries, filterCountries, getCountryName, MAX_ELIGIBLE_COUNTRIES } from './countries';

test('country dataset contains all 249 unique current ISO countries and territories', () => {
	assert.equal(countries.length, 249);
	assert.equal(new Set(countries.map(({ code }) => code)).size, 249);
	assert.ok(countries.every(({ code, name }) => /^[A-Z]{2}$/.test(code) && name.length > 0));
	for (const code of ['DE', 'GB', 'TW', 'AQ', 'AX', 'BQ', 'SS']) {
		assert.ok(countries.some((country) => country.code === code), code);
	}
	for (const code of ['UK', 'XK', 'EU', 'SU', 'ZZ']) {
		assert.ok(!countries.some((country) => country.code === code), code);
	}
	assert.equal(MAX_ELIGIBLE_COUNTRIES, 30);
});

test('country-name searches accept diacritics, spaces, codes and familiar aliases', () => {
	const finds = (query: string, code: string) =>
		assert.ok(filterCountries(query).some((country) => country.code === code), `${query} should find ${code}`);
	finds('germany', 'DE');
	finds(' DE ', 'DE');
	finds('reunion', 'RE');
	finds('réunion', 'RE');
	finds('Turkey', 'TR');
	finds('Czech Republic', 'CZ');
	finds('Ivory Coast', 'CI');
	finds('UK', 'GB');
	finds('United States of America', 'US');
	assert.equal(filterCountries('  ').length, 249);
	assert.deepEqual(filterCountries('not a real country name'), []);
});

test('selected values display readable names and preserve unfamiliar controlled values', () => {
	assert.equal(getCountryName('DE'), 'Germany');
	assert.equal(getCountryName('GB'), 'United Kingdom');
	assert.equal(getCountryName('TW'), 'Taiwan');
	assert.equal(getCountryName('ZZ'), 'ZZ');
});
