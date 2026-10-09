/**
 * First-run configuration. These values are inserted once, the first time a
 * new account signs in — afterwards everything is editable in Settings.
 */
export const INITIAL_QUEST = {
  name: 'Pre-Trip Quest',
  start_date: '2026-10-12',
  end_date: '2026-11-01',
};

export const INITIAL_COUNTDOWNS = [
  { title: 'Week 1', target_date: '2026-10-18', linked_to_quest: false, sort_order: 0 },
  // Linked: follows the active quest's end date (and name, while the title is empty).
  { title: '', target_date: null, linked_to_quest: true, sort_order: 1 },
  { title: 'My Trip', target_date: '2026-12-12', linked_to_quest: false, sort_order: 2 },
];
