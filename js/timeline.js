/**
 * EventGenie — Timeline Module
 * Pure functions for generating and managing event timelines.
 * No DOM access — fully testable with Jest.
 */

import { EVENT_TYPES, PRIORITY } from './constants.js';

// ─── Generation ───────────────────────────────────────────────────────────────

/**
 * Generates a structured timeline of tasks based on event type and date.
 * Works backwards from the event date using milestone templates.
 *
 * @param {string} eventDate  - ISO date string of the event (e.g. "2027-06-15")
 * @param {string} eventType  - Event type key ('wedding' | 'birthday' | 'community')
 * @returns {TimelineTask[]}   Array of tasks sorted by due date (ascending)
 */
export function generateTimelineStructure(eventDate, eventType) {
  const config = EVENT_TYPES[eventType];
  if (!config) throw new Error(`Unknown event type: ${eventType}`);

  const eventTs = new Date(eventDate).getTime();
  if (isNaN(eventTs)) throw new Error('Invalid event date');

  const tasks = [];
  let taskIndex = 0;

  config.milestones.forEach(milestone => {
    const dueDate = subtractMonths(new Date(eventDate), milestone.monthsBefore);

    milestone.tasks.forEach(taskLabel => {
      tasks.push({
        id:       `task_${++taskIndex}`,
        task:     taskLabel,
        dueDate:  dueDate.toISOString().split('T')[0],
        priority: _getPriority(milestone.monthsBefore),
        category: _getCategory(taskLabel),
        done:     false,
        notes:    ''
      });
    });
  });

  // Sort by due date ascending
  return tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

// ─── Progress ─────────────────────────────────────────────────────────────────

/**
 * Calculates timeline completion progress.
 * @param {TimelineTask[]} tasks
 * @returns {{ total: number, done: number, percentage: number }}
 */
export function getTimelineProgress(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return { total: 0, done: 0, percentage: 0 };
  }
  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  const percentage = Math.round((done / total) * 100);
  return { total, done, percentage };
}

// ─── Filtering & Grouping ─────────────────────────────────────────────────────

/**
 * Returns the number of days until the event date.
 * Returns a negative number if the event is in the past.
 * @param {string} eventDate - ISO date string
 * @returns {number} Days until event
 */
export function getDaysUntilEvent(eventDate) {
  const today  = _todayMidnight();
  const target = new Date(eventDate);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Groups tasks by their due month (e.g., "November 2026").
 * @param {TimelineTask[]} tasks
 * @returns {{ [monthLabel: string]: TimelineTask[] }}
 */
export function groupTasksByMonth(tasks) {
  if (!Array.isArray(tasks)) return {};
  return tasks.reduce((groups, task) => {
    const date  = new Date(task.dueDate);
    const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(task);
    return groups;
  }, {});
}

/**
 * Returns tasks that are past their due date and not yet done.
 * @param {TimelineTask[]} tasks
 * @returns {TimelineTask[]}
 */
export function getOverdueTasks(tasks) {
  if (!Array.isArray(tasks)) return [];
  const today = _todayMidnight();
  return tasks.filter(t => {
    if (t.done) return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  });
}

/**
 * Returns tasks due within the next N days (not yet done).
 * @param {TimelineTask[]} tasks
 * @param {number} [days=7]
 * @returns {TimelineTask[]}
 */
export function getUpcomingTasks(tasks, days = 7) {
  if (!Array.isArray(tasks)) return [];
  const today   = _todayMidnight();
  const cutoff  = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  return tasks.filter(t => {
    if (t.done) return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due >= today && due <= cutoff;
  });
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

/**
 * Subtracts N months from a date, returning a new Date.
 * Handles fractional months (e.g., 0.5 = ~15 days).
 * @param {Date}   date
 * @param {number} months - Months to subtract (can be fractional)
 * @returns {Date}
 */
export function subtractMonths(date, months) {
  const result = new Date(date.getTime());
  const wholeMonths = Math.floor(months);
  const fractionalDays = Math.round((months - wholeMonths) * 30);

  result.setMonth(result.getMonth() - wholeMonths);
  result.setDate(result.getDate() - fractionalDays);
  return result;
}

/**
 * Formats a date string for display.
 * @param {string} dateStr - ISO date string
 * @returns {string} e.g. "15 Jun 2027"
 */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

/**
 * Returns today's date at midnight (local time) for consistent comparisons.
 * @returns {Date}
 */
function _todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Maps months-before-event to a priority level.
 * @param {number} monthsBefore
 * @returns {string} Priority constant
 */
function _getPriority(monthsBefore) {
  if (monthsBefore <= 1)  return PRIORITY.HIGH;
  if (monthsBefore <= 4)  return PRIORITY.MEDIUM;
  return PRIORITY.LOW;
}

/**
 * Infers a task category from its label.
 * @param {string} taskLabel
 * @returns {string} Category name
 */
function _getCategory(taskLabel) {
  const lower = taskLabel.toLowerCase();
  if (lower.includes('venue') || lower.includes('book'))    return 'Booking';
  if (lower.includes('budget') || lower.includes('payment')) return 'Finance';
  if (lower.includes('invit') || lower.includes('send'))    return 'Communication';
  if (lower.includes('dress') || lower.includes('fitting')) return 'Attire';
  if (lower.includes('food') || lower.includes('cater') || lower.includes('cake')) return 'Catering';
  if (lower.includes('photo') || lower.includes('video'))   return 'Media';
  if (lower.includes('decor') || lower.includes('flower'))  return 'Décor';
  if (lower.includes('permit') || lower.includes('insur'))  return 'Legal';
  if (lower.includes('volunteer') || lower.includes('security')) return 'Logistics';
  return 'General';
}

/**
 * @typedef {Object} TimelineTask
 * @property {string}  id       - Unique task ID
 * @property {string}  task     - Task description
 * @property {string}  dueDate  - ISO date string (YYYY-MM-DD)
 * @property {string}  priority - Priority level (high/medium/low)
 * @property {string}  category - Task category
 * @property {boolean} done     - Whether task is completed
 * @property {string}  notes    - Optional notes
 */
