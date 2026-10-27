/**
 * EventGenie — Budget Module
 * Pure functions for budget allocation, tracking, validation, and formatting.
 * No DOM access — fully testable with Jest.
 */

import { EVENT_TYPES, CURRENCIES, BUDGET_LIMITS } from './constants.js';

// ─── Allocation ───────────────────────────────────────────────────────────────

/**
 * Allocates a total budget across vendor categories using predefined percentage splits.
 * @param {number} totalBudget - Total budget amount
 * @param {string} eventType   - Event type key ('wedding' | 'birthday' | 'community')
 * @param {string} [currency='INR'] - Currency code
 * @returns {{ [category: string]: number }} Category → amount map
 */
export function allocateBudget(totalBudget, eventType, currency = 'INR') {
  const config = EVENT_TYPES[eventType];
  if (!config) throw new Error(`Unknown event type: ${eventType}`);
  if (typeof totalBudget !== 'number' || isNaN(totalBudget)) {
    throw new Error('totalBudget must be a number');
  }

  const split = config.budgetSplit;
  const result = {};
  let allocated = 0;
  const categories = Object.keys(split);

  categories.forEach((cat, idx) => {
    if (idx === categories.length - 1) {
      // Last category gets the remainder to avoid rounding drift
      result[cat] = Math.max(0, totalBudget - allocated);
    } else {
      const amount = Math.round((split[cat] / 100) * totalBudget);
      result[cat] = amount;
      allocated += amount;
    }
  });

  return result;
}

/**
 * Rebalances a budget allocation when one category changes.
 * Proportionally adjusts all other categories to maintain the total.
 * @param {{ [cat: string]: number }} currentSplit - Current allocation map
 * @param {string} changedCategory - Category that was manually changed
 * @param {number} newAmount       - New amount for the changed category
 * @param {number} totalBudget     - Total budget constraint
 * @returns {{ [cat: string]: number }} Updated allocation map
 */
export function adjustBudgetSplit(currentSplit, changedCategory, newAmount, totalBudget) {
  const remaining = totalBudget - newAmount;
  if (remaining < 0) {
    // Changed category exceeds total — clamp it
    return { ...currentSplit, [changedCategory]: totalBudget };
  }

  const otherCats = Object.keys(currentSplit).filter(c => c !== changedCategory);
  const otherTotal = otherCats.reduce((sum, c) => sum + currentSplit[c], 0);

  const updated = { [changedCategory]: newAmount };

  if (otherTotal === 0) {
    // Distribute remaining equally
    const share = Math.floor(remaining / otherCats.length);
    otherCats.forEach((cat, i) => {
      updated[cat] = i === otherCats.length - 1
        ? remaining - share * (otherCats.length - 1)
        : share;
    });
  } else {
    let distributed = 0;
    otherCats.forEach((cat, i) => {
      if (i === otherCats.length - 1) {
        updated[cat] = Math.max(0, remaining - distributed);
      } else {
        const proportion = currentSplit[cat] / otherTotal;
        const amount = Math.round(proportion * remaining);
        updated[cat] = amount;
        distributed += amount;
      }
    });
  }

  return updated;
}

// ─── Tracking ─────────────────────────────────────────────────────────────────

/**
 * Calculates the total estimated cost of all vendors.
 * @param {Object[]} vendors - Array of vendor objects with `estimated` field
 * @returns {number} Total estimated spend
 */
export function calculateSpent(vendors) {
  if (!Array.isArray(vendors)) return 0;
  return vendors.reduce((sum, v) => sum + (Number(v.estimated) || 0), 0);
}

/**
 * Calculates the remaining budget.
 * @param {number}   totalBudget
 * @param {Object[]} vendors
 * @returns {number} Remaining amount (can be negative if over budget)
 */
export function calculateRemaining(totalBudget, vendors) {
  return totalBudget - calculateSpent(vendors);
}

/**
 * Returns a budget health status.
 * @param {number} spent
 * @param {number} total
 * @returns {{ status: 'good'|'warning'|'over', percentage: number }}
 */
export function getBudgetHealth(spent, total) {
  if (total <= 0) return { status: 'good', percentage: 0 };
  const percentage = Math.round((spent / total) * 100);
  let status;
  if (percentage >= 100) status = 'over';
  else if (percentage >= 80)  status = 'warning';
  else                        status = 'good';
  return { status, percentage };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates budget and guest count inputs.
 * @param {number} totalBudget
 * @param {number} guestCount
 * @param {string} eventType
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateBudget(totalBudget, guestCount, eventType) {
  const errors = [];
  const warnings = [];

  if (!totalBudget || isNaN(totalBudget)) {
    errors.push('Budget is required and must be a number.');
  } else if (totalBudget < BUDGET_LIMITS.min) {
    errors.push(`Budget must be at least ${formatCurrency(BUDGET_LIMITS.min)}.`);
  } else if (totalBudget > BUDGET_LIMITS.max) {
    errors.push(`Budget cannot exceed ${formatCurrency(BUDGET_LIMITS.max)}.`);
  }

  if (guestCount > 0 && totalBudget > 0 && eventType) {
    const perHead = totalBudget / guestCount;
    const threshold = BUDGET_LIMITS.perHeadWarning[eventType] || 500;
    if (perHead < threshold) {
      warnings.push(
        `Per-head cost of ${formatCurrency(Math.round(perHead))} may be too low for a ${eventType}. ` +
        `Consider at least ${formatCurrency(threshold)} per guest.`
      );
    }
  }

  if (!guestCount || isNaN(guestCount) || guestCount < 1) {
    errors.push('Guest count must be at least 1.');
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Formats a number as a localized currency string.
 * @param {number} amount
 * @param {string} [currency='INR'] - Currency code
 * @returns {string} Formatted string, e.g. "₹25,000"
 */
export function formatCurrency(amount, currency = 'INR') {
  const config = CURRENCIES[currency] || CURRENCIES.INR;
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${config.symbol}${Math.round(amount).toLocaleString()}`;
  }
}

/**
 * Returns a summary suggestion comparing budget to per-head norms.
 * @param {number} totalBudget
 * @param {number} guestCount
 * @param {string} eventType
 * @param {string} [currency='INR']
 * @returns {string} Human-readable suggestion
 */
export function getBudgetSuggestion(totalBudget, guestCount, eventType, currency = 'INR') {
  if (!guestCount || !totalBudget) return '';
  const perHead = Math.round(totalBudget / guestCount);
  const threshold = BUDGET_LIMITS.perHeadWarning[eventType] || 500;
  const formatted = formatCurrency(perHead, currency);
  const diff = perHead - threshold;

  if (diff >= 0) {
    return `${formatted} per guest — well-funded for a great ${eventType}! 🎉`;
  } else {
    return `${formatted} per guest — consider increasing budget by ${formatCurrency(Math.abs(diff) * guestCount, currency)} for a comfortable experience.`;
  }
}
