export interface HorizontalEntranceTransform {
  /** Horizontal offset in vw units */
  xVw: number;
  /** Opacity between 0 and 1 */
  opacity: number;
}

export interface CountdownParts {
  days: string;
  hours: string;
  mins: string;
  secs: string;
  isComplete: boolean;
}

export interface CalendarEventInput {
  id: string;
  title: string;
  startIso: string;
  endIso: string;
  location: string;
  description: string;
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function easeOutCubic(t: number): number {
  const c = clamp(t, 0, 1);
  return 1 - Math.pow(1 - c, 3);
}

export function easeInOutCubic(t: number): number {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

/**
 * Top Hero Car: Smoothly enters from the left end of the screen (-100vw)
 * to the exact horizontal middle (0vw).
 */
export function computeHeroCarEntrance(progress: number): HorizontalEntranceTransform {
  const p = clamp(progress, 0, 1);
  const eased = easeOutCubic(p);
  return {
    xVw: lerp(-100, 0, eased),
    opacity: clamp(p * 3.5, 0, 1),
  };
}

/**
 * Bottom Footer Car: Smoothly enters from the right end of the screen (+100vw)
 * to the exact horizontal middle (0vw).
 */
export function computeFooterCarEntrance(progress: number): HorizontalEntranceTransform {
  const p = clamp(progress, 0, 1);
  const eased = easeOutCubic(p);
  return {
    xVw: lerp(100, 0, eased),
    opacity: clamp(p * 3.5, 0, 1),
  };
}

/**
 * Computes zero-padded countdown components without DOM layout queries.
 */
export function formatCountdownParts(targetMs: number, nowMs: number): CountdownParts {
  const diff = Math.max(0, targetMs - nowMs);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    mins: String(mins).padStart(2, '0'),
    secs: String(secs).padStart(2, '0'),
    isComplete: diff === 0,
  };
}

function toIcsUtcStamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Generates an RFC 5545 compliant .ics calendar payload for an individual wedding event.
 */
export function buildEventIcs(event: CalendarEventInput): string {
  const escapeIcs = (text: string) =>
    text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Niraalii & Uttkarsh Wedding//NiUturn 2027//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@niuturn.in`,
    `DTSTART:${toIcsUtcStamp(event.startIso)}`,
    `DTEND:${toIcsUtcStamp(event.endIso)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `LOCATION:${escapeIcs(event.location)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
