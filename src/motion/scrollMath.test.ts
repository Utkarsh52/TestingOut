import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  damp,
  normalizeWheelDelta,
  stepVelocityClampedScroll,
  stepRateLimitedProgress,
  computeHeroCarTransform,
  computeFooterCarTransform,
  computeDividerCarOffset,
  formatCountdownParts,
  buildEventIcs,
} from './scrollMath';

test('clamp constrains values and guards NaN', () => {
  assert.equal(clamp(-5, 0, 1), 0);
  assert.equal(clamp(3.2, 0, 1), 1);
  assert.equal(clamp(0.45, 0, 1), 0.45);
  assert.equal(clamp(Number.NaN, 0, 1), 0);
});

test('damp converges smoothly and snaps cleanly within epsilon', () => {
  const step60Hz = damp(0, 100, 10, 1 / 60);
  assert.ok(step60Hz > 10 && step60Hz < 25);

  const step120a = damp(0, 100, 10, 1 / 120);
  const step120b = damp(step120a, 100, 10, 1 / 120);
  assert.ok(Math.abs(step120b - step60Hz) < 0.05);

  assert.equal(damp(99.9999, 100, 10, 1 / 60, 0.001), 100);
});

test('normalizeWheelDelta normalizes pixel, line, and page deltas and caps spikes', () => {
  assert.equal(normalizeWheelDelta(40, 0, 900, 90), 40);
  assert.equal(normalizeWheelDelta(400, 0, 900, 90), 90);
  assert.equal(normalizeWheelDelta(-400, 0, 900, 90), -90);
  assert.equal(normalizeWheelDelta(2, 1, 900, 90), 64);
  assert.equal(normalizeWheelDelta(1, 2, 900, 90), 90);
});

test('stepVelocityClampedScroll enforces maximum scroll speed px/sec', () => {
  const dt = 1 / 60;
  const maxSpeed = 1200; // max 20px per frame at 60Hz
  const next = stepVelocityClampedScroll(0, 2000, dt, 10, maxSpeed);
  assert.ok(next <= 20.0001 && next > 0, `expected clamped step <= 20px, got ${next}`);

  // Reverse direction also capped
  const back = stepVelocityClampedScroll(2000, 0, dt, 10, maxSpeed);
  assert.ok(back >= 1979.9999 && back < 2000);
});

test('stepRateLimitedProgress prevents abrupt car teleports on fast jumps', () => {
  const dt = 1 / 60;
  const maxRate = 1.5; // max 0.025 progress per frame
  const next = stepRateLimitedProgress(0, 1, dt, 12, maxRate);
  assert.ok(next <= 0.0251 && next > 0, `expected rate-limited progress <= 0.025, got ${next}`);
});

test('computeHeroCarTransform frames car proudly at top and glides toward palace archway on scroll', () => {
  const startDesktop = computeHeroCarTransform(0, false);
  const midDesktop = computeHeroCarTransform(0.5, false);
  const endDesktop = computeHeroCarTransform(1, false);

  assert.ok(startDesktop.xVw >= -15 && startDesktop.xVw <= 0);
  assert.equal(startDesktop.opacity, 1);
  assert.ok(midDesktop.xVw > startDesktop.xVw);
  assert.ok(endDesktop.xVw > midDesktop.xVw);
  assert.ok(endDesktop.yVh < startDesktop.yVh);
  assert.ok(endDesktop.scale < midDesktop.scale && midDesktop.scale < startDesktop.scale);
});

test('computeFooterCarTransform enters from archway and approaches foreground smoothly', () => {
  const start = computeFooterCarTransform(0, false);
  const end = computeFooterCarTransform(1, false);

  assert.ok(start.xVw > end.xVw);
  assert.ok(start.yVh < end.yVh);
  assert.ok(end.scale > start.scale);
  assert.equal(end.opacity, 1);
});

test('computeDividerCarOffset glides symmetrically in both directions', () => {
  assert.equal(computeDividerCarOffset(0.5, 1, 120), 0);
  assert.equal(computeDividerCarOffset(0, 1, 120), -120);
  assert.equal(computeDividerCarOffset(1, 1, 120), 120);
  assert.equal(computeDividerCarOffset(0, -1, 120), 120);
  assert.equal(computeDividerCarOffset(1, -1, 120), -120);
});

test('formatCountdownParts formats days/hours/mins/secs accurately and clamps at zero', () => {
  const target = Date.parse('2027-02-11T10:00:00+05:30');
  const now = target - (5 * 86400000 + 3 * 3600000 + 9 * 60000 + 4 * 1000);
  const parts = formatCountdownParts(target, now);
  assert.deepEqual(parts, {
    days: '05',
    hours: '03',
    mins: '09',
    secs: '04',
    isComplete: false,
  });

  const past = formatCountdownParts(target, target + 5000);
  assert.deepEqual(past, {
    days: '00',
    hours: '00',
    mins: '00',
    secs: '00',
    isComplete: true,
  });
});

test('buildEventIcs emits valid VCALENDAR payload for updated dates', () => {
  const ics = buildEventIcs({
    id: 'day-wedding-2027',
    title: 'Day Wedding — Niraalii & Uttkarsh',
    startIso: '2027-02-11T10:00:00+05:30',
    endIso: '2027-02-11T15:00:00+05:30',
    location: 'New Delhi, India',
    description: 'Day Wedding ceremony of Niraalii & Uttkarsh. #NiUturn',
  });

  assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('DTSTART:20270211T043000Z'));
  assert.ok(ics.includes('SUMMARY:Day Wedding — Niraalii & Uttkarsh'));
  assert.ok(ics.includes('#NiUturn'));
  assert.ok(ics.endsWith('END:VCALENDAR'));
});
