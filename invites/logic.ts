const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function ordinal(n: number): string {
  const mod = n % 100;
  const suffix = mod >= 11 && mod <= 13 ? "th" : (({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th");
  return `${n}${suffix}`;
}

/** Same display as the original storybook: `25.05.1996` becomes `25 May 1996`. */
export function formatPartyDate(date: string, time = "", timezone = ""): string {
  const parts = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(date.trim());
  let label = date.trim();
  if (parts) {
    const month = MONTHS[Number(parts[2]) - 1];
    if (month) label = `${Number(parts[1])} ${month} ${parts[3]}`;
  }
  return [label, time.trim(), timezone.trim()].filter(Boolean).join(" · ");
}

export function icsDates(date: string): { start: string; end: string } | null {
  const parts = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(date.trim());
  if (!parts) return null;
  const day = Number(parts[1]);
  const month = Number(parts[2]);
  const year = Number(parts[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const start = `${parts[3]}${parts[2]}${parts[1]}`;
  const cursor = new Date(Date.UTC(year, month - 1, day));
  if (cursor.getUTCMonth() !== month - 1) return null;
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  const end = `${cursor.getUTCFullYear()}${String(cursor.getUTCMonth() + 1).padStart(2, "0")}${String(cursor.getUTCDate()).padStart(2, "0")}`;
  return { start, end };
}

export function mapHref(input: { mapUrl?: string; venue?: string; address?: string }): string | null {
  const explicit = input.mapUrl?.trim();
  if (explicit && /^https?:\/\//i.test(explicit)) return explicit;
  const query = [input.venue?.trim(), input.address?.trim()].filter(Boolean).join(", ");
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function whatsAppMessage(input: {
  guestName: string;
  adults: number;
  kids: number;
  attending: "yes" | "no" | "maybe";
  childName: string;
  when: string;
  venue: string;
}): string {
  const who = input.guestName.trim() || "a guest";
  const coming =
    input.attending === "yes" ? "We'll be there" : input.attending === "no" ? "We can't make it" : "We might come";
  const when = input.when ? ` (${input.when})` : "";
  const where = input.venue ? ` at ${input.venue}` : "";
  return `Hi! This is ${who}. ${coming} for ${input.childName}'s birthday${when}${where}. Adults: ${input.adults}. Kids: ${input.kids}.`;
}

export function whatsAppLink(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function googleCalendarLink(input: {
  childName: string;
  age: number;
  date: string;
  venue: string;
  address: string;
  host: string;
}): string | null {
  const stamp = icsDates(input.date);
  if (!stamp) return null;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${input.childName}'s birthday`,
    dates: `${stamp.start}/${stamp.end}`,
    details: `${input.childName} is turning ${input.age}. ${input.host}`.trim(),
    location: [input.venue, input.address].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcs(input: {
  slug: string;
  childName: string;
  age: number;
  date: string;
  venue: string;
  address: string;
  host: string;
}): string | null {
  const stamp = icsDates(input.date);
  if (!stamp) return null;
  const location = [input.venue, input.address].filter(Boolean).join(", ");
  const summary = escapeIcs(`${input.childName}'s birthday`);
  const description = escapeIcs(`${input.childName} is turning ${input.age}. ${input.host}`.trim());
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//youin.lol//birthday invite//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.slug}-${stamp.start}@youin.lol`,
    `DTSTAMP:${stamp.start}T000000Z`,
    `DTSTART;VALUE=DATE:${stamp.start}`,
    `DTEND;VALUE=DATE:${stamp.end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${escapeIcs(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}
