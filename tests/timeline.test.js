/**
 * EventGenie — Timeline Module Unit Tests (ESM)
 * Run with: npm test
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../js/constants.js', () => ({
  EVENT_TYPES: {
    wedding: {
      milestones: [
        { monthsBefore: 12, tasks: ['Book venue', 'Set date'] },
        { monthsBefore: 6,  tasks: ['Send invitations'] },
        { monthsBefore: 1,  tasks: ['Final fitting', 'Pay vendors'] },
        { monthsBefore: 0,  tasks: ['Wedding day! 🎉'] }
      ]
    },
    birthday: {
      milestones: [
        { monthsBefore: 2, tasks: ['Book venue', 'Set theme'] },
        { monthsBefore: 0, tasks: ['Party time! 🎉'] }
      ]
    },
    community: {
      milestones: [
        { monthsBefore: 6, tasks: ['Apply for permits'] },
        { monthsBefore: 1, tasks: [
          'Vendor payment settlement',
          'Final caterer menu confirmation',
          'Record promo video',
          'Deliver flower centerpieces',
          'Obtain park insurance permit',
          'Recruit event volunteer security'
        ] },
        { monthsBefore: 0, tasks: ['Event day! 🎉'] }
      ]
    }
  },
  PRIORITY: {
    HIGH:   'high',
    MEDIUM: 'medium',
    LOW:    'low'
  }
}));

const {
  generateTimelineStructure, getTimelineProgress, getDaysUntilEvent,
  groupTasksByMonth, getOverdueTasks, getUpcomingTasks, subtractMonths, formatDate
} = await import('../js/timeline.js');

// ─── generateTimelineStructure ────────────────────────────────────────────────

describe('generateTimelineStructure', () => {
  const futureDate = '2027-12-31';

  test('returns an array of task objects', () => {
    const tasks = generateTimelineStructure(futureDate, 'wedding');
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
  });

  test('each task has required fields', () => {
    const tasks = generateTimelineStructure(futureDate, 'wedding');
    tasks.forEach(task => {
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('task');
      expect(task).toHaveProperty('dueDate');
      expect(task).toHaveProperty('priority');
      expect(task).toHaveProperty('done', false);
    });
  });

  test('tasks are sorted by due date ascending', () => {
    const tasks = generateTimelineStructure(futureDate, 'wedding');
    for (let i = 1; i < tasks.length; i++) {
      expect(new Date(tasks[i].dueDate).getTime())
        .toBeGreaterThanOrEqual(new Date(tasks[i - 1].dueDate).getTime());
    }
  });

  test('returns correct number of tasks for wedding (6 total)', () => {
    const tasks = generateTimelineStructure(futureDate, 'wedding');
    expect(tasks.length).toBe(6);
  });

  test('returns correct number of tasks for birthday (3 total)', () => {
    const tasks = generateTimelineStructure(futureDate, 'birthday');
    expect(tasks.length).toBe(3);
  });

  test('throws on unknown event type', () => {
    expect(() => generateTimelineStructure(futureDate, 'concert')).toThrow();
  });

  test('throws on invalid date', () => {
    expect(() => generateTimelineStructure('not-a-date', 'wedding')).toThrow();
  });

  test('tasks closest to event have "high" priority', () => {
    const tasks = generateTimelineStructure(futureDate, 'wedding');
    const lastTask = tasks[tasks.length - 1];
    expect(lastTask.priority).toBe('high');
  });
});

// ─── getTimelineProgress ──────────────────────────────────────────────────────

describe('getTimelineProgress', () => {
  test('returns 0% when no tasks are done', () => {
    const tasks  = [{ done: false }, { done: false }, { done: false }];
    const result = getTimelineProgress(tasks);
    expect(result.done).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.total).toBe(3);
  });

  test('returns 100% when all tasks done', () => {
    const tasks  = [{ done: true }, { done: true }];
    const result = getTimelineProgress(tasks);
    expect(result.percentage).toBe(100);
  });

  test('calculates 50% progress correctly', () => {
    const tasks  = [{ done: true }, { done: false }, { done: true }, { done: false }];
    const result = getTimelineProgress(tasks);
    expect(result.done).toBe(2);
    expect(result.percentage).toBe(50);
  });

  test('returns zeros for empty array', () => {
    const result = getTimelineProgress([]);
    expect(result.total).toBe(0);
    expect(result.done).toBe(0);
    expect(result.percentage).toBe(0);
  });
});

// ─── getDaysUntilEvent ────────────────────────────────────────────────────────

describe('getDaysUntilEvent', () => {
  test('returns positive number for future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const result = getDaysUntilEvent(futureDate.toISOString().split('T')[0]);
    expect(result).toBe(30);
  });

  test('returns negative number for past date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const result = getDaysUntilEvent(pastDate.toISOString().split('T')[0]);
    expect(result).toBe(-10);
  });

  test('returns 0 for today', () => {
    const today  = new Date().toISOString().split('T')[0];
    const result = getDaysUntilEvent(today);
    expect(result).toBe(0);
  });
});

// ─── groupTasksByMonth ────────────────────────────────────────────────────────

describe('groupTasksByMonth', () => {
  test('groups tasks by their due month', () => {
    const tasks = [
      { dueDate: '2027-01-15', task: 'Task A', done: false },
      { dueDate: '2027-01-20', task: 'Task B', done: false },
      { dueDate: '2027-02-10', task: 'Task C', done: false }
    ];
    const result = groupTasksByMonth(tasks);
    const keys   = Object.keys(result);
    expect(keys.length).toBe(2);
    const months = Object.values(result);
    expect(months[0].length).toBe(2); // Jan: 2 tasks
    expect(months[1].length).toBe(1); // Feb: 1 task
  });

  test('returns empty object for empty array', () => {
    expect(groupTasksByMonth([])).toEqual({});
  });

  test('handles non-array input gracefully', () => {
    expect(groupTasksByMonth(null)).toEqual({});
  });
});

// ─── getOverdueTasks ──────────────────────────────────────────────────────────

describe('getOverdueTasks', () => {
  test('returns only past-due incomplete tasks', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow  = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = [
      { dueDate: yesterday.toISOString().split('T')[0], done: false, task: 'Overdue' },
      { dueDate: yesterday.toISOString().split('T')[0], done: true,  task: 'Done already' },
      { dueDate: tomorrow.toISOString().split('T')[0],  done: false, task: 'Upcoming' }
    ];

    const result = getOverdueTasks(tasks);
    expect(result.length).toBe(1);
    expect(result[0].task).toBe('Overdue');
  });

  test('returns empty array when no overdue tasks', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 5);
    const tasks = [{ dueDate: tomorrow.toISOString().split('T')[0], done: false }];
    expect(getOverdueTasks(tasks)).toHaveLength(0);
  });

  test('handles non-array input gracefully', () => {
    expect(getOverdueTasks(null)).toEqual([]);
  });
});

// ─── getUpcomingTasks ─────────────────────────────────────────────────────────

describe('getUpcomingTasks', () => {
  test('returns tasks due within N days', () => {
    const in3Days  = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const in10Days = new Date();
    in10Days.setDate(in10Days.getDate() + 10);

    const tasks = [
      { dueDate: in3Days.toISOString().split('T')[0],  done: false, task: 'Soon' },
      { dueDate: in10Days.toISOString().split('T')[0], done: false, task: 'Later' }
    ];

    const result = getUpcomingTasks(tasks, 7);
    expect(result.length).toBe(1);
    expect(result[0].task).toBe('Soon');
  });

  test('excludes completed tasks', () => {
    const in2Days = new Date();
    in2Days.setDate(in2Days.getDate() + 2);
    const tasks = [{ dueDate: in2Days.toISOString().split('T')[0], done: true, task: 'Done' }];
    expect(getUpcomingTasks(tasks, 7)).toHaveLength(0);
  });

  test('handles non-array input in getUpcomingTasks gracefully', () => {
    expect(getUpcomingTasks(null)).toEqual([]);
  });

  test('generates timeline structure with diverse inferred categories', () => {
    const generated = generateTimelineStructure('2026-12-01', 'community');
    expect(generated.some(t => t.category === 'Finance')).toBe(true);
    expect(generated.some(t => t.category === 'Catering')).toBe(true);
    expect(generated.some(t => t.category === 'Media')).toBe(true);
    expect(generated.some(t => t.category === 'Décor')).toBe(true);
    expect(generated.some(t => t.category === 'Legal')).toBe(true);
    expect(generated.some(t => t.category === 'Logistics')).toBe(true);
  });
});

// ─── subtractMonths ───────────────────────────────────────────────────────────

describe('subtractMonths', () => {
  test('subtracts whole months correctly', () => {
    const base   = new Date('2027-06-15');
    const result = subtractMonths(base, 3);
    expect(result.getMonth()).toBe(2); // March (0-indexed)
    expect(result.getFullYear()).toBe(2027);
  });

  test('handles year rollover', () => {
    const base   = new Date('2027-02-01');
    const result = subtractMonths(base, 3);
    expect(result.getFullYear()).toBe(2026);
  });

  test('does not mutate the original date', () => {
    const base     = new Date('2027-06-15');
    const original = base.getTime();
    subtractMonths(base, 2);
    expect(base.getTime()).toBe(original);
  });
});

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  test('formats ISO date string into readable short format', () => {
    const formatted = formatDate('2026-10-28');
    expect(formatted).toBeTruthy();
    expect(formatted).toContain('2026');
    expect(formatted).toContain('28');
  });
});
