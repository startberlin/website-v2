// START Berlin's public Luma calendar, shared by every page that shows it.
// The calendar embed lists upcoming events only; it ignores period=past, so
// past events are linked on Luma instead.
const calendarUrl = 'https://luma.com/STARTBerlin';
const calendarId = 'cal-bl55Ki232KTKkOd';
const embedUrl = `https://luma.com/embed/calendar/${calendarId}/events`;

export const lumaCalendar = {
	embedUrl,
	// Public iCalendar feed with recent and upcoming events, read on the server.
	feedUrl: `https://api.lu.ma/ics/get?entity=calendar&id=${calendarId}`,
	darkEmbedUrl: `${embedUrl}?lt=dark`,
	calendarUrl,
	pastEventsUrl: `${calendarUrl}?period=past`,
	frameTitle: 'Upcoming public events hosted by START Berlin',
	linkLabel: 'View calendar on Luma',
	// Visible while the embed loads, and stays visible if it never does.
	loadingText: 'The calendar is loading from Luma. You can also view it directly on Luma.',
} as const;
