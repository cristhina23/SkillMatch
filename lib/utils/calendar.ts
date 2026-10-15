// Google Calendar "add event" link. It opens Google Calendar with the event
// already filled in, so we don't need the Google API or any login on our side.

interface CalendarEvent {
  title: string;
  details: string;
  location?: string;
  start: number; // UTC timestamp (ms)
  end: number; // UTC timestamp (ms)
}

// Google wants UTC times like 20261014T230000Z.
function toGoogleDate(utcMs: number) {
  return new Date(utcMs).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function getGoogleCalendarUrl(event: CalendarEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toGoogleDate(event.start)}/${toGoogleDate(event.end)}`,
    details: event.details,
  });
  if (event.location) {
    params.set("location", event.location);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
