import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  damp,
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
  assert.ok(step60Hz > 10 && step60Hz < 25, `expected realistic 60Hz step, got ${step60Hz}`);

  // Two 120Hz steps should closely match one 60Hz step (frame-rate independence)
  const step120a = damp(0, 100, 10, 1 / 120);
  const step120b = damp(step120a, 100, 10, 1 / 120);
  assert.ok(Math.abs(step120b - step60Hz) < 0.05);

  // Snaps directly to target when within epsilon
  assert.equal(damp(99.9999, 100, 10, 1 / 60, 0.001), 100);
});

test('computeHeroCarTransform frames car proudly at top and glides toward palace archway on scroll', () => {
  const startDesktop = computeHeroCarTransform(0, false);
  const midDesktop = computeHeroCarTransform(0.5, false);
  const endDesktop = computeHeroCarTransform(1, false);

  // Starts well inside viewport (not clipped off-screen at -44vw)
  assert.ok(startDesktop.xVw >= -15 && startDesktop.xVw <= 0);
  assert.equal(startDesktop.opacity, 1);

  // Drives rightward and upward along perspective road while shrinking smoothly
  assert.ok(midDesktop.xVw > startDesktop.xVw);
  assert.ok(endDesktop.xVw > midDesktop.xVw);
  assert.ok(endDesktop.yVh < startDesktop.yVh);
  assert.ok(endDesktop.scale < midDesktop.scale && midDesktop.scale < startDesktop.scale);

  // Mobile framing stays cleanly bounded
  const startMobile = computeHeroCarTransform(0, true);
  const endMobile = computeHeroCarTransform(1, true);
  assert.ok(startMobile.xVw >= -10 && startMobile.scale === 1);
  assert.ok(endMobile.xVw > startMobile.xVw && endMobile.scale < startMobile.scale);
});

test('computeFooterCarTransform enters from archway and approaches foreground smoothly', () => {
  const start = computeFooterCarTransform(0, false);
  const end = computeFooterCarTransform(1, false);

  assert.ok(start.xVw > end.xVw, 'car should travel right-to-left from archway');
  assert.ok(start.yVh < end.yVh, 'car should move down into foreground road');
  assert.ok(end.scale > start.scale, 'car should grow as it approaches viewer');
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
  const target = Date.parse('2027-02-11T18:00:00+05:30');
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

test('buildEventIcs emits valid VCALENDAR payload with UTC timestamps', () => {
  const ics = buildEventIcs({
    id: 'shaadi-2027',
    title: 'Shaadi — Niraalii & Uttkarsh',
    startIso: '2027-02-11T18:00:00+05:30',
    endIso: '2027-02-12T00:00:00+05:30',
    location: 'New Delhi, India',
    description: 'Wedding ceremony of Niraalii & Uttkarsh.',
  });

  assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('DTSTART:20270211T123000Z'));
  assert.ok(ics.includes('SUMMARY:Shaadi — Niraalii & Uttkarsh'));
  assert.ok(ics.includes('LOCATION:New Delhi\\, India'));
  assert.ok(ics.endsWith('END:VCALENDAR'));
});
