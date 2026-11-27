import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  computeHeroCarEntrance,
  computeFooterCarEntrance,
  formatCountdownParts,
  buildEventIcs,
} from './scrollMath';

test('clamp constrains values and guards NaN', () => {
  assert.equal(clamp(-5, 0, 1), 0);
  assert.equal(clamp(3.2, 0, 1), 1);
  assert.equal(clamp(0.45, 0, 1), 0.45);
  assert.equal(clamp(Number.NaN, 0, 1), 0);
});

test('computeHeroCarEntrance glides smoothly from left end (-100vw) to center (0vw)', () => {
  const start = computeHeroCarEntrance(0);
  const mid = computeHeroCarEntrance(0.5);
  const end = computeHeroCarEntrance(1);

  assert.equal(start.xVw, -100);
  assert.ok(mid.xVw > -100 && mid.xVw < 0, `expected mid xVw between -100 and 0, got ${mid.xVw}`);
  assert.equal(end.xVw, 0);
  assert.equal(end.opacity, 1);
});

test('computeFooterCarEntrance glides smoothly from right end (+100vw) to center (0vw)', () => {
  const start = computeFooterCarEntrance(0);
  const mid = computeFooterCarEntrance(0.5);
  const end = computeFooterCarEntrance(1);

  assert.equal(start.xVw, 100);
  assert.ok(mid.xVw < 100 && mid.xVw > 0, `expected mid xVw between 0 and 100, got ${mid.xVw}`);
  assert.equal(end.xVw, 0);
  assert.equal(end.opacity, 1);
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
