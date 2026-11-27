import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  damp,
  computeScrollVelocityPitch,
  computeHeroScrollFrame,
  computeFooterScrollFrame,
  formatCountdownParts,
  buildEventIcs,
} from './scrollMath';

test('clamp constrains values and guards NaN', () => {
  assert.equal(clamp(-5, 0, 1), 0);
  assert.equal(clamp(3.2, 0, 1), 1);
  assert.equal(clamp(0.45, 0, 1), 0.45);
  assert.equal(clamp(Number.NaN, 0, 1), 0);
});

test('damp smoothly converges in both forward and reverse directions', () => {
  const forward = damp(0, 1, 12, 1 / 60);
  const reverse = damp(1, 0, 12, 1 / 60);
  assert.ok(forward > 0.1 && forward < 0.3);
  assert.ok(reverse < 0.9 && reverse > 0.7);
  assert.equal(damp(0.9998, 1, 12, 1 / 60), 1);
});

test('computeScrollVelocityPitch mirrors forward vs reverse scroll direction and settles at 0', () => {
  const fwd = computeScrollVelocityPitch(0.08, 1.5, -1);
  const rev = computeScrollVelocityPitch(-0.08, 1.5, -1);
  const rest = computeScrollVelocityPitch(0, 1.5, -1);
  assert.ok(fwd < 0);
  assert.ok(rev > 0);
  assert.equal(Math.abs(fwd), Math.abs(rev));
  assert.equal(rest, 0);
});

test('computeHeroScrollFrame drives smoothly forward into archway and reverses identically to center', () => {
  const rest = computeHeroScrollFrame(0, 0, false);
  const midFwd = computeHeroScrollFrame(0.5, 0.05, false);
  const midRev = computeHeroScrollFrame(0.5, -0.05, false);
  const far = computeHeroScrollFrame(1, 0, false);

  // At top of page, parked dead-center at full scale
  assert.equal(rest.xVw, 0);
  assert.equal(rest.yVh, 0);
  assert.equal(rest.scale, 1);
  assert.equal(rest.opacity, 1);

  // Mid-scroll position is 100% identical forward vs reverse, while pitch mirrors direction
  assert.equal(midFwd.xVw, midRev.xVw);
  assert.equal(midFwd.yVh, midRev.yVh);
  assert.equal(midFwd.scale, midRev.scale);
  assert.ok(midFwd.pitchDeg < 0 && midRev.pitchDeg > 0);
  assert.ok(midRev.lampIntensity > midFwd.lampIntensity, 'brake lamps brighten when reversing');

  // At full hero scroll, convertible has driven right & up into palace archway
  assert.equal(far.xVw, 18);
  assert.equal(far.yVh, -16);
  assert.ok(far.scale < 0.55);
});

test('computeFooterScrollFrame emerges from upper-right archway on scroll down and reverses on scroll up', () => {
  const start = computeFooterScrollFrame(0, 0, false);
  const mid = computeFooterScrollFrame(0.5, 0.06, false);
  const arrived = computeFooterScrollFrame(1, 0, false);

  assert.equal(start.xVw, 44);
  assert.equal(start.yVh, -14);
  assert.equal(start.scale, 0.5);
  assert.ok(mid.xVw > 0 && mid.xVw < 44);
  assert.ok(mid.scale > 0.5 && mid.scale < 1);
  assert.ok(arrived.lampIntensity > start.lampIntensity);
  assert.ok(arrived.beamOpacity > start.beamOpacity);

  // At bottom of page, roadster is dead-center at full foreground scale
  assert.equal(arrived.xVw, 0);
  assert.equal(arrived.yVh, 0);
  assert.equal(arrived.scale, 1);
  assert.equal(arrived.opacity, 1);
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
