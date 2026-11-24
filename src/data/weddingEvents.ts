export type EventDayGroup = 'all' | 'feb-8-9' | 'feb-10-11' | 'feb-13';

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
    id: 'mehendi',
    name: 'Mehendi',
    dayGroup: 'feb-8-9',
    dateLabel: 'Monday, Feb 8th 2027',
    shortDate: 'Feb 8',
    city: 'Delhi',
    timeLabel: '6pm Onwards',
    attire: 'Vibrant festive hues & floral silhouettes',
    venueNote: 'Garden Courtyard, New Delhi — Valet reception at the North Archway.',
    mapQuery: 'New Delhi, India',
    startIso: '2027-02-08T18:00:00+05:30',
    endIso: '2027-02-08T23:00:00+05:30',
  },
  {
    id: 'haldi',
    name: 'Haldi',
    dayGroup: 'feb-8-9',
    dateLabel: 'Tuesday, Feb 9th 2027',
    shortDate: 'Feb 9',
    city: 'Delhi',
    timeLabel: '6pm Onwards',
    attire: 'Sunlit marigold, ochre & ivory traditionals',
    venueNote: 'Sandstone Terrace Lawn, New Delhi — Shade canopies & refreshing thandai bar.',
    mapQuery: 'New Delhi, India',
    startIso: '2027-02-09T18:00:00+05:30',
    endIso: '2027-02-09T20:00:00+05:30',
  },
  {
    id: 'cocktail',
    name: 'Cocktail',
    dayGroup: 'feb-8-9',
    dateLabel: 'Tuesday, Feb 9th 2027',
    shortDate: 'Feb 9',
    city: 'Delhi',
    timeLabel: '6pm Onwards',
    attire: 'Evening glamour, jewel tones & tailored silhouettes',
    venueNote: 'Lantern Ballroom, New Delhi — Live acoustic melodies followed by evening dancing.',
    mapQuery: 'New Delhi, India',
    startIso: '2027-02-09T18:00:00+05:30',
    endIso: '2027-02-10T00:00:00+05:30',
  },
  {
    id: 'engagement',
    name: 'Engagement',
    dayGroup: 'feb-10-11',
    dateLabel: 'Wednesday, Feb 10th 2027',
    shortDate: 'Feb 10',
    city: 'Delhi',
    timeLabel: '6pm Onwards',
    attire: 'Pastel couture & timeless festive wear',
    venueNote: 'Heritage Verandah, New Delhi — Ring exchange & family toast under the lanterns.',
    mapQuery: 'New Delhi, India',
    startIso: '2027-02-10T18:00:00+05:30',
    endIso: '2027-02-10T23:30:00+05:30',
  },
  {
    id: 'shaadi',
    name: 'Shaadi',
    dayGroup: 'feb-10-11',
    dateLabel: 'Thursday, Feb 11th 2027',
    shortDate: 'Feb 11',
    city: 'Delhi',
    timeLabel: '6pm Onwards',
    attire: 'Royal Indian heritage & classic ceremonial attire',
    venueNote: 'Grand Palace Lawns, New Delhi — Baraat welcome at 6:00 PM followed by Pheras.',
    mapQuery: 'New Delhi, India',
    startIso: '2027-02-11T18:00:00+05:30',
    endIso: '2027-02-12T00:30:00+05:30',
  },
  {
    id: 'reception',
    name: 'Reception',
    dayGroup: 'feb-13',
    dateLabel: 'Saturday, Feb 13th 2027',
    shortDate: 'Feb 13',
    city: 'Delhi',
    timeLabel: '6pm Onwards',
    attire: 'Formal heritage & black-tie festive elegance',
    venueNote: 'Royal Durbar Pavilion, New Delhi — Dinner celebration & live classical ensemble.',
    mapQuery: 'New Delhi, India',
    startIso: '2027-02-13T18:00:00+05:30',
    endIso: '2027-02-13T23:30:00+05:30',
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

export const WEDDING_TARGET_ISO = '2027-02-11T18:00:00+05:30';
export const WEDDING_HASHTAG = '#niraaliiuttkarsh';
