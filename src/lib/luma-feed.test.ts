import assert from 'node:assert/strict';
import test from 'node:test';
import { parseLumaFeed } from './luma-feed';

// Shape of START Berlin's Luma iCalendar feed, including folded lines and escapes.
const feed = [
	'BEGIN:VCALENDAR',
	'VERSION:2.0',
	'BEGIN:VEVENT',
	'DTSTART:20261019T163000Z',
	'SUMMARY:START Berlin Founders Talk',
	'DESCRIPTION:Get up-to-date information at: https://luma.com/i573fz95\\n\\nAd',
	' dress:\\nEDGE Grand Central Berlin',
	'LOCATION:EDGE Grand Central Berlin\\, Invalidenstraße 65\\, 10557 Berlin\\, Ger',
	' many',
	'END:VEVENT',
	'BEGIN:VEVENT',
	'DTSTART:20261101T170000Z',
	'SUMMARY:Online Info Session',
	'LOCATION:https://luma.com/event/evt-rKl8YlkaUhirdFV',
	'END:VEVENT',
	'BEGIN:VEVENT',
	'SUMMARY:Event without a date',
	'DESCRIPTION:https://luma.com/abc',
	'END:VEVENT',
	'END:VCALENDAR',
].join('\r\n');

test('Luma feed events keep title, UTC start, short link and a readable location', () => {
	const [talk, session, ...rest] = parseLumaFeed(feed);
	assert.equal(rest.length, 0, 'events without a start date are skipped');
	assert.equal(talk.title, 'START Berlin Founders Talk');
	assert.equal(talk.start.toISOString(), '2026-10-19T16:30:00.000Z');
	assert.equal(talk.url, 'https://luma.com/i573fz95');
	assert.equal(talk.location, 'EDGE Grand Central Berlin, Invalidenstraße 65, 10557 Berlin, Germany');
	assert.equal(session.url, 'https://luma.com/event/evt-rKl8YlkaUhirdFV');
	assert.equal(session.location, undefined, 'online events have no street location');
});

test('an empty or unexpected feed yields no events', () => {
	assert.deepEqual(parseLumaFeed(''), []);
	assert.deepEqual(parseLumaFeed('<html>error</html>'), []);
});
