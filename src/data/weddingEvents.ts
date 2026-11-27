export type EventDayGroup = 'all' | 'feb-9-10' | 'feb-11' | 'feb-14';

export interface WeddingEvent {
  id: string;
  name: string;
  dayGroup: Exclude<EventDayGroup, 'all'>;
  dateLabel: string;
  shortDate: string;
  city: string;
  timeLabel: string;
  attire: string;
  venueNote: string;
  mapQuery: string;
  startIso: string;
  endIso: string;
}

export interface CouplePortrait {
  index: number;
  caption: string;
  subtitle: string;
}

export const WEDDING_EVENTS: WeddingEvent[] = [
  {
    id: 'tilak',
    name: 'Tilak',
    dayGroup: 'feb-9-10',
    dateLabel: 'Tuesday, 9th Feb 2027',
    shortDate: '9th Feb',
    city: 'Delhi',
    timeLabel: 'Formal invite to follow',
    attire: 'Classic Indian festive elegance',
    venueNote: 'New Delhi — Formal venue details & timings to follow shortly.',
    mapQuery: 'New Delhi, India',
    startIso: '2027-02-09T18:00:00+05:30',
    endIso: '2027-02-09T22:30:00+05:30',
  },
  {
    id: 'haldi',
    name: 'Haldi',
    dayGroup: 'feb-9-10',
    dateLabel: 'Wednesday, 10th Feb 2027',
    shortDate: '10th Feb',
    city: 'Delhi',
    timeLabel: 'Formal invite to follow',
    attire: 'Sunlit marigold, ochre & ivory traditionals',
    venueNote: 'New Delhi — Formal venue details & timings to follow shortly.',
    mapQuery: 'New Delhi, India',
    startIso: '2027-02-10T11:00:00+05:30',
    endIso: '2027-02-10T15:00:00+05:30',
  },
  {
    id: 'sangeet',
    name: 'Sangeet Night',
    dayGroup: 'feb-9-10',
    dateLabel: 'Wednesday, 10th Feb 2027',
    shortDate: '10th Feb',
    city: 'Delhi',
    timeLabel: 'Formal invite to follow',
    attire: 'Evening glamour, jewel tones & dance-ready festive silhouettes',
    venueNote: 'New Delhi — An evening of music, dance & celebration. Formal venue details to follow.',
    mapQuery: 'New Delhi, India',
    startIso: '2027-02-10T19:00:00+05:30',
    endIso: '2027-02-11T00:00:00+05:30',
  },
  {
    id: 'day-wedding',
    name: 'Day Wedding',
    dayGroup: 'feb-11',
    dateLabel: 'Thursday, 11th Feb 2027',
    shortDate: '11th Feb',
    city: 'Delhi',
    timeLabel: 'Formal invite to follow',
    attire: 'Royal Indian heritage & classic ceremonial wear',
    venueNote: 'New Delhi — Daytime ceremonial wedding & Pheras. Formal venue details to follow.',
    mapQuery: 'New Delhi, India',
    startIso: '2027-02-11T10:00:00+05:30',
    endIso: '2027-02-11T15:00:00+05:30',
  },
  {
    id: 'wedding-dinner',
    name: 'Wedding Dinner',
    dayGroup: 'feb-11',
    dateLabel: 'Thursday, 11th Feb 2027',
    shortDate: '11th Feb',
    city: 'Delhi',
    timeLabel: 'Formal invite to follow',
    attire: 'Evening heritage & festive formal attire',
    venueNote: 'New Delhi — Celebratory evening feast with family & friends. Formal venue details to follow.',
    mapQuery: 'New Delhi, India',
    startIso: '2027-02-11T19:30:00+05:30',
    endIso: '2027-02-11T23:30:00+05:30',
  },
  {
    id: 'reception',
    name: 'Reception',
    dayGroup: 'feb-14',
    dateLabel: 'Sunday, 14th Feb 2027',
    shortDate: '14th Feb',
    city: 'Nagpur',
    timeLabel: 'Formal invite to follow',
    attire: 'Formal heritage & black-tie festive elegance',
    venueNote: 'Nagpur — Grand reception celebration. Formal venue details & timings to follow shortly.',
    mapQuery: 'Nagpur, Maharashtra, India',
    startIso: '2027-02-14T19:00:00+05:30',
    endIso: '2027-02-14T23:30:00+05:30',
  },
];

export const COUPLE_PORTRAITS: CouplePortrait[] = [
  {
    index: 0,
    caption: 'Niraalii & Uttkarsh — Palace Courtyard',
    subtitle: 'Beneath the sandstone arches of Delhi',
  },
  {
    index: 1,
    caption: 'Niraalii & Uttkarsh — Evening Lanterns',
    subtitle: 'Golden dusk & quiet laughter',
  },
];

export const WEDDING_TARGET_ISO = '2027-02-11T10:00:00+05:30';
export const WEDDING_HASHTAG = '#NiUturn';
