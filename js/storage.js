/**
 * EventGenie — Storage Module
 * All localStorage CRUD operations for event plans and settings.
 * Uses a structured schema with timestamps and unique IDs.
 */

import { STORAGE_KEYS } from './constants.js';

// ─── ID Generation ────────────────────────────────────────────────────────────

/**
 * Generates a unique plan ID using timestamp + random suffix.
 * @returns {string} Unique ID string, e.g. "plan_1698034200000_a3f9"
 */
export function generateId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `plan_${timestamp}_${random}`;
}

// ─── Plans CRUD ───────────────────────────────────────────────────────────────

/**
 * Saves a new plan to localStorage.
 * Assigns a new ID and timestamps automatically.
 * @param {Object} planData - Plan data (eventType, eventName, budget, etc.)
 * @returns {Object} The saved plan with id, createdAt, updatedAt
 */
export function savePlan(planData) {
  const plans = loadAllPlans();
  const now = new Date().toISOString();
  const plan = {
    ...planData,
    id: generateId(),
    createdAt: now,
    updatedAt: now
  };
  plans.push(plan);
  _writePlans(plans);
  return plan;
}

/**
 * Loads a single plan by its ID.
 * @param {string} id - Plan ID
 * @returns {Object|null} Plan object or null if not found
 */
export function loadPlan(id) {
  const plans = loadAllPlans();
  return plans.find(p => p.id === id) || null;
}

/**
 * Loads all saved plans from localStorage.
 * @returns {Object[]} Array of plan objects (empty array if none)
 */
export function loadAllPlans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.plans);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Merges partial updates into an existing plan and updates the timestamp.
 * @param {string} id - Plan ID to update
 * @param {Object} updates - Partial plan fields to merge
 * @returns {Object|null} Updated plan or null if not found
 */
export function updatePlan(id, updates) {
  const plans = loadAllPlans();
  const index = plans.findIndex(p => p.id === id);
  if (index === -1) return null;

  plans[index] = {
    ...plans[index],
    ...updates,
    id, // Ensure ID never changes
    updatedAt: new Date().toISOString()
  };
  _writePlans(plans);
  return plans[index];
}

/**
 * Deletes a plan by ID.
 * @param {string} id - Plan ID to delete
 * @returns {boolean} True if deleted, false if not found
 */
export function deletePlan(id) {
  const plans = loadAllPlans();
  const filtered = plans.filter(p => p.id !== id);
  if (filtered.length === plans.length) return false;
  _writePlans(filtered);

  // Clear active plan if it was deleted
  if (getActivePlanId() === id) {
    clearActivePlan();
  }
  return true;
}

// ─── Active Plan ──────────────────────────────────────────────────────────────

/**
 * Sets the currently active plan by ID.
 * @param {string} id - Plan ID
 */
export function setActivePlan(id) {
  localStorage.setItem(STORAGE_KEYS.activePlan, id);
}

/**
 * Gets the active plan ID from storage.
 * @returns {string|null} Active plan ID or null
 */
export function getActivePlanId() {
  return localStorage.getItem(STORAGE_KEYS.activePlan) || null;
}

/**
 * Loads the full active plan object.
 * @returns {Object|null} Active plan or null
 */
export function getActivePlan() {
  const id = getActivePlanId();
  if (!id) return null;
  return loadPlan(id);
}

/**
 * Clears the active plan selection (does NOT delete the plan).
 */
export function clearActivePlan() {
  localStorage.removeItem(STORAGE_KEYS.activePlan);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

/**
 * Saves app settings to localStorage.
 * @param {Object} settings
 */
export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

/**
 * Loads app settings from localStorage.
 * @returns {Object} Settings object (empty object if none)
 */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Wipes all EventGenie data from localStorage.
 * Use with caution — irreversible!
 */
export function clearAll() {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

/**
 * Returns a count of all saved plans.
 * @returns {number}
 */
export function getPlanCount() {
  return loadAllPlans().length;
}

/**
 * Exports a plan as a formatted JSON string.
 * @param {string} planId
 * @returns {string} Serialized JSON string
 */
export function exportPlanJSON(planId) {
  const plan = loadPlan(planId);
  if (!plan) throw new Error(`Plan with ID ${planId} not found.`);
  return JSON.stringify(plan, null, 2);
}

/**
 * Validates and imports a plan from a JSON string.
 * @param {string} jsonString
 * @returns {Object} Newly imported plan
 */
export function importPlanJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data.eventName || !data.eventType) {
      throw new Error('Invalid plan format: missing eventName or eventType.');
    }
    const imported = {
      ...data,
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return savePlan(imported);
  } catch (err) {
    throw new Error(`Failed to import plan: ${err.message}`);
  }
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

/**
 * Serializes and writes the plans array to localStorage.
 * @param {Object[]} plans
 */
function _writePlans(plans) {
  localStorage.setItem(STORAGE_KEYS.plans, JSON.stringify(plans));
}
