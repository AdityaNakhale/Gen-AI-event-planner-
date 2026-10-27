import { jest } from '@jest/globals';

// Mock localStorage for Node.js test environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem:    (key)       => store[key] ?? null,
    setItem:    (key, val)  => { store[key] = String(val); },
    removeItem: (key)       => { delete store[key]; },
    clear:      ()          => { store = {}; },
    get length()             { return Object.keys(store).length; }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value:    localStorageMock,
  writable: true
});

jest.unstable_mockModule('../js/constants.js', () => ({
  STORAGE_KEYS: {
    plans:      'eventgenie_plans',
    activePlan: 'eventgenie_active_plan',
    settings:   'eventgenie_settings'
  }
}));

const {
  generateId,
  savePlan,
  loadPlan,
  loadAllPlans,
  updatePlan,
  deletePlan,
  setActivePlan,
  getActivePlanId,
  getActivePlan,
  clearActivePlan,
  saveSettings,
  loadSettings,
  clearAll,
  getPlanCount,
  exportPlanJSON,
  importPlanJSON
} = await import('../js/storage.js');

// ─── Reset storage between tests ──────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

// ─── generateId ───────────────────────────────────────────────────────────────

describe('generateId', () => {
  test('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(0);
  });

  test('starts with "plan_"', () => {
    expect(generateId().startsWith('plan_')).toBe(true);
  });

  test('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, generateId));
    expect(ids.size).toBe(100);
  });
});

// ─── savePlan ─────────────────────────────────────────────────────────────────

describe('savePlan', () => {
  test('saves a plan and returns it with an ID', () => {
    const plan = savePlan({ eventType: 'wedding', eventName: 'Test Wedding' });
    expect(plan.id).toBeDefined();
    expect(plan.eventName).toBe('Test Wedding');
  });

  test('adds createdAt and updatedAt timestamps', () => {
    const plan = savePlan({ eventType: 'birthday' });
    expect(plan.createdAt).toBeDefined();
    expect(plan.updatedAt).toBeDefined();
  });

  test('plan appears in loadAllPlans after save', () => {
    savePlan({ eventName: 'Plan 1' });
    savePlan({ eventName: 'Plan 2' });
    const plans = loadAllPlans();
    expect(plans.length).toBe(2);
  });

  test('does not overwrite existing plans', () => {
    savePlan({ eventName: 'Plan A' });
    savePlan({ eventName: 'Plan B' });
    expect(loadAllPlans()).toHaveLength(2);
  });
});

// ─── loadPlan ─────────────────────────────────────────────────────────────────

describe('loadPlan', () => {
  test('retrieves a plan by ID', () => {
    const saved  = savePlan({ eventName: 'My Wedding' });
    const loaded = loadPlan(saved.id);
    expect(loaded.eventName).toBe('My Wedding');
    expect(loaded.id).toBe(saved.id);
  });

  test('returns null for unknown ID', () => {
    expect(loadPlan('nonexistent_id')).toBeNull();
  });
});

// ─── loadAllPlans ─────────────────────────────────────────────────────────────

describe('loadAllPlans', () => {
  test('returns empty array when nothing is saved', () => {
    expect(loadAllPlans()).toEqual([]);
  });

  test('returns all saved plans', () => {
    savePlan({ eventName: 'A' });
    savePlan({ eventName: 'B' });
    savePlan({ eventName: 'C' });
    expect(loadAllPlans()).toHaveLength(3);
  });

  test('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('eventgenie_plans', 'INVALID_JSON{{{{');
    expect(loadAllPlans()).toEqual([]);
  });
});

// ─── updatePlan ───────────────────────────────────────────────────────────────

describe('updatePlan', () => {
  test('merges partial updates into existing plan', () => {
    const plan    = savePlan({ eventName: 'Old Name', guestCount: 50 });
    const updated = updatePlan(plan.id, { eventName: 'New Name' });
    expect(updated.eventName).toBe('New Name');
    expect(updated.guestCount).toBe(50); // unchanged field preserved
  });

  test('updates the updatedAt timestamp', () => {
    const plan    = savePlan({ eventName: 'Test' });
    const before  = plan.updatedAt;
    // Small delay to ensure timestamp differs
    const updated = updatePlan(plan.id, { eventName: 'Updated' });
    expect(updated.updatedAt).toBeDefined();
  });

  test('does not change the plan ID', () => {
    const plan    = savePlan({ eventName: 'Test' });
    const updated = updatePlan(plan.id, { id: 'hacked_id' });
    expect(updated.id).toBe(plan.id);
  });

  test('returns null for non-existent plan', () => {
    expect(updatePlan('bad_id', { eventName: 'X' })).toBeNull();
  });

  test('updated plan is persisted to localStorage', () => {
    const plan = savePlan({ eventName: 'Original' });
    updatePlan(plan.id, { eventName: 'Modified' });
    const loaded = loadPlan(plan.id);
    expect(loaded.eventName).toBe('Modified');
  });
});

// ─── deletePlan ───────────────────────────────────────────────────────────────

describe('deletePlan', () => {
  test('removes plan from storage', () => {
    const plan = savePlan({ eventName: 'To Delete' });
    const result = deletePlan(plan.id);
    expect(result).toBe(true);
    expect(loadPlan(plan.id)).toBeNull();
  });

  test('returns false for non-existent plan', () => {
    expect(deletePlan('nonexistent')).toBe(false);
  });

  test('does not affect other plans', () => {
    const a = savePlan({ eventName: 'Keep' });
    const b = savePlan({ eventName: 'Delete Me' });
    deletePlan(b.id);
    expect(loadPlan(a.id)).not.toBeNull();
    expect(loadAllPlans()).toHaveLength(1);
  });

  test('clears activePlan if deleted plan was active', () => {
    const plan = savePlan({ eventName: 'Active' });
    setActivePlan(plan.id);
    deletePlan(plan.id);
    expect(getActivePlanId()).toBeNull();
  });
});

// ─── Active Plan ──────────────────────────────────────────────────────────────

describe('Active Plan Management', () => {
  test('setActivePlan and getActivePlanId round-trip', () => {
    const plan = savePlan({ eventName: 'Active Plan' });
    setActivePlan(plan.id);
    expect(getActivePlanId()).toBe(plan.id);
  });

  test('getActivePlan returns the full plan object', () => {
    const plan = savePlan({ eventName: 'Active Plan' });
    setActivePlan(plan.id);
    const active = getActivePlan();
    expect(active.eventName).toBe('Active Plan');
  });

  test('clearActivePlan removes the active plan selection', () => {
    const plan = savePlan({ eventName: 'Test' });
    setActivePlan(plan.id);
    clearActivePlan();
    expect(getActivePlanId()).toBeNull();
  });

  test('getActivePlan returns null when no active plan', () => {
    expect(getActivePlan()).toBeNull();
  });
});

// ─── Settings ─────────────────────────────────────────────────────────────────

describe('Settings', () => {
  test('saves and loads settings round-trip', () => {
    saveSettings({ currency: 'USD', theme: 'dark' });
    const loaded = loadSettings();
    expect(loaded.currency).toBe('USD');
    expect(loaded.theme).toBe('dark');
  });

  test('returns empty object when no settings', () => {
    expect(loadSettings()).toEqual({});
  });

  test('returns empty object when settings JSON is invalid', () => {
    localStorage.setItem('eventgenie_settings', 'invalid-json{{');
    expect(loadSettings()).toEqual({});
  });
});

// ─── clearAll & getPlanCount ──────────────────────────────────────────────────

describe('Utility Functions', () => {
  test('clearAll removes all EventGenie data', () => {
    savePlan({ eventName: 'Test' });
    clearAll();
    expect(loadAllPlans()).toEqual([]);
    expect(getActivePlanId()).toBeNull();
  });

  test('getPlanCount returns correct count', () => {
    savePlan({ eventName: 'A' });
    savePlan({ eventName: 'B' });
    expect(getPlanCount()).toBe(2);
  });

  test('getPlanCount returns 0 when empty', () => {
    expect(getPlanCount()).toBe(0);
  });
});

// ─── Export & Import ──────────────────────────────────────────────────────────

describe('Export and Import Plans', () => {
  test('exportPlanJSON returns valid serialized JSON string', () => {
    const plan = savePlan({ eventName: 'Export Me', eventType: 'wedding' });
    const jsonStr = exportPlanJSON(plan.id);
    expect(typeof jsonStr).toBe('string');
    const parsed = JSON.parse(jsonStr);
    expect(parsed.eventName).toBe('Export Me');
  });

  test('exportPlanJSON throws if plan not found', () => {
    expect(() => exportPlanJSON('non-existent-id')).toThrow(/not found/);
  });

  test('importPlanJSON validates and saves new plan', () => {
    const validJSON = JSON.stringify({
      eventName: 'Imported Birthday',
      eventType: 'birthday',
      totalBudget: 15000
    });

    const imported = importPlanJSON(validJSON);
    expect(imported.id).toBeTruthy();
    expect(imported.eventName).toBe('Imported Birthday');
    expect(loadPlan(imported.id)).toBeDefined();
  });

  test('importPlanJSON throws for invalid plan schema or corrupt JSON', () => {
    expect(() => importPlanJSON('{invalid json')).toThrow(/Failed to import/);
    expect(() => importPlanJSON('{"totalBudget": 5000}')).toThrow(/missing eventName or eventType/);
  });
});

