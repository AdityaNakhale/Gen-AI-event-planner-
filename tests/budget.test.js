/**
 * EventGenie — Budget Module Unit Tests (ESM)
 * Run with: npm test
 */

import { jest } from '@jest/globals';

// Mock constants using ESM mock
jest.unstable_mockModule('../js/constants.js', () => ({
  EVENT_TYPES: {
    wedding: {
      budgetSplit: {
        venue: 30, catering: 30, photography: 10, florist: 7,
        djBand: 5, cake: 3, hairMakeup: 3, stationery: 2,
        transportation: 3, decor: 5, officiant: 1, miscellaneous: 1
      }
    },
    birthday: {
      budgetSplit: {
        venue: 25, catering: 30, cake: 10, entertainment: 20,
        decor: 8, photographer: 4, favors: 2, stationery: 1
      }
    },
    community: {
      budgetSplit: {
        venue: 15, permits: 5, catering: 25, av: 20,
        marketing: 15, security: 8, logistics: 7, miscellaneous: 5
      }
    }
  },
  CURRENCIES: {
    INR: { symbol: '₹', label: 'Indian Rupee', locale: 'en-IN' },
    USD: { symbol: '$', label: 'US Dollar',    locale: 'en-US' }
  },
  BUDGET_LIMITS: {
    min: 1000,
    max: 100000000,
    perHeadWarning: { wedding: 5000, birthday: 500, community: 200 }
  }
}));

const {
  allocateBudget, adjustBudgetSplit, calculateSpent, calculateRemaining,
  getBudgetHealth, validateBudget, formatCurrency, getBudgetSuggestion
} = await import('../js/budget.js');

// ─── allocateBudget ───────────────────────────────────────────────────────────

describe('allocateBudget', () => {
  test('splits wedding budget — total must equal input', () => {
    const result = allocateBudget(100000, 'wedding');
    const total  = Object.values(result).reduce((a, b) => a + b, 0);
    expect(total).toBe(100000);
  });

  test('splits birthday budget — total must equal input', () => {
    const result = allocateBudget(50000, 'birthday');
    const total  = Object.values(result).reduce((a, b) => a + b, 0);
    expect(total).toBe(50000);
  });

  test('splits community budget — total must equal input', () => {
    const result = allocateBudget(200000, 'community');
    const total  = Object.values(result).reduce((a, b) => a + b, 0);
    expect(total).toBe(200000);
  });

  test('wedding venue gets 30% of budget', () => {
    const result = allocateBudget(100000, 'wedding');
    expect(result.venue).toBe(30000);
  });

  test('birthday cake gets 10% of budget', () => {
    const result = allocateBudget(50000, 'birthday');
    expect(result.cake).toBe(5000);
  });

  test('throws on unknown event type', () => {
    expect(() => allocateBudget(100000, 'concert')).toThrow('Unknown event type: concert');
  });

  test('throws on non-numeric budget', () => {
    expect(() => allocateBudget('abc', 'wedding')).toThrow('totalBudget must be a number');
  });

  test('handles zero budget — all categories are 0', () => {
    const result = allocateBudget(0, 'wedding');
    expect(Object.values(result).every(v => v === 0)).toBe(true);
  });
});

// ─── adjustBudgetSplit ────────────────────────────────────────────────────────

describe('adjustBudgetSplit', () => {
  const initial = { venue: 30000, catering: 30000, photography: 10000, misc: 30000 };
  const total   = 100000;

  test('updated map still sums to total budget', () => {
    const result = adjustBudgetSplit(initial, 'venue', 40000, total);
    const sum    = Object.values(result).reduce((a, b) => a + b, 0);
    expect(sum).toBe(total);
  });

  test('changed category has the new value', () => {
    const result = adjustBudgetSplit(initial, 'venue', 40000, total);
    expect(result.venue).toBe(40000);
  });

  test('clamps if new amount exceeds total', () => {
    const result = adjustBudgetSplit(initial, 'venue', 110000, total);
    expect(result.venue).toBe(total);
  });
});

// ─── calculateSpent ───────────────────────────────────────────────────────────

describe('calculateSpent', () => {
  test('sums all vendor estimated costs', () => {
    const vendors = [{ estimated: 10000 }, { estimated: 5000 }, { estimated: 2500 }];
    expect(calculateSpent(vendors)).toBe(17500);
  });

  test('returns 0 for empty vendors array', () => {
    expect(calculateSpent([])).toBe(0);
  });

  test('ignores non-numeric estimated values', () => {
    const vendors = [{ estimated: 5000 }, { estimated: 'N/A' }, { estimated: null }];
    expect(calculateSpent(vendors)).toBe(5000);
  });

  test('returns 0 for non-array input', () => {
    expect(calculateSpent(null)).toBe(0);
    expect(calculateSpent(undefined)).toBe(0);
  });
});

// ─── calculateRemaining ───────────────────────────────────────────────────────

describe('calculateRemaining', () => {
  test('returns correct remaining amount', () => {
    const vendors = [{ estimated: 10000 }, { estimated: 5000 }];
    expect(calculateRemaining(50000, vendors)).toBe(35000);
  });

  test('returns negative when over budget', () => {
    const vendors = [{ estimated: 60000 }];
    expect(calculateRemaining(50000, vendors)).toBe(-10000);
  });

  test('returns full budget when no vendors', () => {
    expect(calculateRemaining(50000, [])).toBe(50000);
  });
});

// ─── getBudgetHealth ──────────────────────────────────────────────────────────

describe('getBudgetHealth', () => {
  test('returns "good" when under 80%', () => {
    expect(getBudgetHealth(70000, 100000).status).toBe('good');
  });

  test('returns "warning" at 80%', () => {
    expect(getBudgetHealth(80000, 100000).status).toBe('warning');
  });

  test('returns "over" at 100%+', () => {
    expect(getBudgetHealth(100000, 100000).status).toBe('over');
    expect(getBudgetHealth(110000, 100000).status).toBe('over');
  });

  test('calculates correct percentage', () => {
    expect(getBudgetHealth(25000, 100000).percentage).toBe(25);
  });

  test('handles zero total budget', () => {
    const result = getBudgetHealth(0, 0);
    expect(result.status).toBe('good');
    expect(result.percentage).toBe(0);
  });
});

// ─── validateBudget ───────────────────────────────────────────────────────────

describe('validateBudget', () => {
  test('returns valid for reasonable inputs', () => {
    const { valid, errors } = validateBudget(100000, 100, 'wedding');
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  test('returns error for budget below minimum', () => {
    const { valid, errors } = validateBudget(500, 10, 'birthday');
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes('at least'))).toBe(true);
  });

  test('returns error for zero guest count', () => {
    const { valid, errors } = validateBudget(50000, 0, 'birthday');
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes('Guest count'))).toBe(true);
  });

  test('returns warning for low per-head cost at wedding', () => {
    const { warnings } = validateBudget(10000, 100, 'wedding');
    expect(warnings.length).toBeGreaterThan(0);
  });

  test('returns error for missing budget', () => {
    const { valid } = validateBudget(null, 50, 'birthday');
    expect(valid).toBe(false);
  });
  test('returns error for budget exceeding maximum limit', () => {
    const { valid, errors } = validateBudget(200000000, 50, 'birthday');
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes('cannot exceed'))).toBe(true);
  });

  test('adjustBudgetSplit distributes equally when other categories sum to zero', () => {
    const split = { venue: 10000, catering: 0, decor: 0 };
    const adjusted = adjustBudgetSplit(split, 'venue', 4000, 10000);
    expect(adjusted.venue).toBe(4000);
    expect(adjusted.catering + adjusted.decor).toBe(6000);
  });
});

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  test('formats INR correctly — contains amount', () => {
    const result = formatCurrency(25000, 'INR');
    expect(result).toContain('25,000');
  });

  test('includes currency symbol', () => {
    const result = formatCurrency(100, 'INR');
    expect(result).toContain('₹');
  });

  test('rounds to whole numbers', () => {
    const result = formatCurrency(1234.56, 'INR');
    expect(result).not.toContain('.56');
  });

  test('falls back safely for unknown currency', () => {
    const result = formatCurrency(5000, 'UNKNOWN_CURR');
    expect(result).toBeTruthy();
    expect(result).toContain('5,000');
  });
});

// ─── getBudgetSuggestion ──────────────────────────────────────────────────────

describe('getBudgetSuggestion', () => {
  test('returns empty string if budget or guest count is missing', () => {
    expect(getBudgetSuggestion(0, 50, 'wedding')).toBe('');
    expect(getBudgetSuggestion(10000, 0, 'wedding')).toBe('');
  });

  test('returns well-funded suggestion when perHead is above threshold', () => {
    const suggestion = getBudgetSuggestion(500000, 50, 'wedding');
    expect(suggestion).toContain('well-funded');
  });

  test('returns warning suggestion when perHead is below threshold', () => {
    const suggestion = getBudgetSuggestion(50000, 100, 'wedding');
    expect(suggestion).toContain('consider increasing');
  });
});
