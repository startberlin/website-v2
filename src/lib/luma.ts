// START Berlin's public Luma calendar, shared by every page that shows it.
// The calendar embed lists upcoming events only; it ignores period=past, so
// past events are linked on Luma instead.
const calendarUrl = 'https://luma.com/STARTBerlin';

export const lumaCalendar = {
	embedUrl: 'https://luma.com/embed/calendar/cal-bl55Ki232KTKkOd/events',
	calendarUrl,
	pastEventsUrl: `${calendarUrl}?period=past`,
	frameTitle: 'Upcoming public events hosted by START Berlin',
	linkLabel: 'View calendar on Luma',
	// Visible while the embed loads, and stays visible if it never does.
	loadingText: 'The calendar is loading from Luma. You can also view it directly on Luma.',
} as const;
