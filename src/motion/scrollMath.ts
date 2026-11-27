export interface ScrollVehicleFrame {
  /** Horizontal offset in vw units */
  xVw: number;
  /** Vertical perspective offset in vh units */
  yVh: number;
  /** Perspective depth scale */
  scale: number;
  /** Velocity-reactive chassis pitch in degrees */
  pitchDeg: number;
  /** Vertical suspension settle offset in px */
  suspensionY: number;
  /** Lamp flare intensity (brake lights or headlights) between 0 and 1 */
  lampIntensity: number;
  /** Volumetric beam opacity (for footer headlights) between 0 and 1 */
  beamOpacity: number;
  /** Ground contact shadow scale */
  shadowScale: number;
  /** Ground contact shadow opacity */
  shadowOpacity: number;
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

export function easeInOutCubic(t: number): number {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Frame-rate independent exponential smoothing for visual motion inertia
 * (never blocks or slows down native browser scrolling).
 */
export function damp(
  current: number,
  target: number,
  lambda: number,
  dtSeconds: number,
  epsilon = 0.0004
): number {
  const safeDt = clamp(dtSeconds, 0, 0.1);
  const next = lerp(current, target, 1 - Math.exp(-lambda * safeDt));
  return Math.abs(target - next) <= epsilon ? target : next;
}

/**
 * Computes subtle chassis pitch from instantaneous scroll velocity
 * (positive velocity = scrolling down / forward, negative = scrolling up / reverse).
 */
export function computeScrollVelocityPitch(
  velocity: number,
  maxDeg: number,
  direction: 1 | -1
): number {
  const pitch = clamp(velocity * 12 * direction, -maxDeg, maxDeg);
  return pitch === 0 ? 0 : pitch;
}

/**
 * Top Hero Convertible (Rear 3/4 facing forward-right):
 * Fully scroll-scrubbed forward/reverse along the cobblestone road curve.
 * - progress = 0 (top of page): parked dead-center in foreground (0vw, 0vh, scale 1.0)
 * - scroll DOWN (0 -> 1): drives smoothly forward-right into the glowing palace archway
 * - scroll UP (1 -> 0): reverses smoothly back out along the exact same perspective curve
 */
export function computeHeroScrollFrame(
  progress: number,
  velocity = 0,
  isMobile = false
): ScrollVehicleFrame {
  const p = clamp(progress, 0, 1);
  const curve = easeInOutCubic(p);
  const speedMag = clamp(Math.abs(velocity) * 8, 0, 1);

  const endX = isMobile ? 14 : 18;
  const endY = isMobile ? -13 : -16;
  const endScale = isMobile ? 0.54 : 0.48;

  const scale = lerp(1, endScale, Math.pow(p, 0.92));
  const opacity = p < 0.78 ? 1 : lerp(1, 0.22, (p - 0.78) / 0.22);

  // Subtle chassis squat when accelerating forward or reversing
  const pitchDeg = computeScrollVelocityPitch(velocity, 1.55, -1);
  const suspensionY = clamp(Math.abs(velocity) * 14, 0, 2.5);

  // Brake lights glow warmer when reversing/slowing to rest, softer while cruising forward
  const brakeBoost = velocity < -0.005 ? 0.42 : speedMag < 0.12 && p < 0.08 ? 0.18 : 0;
  const lampIntensity = clamp(0.42 + brakeBoost + speedMag * 0.25, 0.3, 1);

  return {
    xVw: lerp(0, endX, curve),
    yVh: lerp(0, endY, curve),
    scale,
    pitchDeg,
    suspensionY,
    lampIntensity,
    beamOpacity: lerp(0.36, 0.14, p),
    shadowScale: clamp(scale, 0.42, 1),
    shadowOpacity: lerp(0.86, 0.28, p),
    opacity,
  };
}

/**
 * Bottom Footer Roadster (Front 3/4 facing forward-left):
 * Fully scroll-scrubbed forward/reverse emerging out of the right-side palace archway.
 * - progress = 0 (entering countdown section): distant upper-right along archway road
 * - scroll DOWN (0 -> 1): sweeps forward-left & grows into exact foreground center (0vw, 0vh, scale 1.0)
 * - scroll UP (1 -> 0): reverses seamlessly back toward the palace archway curve
 */
export function computeFooterScrollFrame(
  progress: number,
  velocity = 0,
  isMobile = false
): ScrollVehicleFrame {
  const p = clamp(progress, 0, 1);
  const curve = easeInOutCubic(p);

  const startX = isMobile ? 54 : 44;
  const startY = isMobile ? -10 : -14;
  const startScale = isMobile ? 0.56 : 0.5;

  const scale = lerp(startScale, 1, curve);
  const opacity = lerp(0.18, 1, smoothstep(0, 0.28, p));
  const pitchDeg = computeScrollVelocityPitch(velocity, 1.65, -1);
  const suspensionY = clamp(Math.abs(velocity) * 14, 0, 2.6);

  return {
    xVw: lerp(startX, 0, curve),
    yVh: lerp(startY, 0, curve),
    scale,
    pitchDeg,
    suspensionY,
    lampIntensity: lerp(0.28, 0.92, smoothstep(0.05, 0.85, p)),
    beamOpacity: lerp(0.06, 0.36, smoothstep(0.1, 0.9, p)),
    shadowScale: clamp(scale, 0.45, 1),
    shadowOpacity: lerp(0.26, 0.86, curve),
    opacity,
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
