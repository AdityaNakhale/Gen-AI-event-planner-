/**
 * EventGenie — Constants Module Unit Tests
 */

import {
  EVENT_TYPES,
  CURRENCIES,
  BUDGET_LIMITS,
  STORAGE_KEYS,
  BOOKING_STATUS,
  PRIORITY,
  DEFAULT_SETTINGS
} from '../js/constants.js';

describe('EVENT_TYPES Constant', () => {
  const types = ['wedding', 'birthday', 'community'];

  test('contains all 3 required event types', () => {
    types.forEach(type => {
      expect(EVENT_TYPES[type]).toBeDefined();
      expect(EVENT_TYPES[type].label).toBeTruthy();
      expect(EVENT_TYPES[type].icon).toBeTruthy();
      expect(EVENT_TYPES[type].timelineMonths).toBeGreaterThan(0);
      expect(Array.isArray(EVENT_TYPES[type].vendors)).toBe(true);
      expect(EVENT_TYPES[type].vendors.length).toBeGreaterThan(0);
    });
  });

  test('budget splits for each event type sum to 100%', () => {
    types.forEach(type => {
      const split = EVENT_TYPES[type].budgetSplit;
      const total = Object.values(split).reduce((sum, val) => sum + val, 0);
      expect(total).toBe(100);
    });
  });

  test('each event type has non-empty milestones array', () => {
    types.forEach(type => {
      const milestones = EVENT_TYPES[type].milestones;
      expect(Array.isArray(milestones)).toBe(true);
      expect(milestones.length).toBeGreaterThan(0);
      milestones.forEach(m => {
        expect(typeof m.monthsBefore).toBe('number');
        expect(Array.isArray(m.tasks)).toBe(true);
        expect(m.tasks.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('CURRENCIES Constant', () => {
  test('contains common currencies with symbols and locales', () => {
    expect(CURRENCIES.INR).toBeDefined();
    expect(CURRENCIES.INR.symbol).toBe('₹');
    expect(CURRENCIES.USD).toBeDefined();
    expect(CURRENCIES.USD.symbol).toBe('$');
    expect(CURRENCIES.EUR).toBeDefined();
    expect(CURRENCIES.GBP).toBeDefined();
  });
});

describe('BUDGET_LIMITS Constant', () => {
  test('defines valid minimum and maximum constraints', () => {
    expect(BUDGET_LIMITS.min).toBeGreaterThan(0);
    expect(BUDGET_LIMITS.max).toBeGreaterThan(BUDGET_LIMITS.min);
    expect(BUDGET_LIMITS.perHeadWarning.wedding).toBeGreaterThan(0);
    expect(BUDGET_LIMITS.perHeadWarning.birthday).toBeGreaterThan(0);
    expect(BUDGET_LIMITS.perHeadWarning.community).toBeGreaterThan(0);
  });
});

describe('STORAGE_KEYS & Utility Constants', () => {
  test('STORAGE_KEYS contains required storage namespaces', () => {
    expect(STORAGE_KEYS.plans).toBe('eventgenie_plans');
    expect(STORAGE_KEYS.activePlan).toBe('eventgenie_active_plan');
    expect(STORAGE_KEYS.settings).toBe('eventgenie_settings');
  });

  test('PRIORITY contains low, medium, and high levels', () => {
    expect(PRIORITY.LOW).toBe('low');
    expect(PRIORITY.MEDIUM).toBe('medium');
    expect(PRIORITY.HIGH).toBe('high');
  });

  test('BOOKING_STATUS contains valid booking states', () => {
    expect(BOOKING_STATUS.BOOKED).toBe('booked');
    expect(BOOKING_STATUS.PAID).toBe('paid');
  });

  test('DEFAULT_SETTINGS contains currency and theme', () => {
    expect(DEFAULT_SETTINGS.currency).toBe('INR');
    expect(DEFAULT_SETTINGS.theme).toBeTruthy();
  });
});
