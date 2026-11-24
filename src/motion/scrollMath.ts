export interface CarTransform {
  /** Horizontal offset in vw units */
  xVw: number;
  /** Vertical offset in vh units */
  yVh: number;
  /** Uniform perspective scale */
  scale: number;
  /** Opacity between 0 and 1 */
  opacity: number;
  /** Ground shadow scale multiplier */
  shadowScale: number;
  /** Ground shadow opacity */
  shadowOpacity: number;
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

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Frame-rate-independent exponential smoothing.
 * Behaves identically across 60Hz, 120Hz, and variable-refresh displays.
 */
export function damp(
  current: number,
  target: number,
  lambda: number,
  dtSeconds: number,
  epsilon = 0.0005
): number {
  const safeDt = clamp(dtSeconds, 0, 0.1);
  const next = lerp(current, target, 1 - Math.exp(-lambda * safeDt));
  return Math.abs(target - next) <= epsilon ? target : next;
}

/**
 * Evaluates a quadratic Bezier curve for clean, wobble-free road paths.
 */
export function quadBezier(p0: number, p1: number, p2: number, t: number): number {
  const c = clamp(t, 0, 1);
  const inv = 1 - c;
  return inv * inv * p0 + 2 * inv * c * p1 + c * c * p2;
}

/**
 * Hero vintage convertible:
 * - At progress = 0: Proudly framed on the foreground cobblestone road (fully visible, not clipped).
 * - As user scrolls (0 -> 1): Glides smoothly along the curved road toward the glowing palace archway
 *   on the right, shrinking cleanly in perspective with zero jitter or awkward sideways tilt.
 */
export function computeHeroCarTransform(progress: number, isMobile: boolean): CarTransform {
  const p = clamp(progress, 0, 1);
  const eased = easeInOutCubic(p);
  const scaleEase = Math.pow(p, 0.88);

  if (isMobile) {
    // Mobile: road archway sits right-of-center above foreground road
    const xVw = quadBezier(-6, 8, 22, eased);
    const yVh = quadBezier(0, -6, -18, eased);
    const scale = lerp(1.0, 0.42, scaleEase);
    const opacity = p < 0.8 ? 1 : lerp(1, 0.25, (p - 0.8) / 0.2);
    const shadowScale = clamp(scale, 0.35, 1);
    return {
      xVw,
      yVh,
      scale,
      opacity,
      shadowScale,
      shadowOpacity: lerp(0.72, 0.22, p),
    };
  }

  // Desktop: car starts proudly in lower-center-left foreground, drives smoothly right into the archway
  const xVw = quadBezier(-10, 7, 24, eased);
  const yVh = quadBezier(1, -5, -19, eased);
  const scale = lerp(1.04, 0.34, scaleEase);
  const opacity = p < 0.78 ? 1 : lerp(1, 0.18, (p - 0.78) / 0.22);
  const shadowScale = clamp(scale / 1.04, 0.3, 1);
  return {
    xVw,
    yVh,
    scale,
    opacity,
    shadowScale,
    shadowOpacity: lerp(0.75, 0.2, p),
  };
}

/**
 * Footer vintage obsidian roadster:
 * - At progress = 0 (footer entering from bottom): Emerging small from the palace archway on the right.
 * - At progress = 1 (footer settled in viewport): Arrives smoothly in the foreground beneath the countdown.
 */
export function computeFooterCarTransform(progress: number, isMobile: boolean): CarTransform {
  const p = clamp(progress, 0, 1);
  const eased = easeOutCubic(p);

  if (isMobile) {
    const xVw = quadBezier(20, 7, -2, eased);
    const yVh = quadBezier(-16, -6, 0, eased);
    const scale = lerp(0.42, 0.98, eased);
    const opacity = lerp(0.55, 1, smoothstep(0, 0.45, p));
    const shadowScale = clamp(scale / 0.98, 0.35, 1);
    return {
      xVw,
      yVh,
      scale,
      opacity,
      shadowScale,
      shadowOpacity: lerp(0.25, 0.78, eased),
    };
  }

  const xVw = quadBezier(25, 10, -4, eased);
  const yVh = quadBezier(-16, -6, 1, eased);
  const scale = lerp(0.36, 1.0, eased);
  const opacity = lerp(0.5, 1, smoothstep(0, 0.4, p));
  const shadowScale = clamp(scale, 0.32, 1);
  return {
    xVw,
    yVh,
    scale,
    opacity,
    shadowScale,
    shadowOpacity: lerp(0.22, 0.8, eased),
  };
}

/**
 * Horizontal vintage car divider glide as the user scrolls past a section breaker.
 * Returns horizontal offset in pixels within [-travelPx, +travelPx].
 */
export function computeDividerCarOffset(
  progress: number,
  direction: 1 | -1,
  travelPx = 140
): number {
  const p = clamp(progress, 0, 1);
  const centered = (easeInOutCubic(p) - 0.5) * 2; // [-1, 1]
  return centered * travelPx * direction;
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
    'PRODID:-//Niraalii & Uttkarsh Wedding//Delhi 2027//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@niraaliiuttkarsh.wedding`,
    `DTSTART:${toIcsUtcStamp(event.startIso)}`,
    `DTEND:${toIcsUtcStamp(event.endIso)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `LOCATION:${escapeIcs(event.location)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
