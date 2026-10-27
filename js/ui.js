/**
 * EventGenie — UI Helpers Module
 * DOM utility functions: toast notifications, modals, loading states,
 * view switching, and rendering helpers.
 * No business logic here — only presentation.
 */

import { formatCurrency } from './budget.js';
import { formatDate } from './timeline.js';

// ─── View Management ──────────────────────────────────────────────────────────

/**
 * Shows a specific view and hides all others.
 * Updates the nav active state accordingly.
 * @param {string} viewId - ID suffix e.g. 'landing', 'wizard', 'dashboard'
 */
export function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => {
    v.setAttribute('aria-hidden', 'true');
    v.classList.remove('view--active');
  });

  const target = document.getElementById(`view-${viewId}`);
  if (target) {
    target.setAttribute('aria-hidden', 'false');
    target.classList.add('view--active');
  }

  // Update nav links
  document.querySelectorAll('.nav__link[data-nav]').forEach(link => {
    link.classList.toggle('nav__link--active', link.dataset.nav === viewId);
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Toast Notifications ──────────────────────────────────────────────────────

let _toastTimeout = null;

/**
 * Shows a temporary toast notification.
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} [type='success']
 * @param {number} [duration=3500] - Auto-dismiss in ms
 */
export function showToast(message, type = 'success', duration = 3500) {
  const container = _getOrCreateToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${icons[type] || '📢'}</span>
    <span class="toast__message">${_escapeHtml(message)}</span>
    <button class="toast__close" aria-label="Dismiss notification">×</button>
  `;

  toast.querySelector('.toast__close').addEventListener('click', () => dismissToast(toast));
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  // Auto-dismiss
  if (_toastTimeout) clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => dismissToast(toast), duration);
}

/**
 * Dismisses and removes a toast element.
 * @param {HTMLElement} toast
 */
export function dismissToast(toast) {
  toast.classList.remove('toast--visible');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}

// ─── Modal ────────────────────────────────────────────────────────────────────

/**
 * Shows a confirmation modal.
 * @param {string} title
 * @param {string} message
 * @param {string} [confirmLabel='Confirm']
 * @param {string} [cancelLabel='Cancel']
 * @returns {Promise<boolean>} Resolves true on confirm, false on cancel
 */
export function showConfirmModal(title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'modal-title');

    overlay.innerHTML = `
      <div class="modal glass-card">
        <h2 class="modal__title" id="modal-title">${_escapeHtml(title)}</h2>
        <p class="modal__message">${_escapeHtml(message)}</p>
        <div class="modal__actions">
          <button class="btn btn--secondary" id="modal-cancel">${_escapeHtml(cancelLabel)}</button>
          <button class="btn btn--danger"    id="modal-confirm">${_escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;

    const close = (result) => {
      overlay.classList.remove('modal-overlay--visible');
      overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
      resolve(result);
    };

    overlay.querySelector('#modal-cancel').addEventListener('click', () => close(false));
    overlay.querySelector('#modal-confirm').addEventListener('click', () => close(true));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });

    // Keyboard: Escape closes modal
    const onKeydown = (e) => {
      if (e.key === 'Escape') { close(false); document.removeEventListener('keydown', onKeydown); }
    };
    document.addEventListener('keydown', onKeydown);

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));

    // Focus the cancel button for safety
    setTimeout(() => overlay.querySelector('#modal-cancel').focus(), 50);
  });
}

// ─── Loading States ───────────────────────────────────────────────────────────

/**
 * Replaces an element's content with a shimmer loading skeleton.
 * @param {string} elementId
 * @param {number} [rows=3] - Number of skeleton rows
 */
export function showLoading(elementId, rows = 3) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.setAttribute('aria-busy', 'true');
  el.innerHTML = Array(rows).fill(
    '<div class="skeleton skeleton--line" aria-hidden="true"></div>'
  ).join('');
}

/**
 * Removes the loading state from an element.
 * @param {string} elementId
 */
export function hideLoading(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.removeAttribute('aria-busy');
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

/**
 * Updates an animated progress bar element.
 * @param {number} percent    - 0–100
 * @param {string} elementId  - ID of the progress bar element
 * @param {string} [label]    - Accessible label
 */
export function renderProgressBar(percent, elementId, label) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const clamped = Math.min(100, Math.max(0, percent));
  const fill = el.classList?.contains('progress-bar__fill') ? el : (el.querySelector('.progress-bar__fill') || el);
  fill.style.width = `${clamped}%`;
  fill.setAttribute('aria-valuenow', clamped);
  if (el.getAttribute('role') === 'progressbar') {
    el.setAttribute('aria-valuenow', clamped);
    if (label) el.setAttribute('aria-label', label);
  } else if (el.parentElement?.getAttribute('role') === 'progressbar') {
    el.parentElement.setAttribute('aria-valuenow', clamped);
    if (label) el.parentElement.setAttribute('aria-label', label);
  }
}

// ─── Budget Bars ──────────────────────────────────────────────────────────────

/**
 * Renders a visual budget breakdown as labeled bars.
 * @param {{ [category: string]: number }} breakdown - Category → amount
 * @param {number} totalBudget
 * @param {string} containerId
 * @param {string} [currency='INR']
 */
export function renderBudgetBars(breakdown, totalBudget, containerId, currency = 'INR') {
  const container = document.getElementById(containerId);
  if (!container || !breakdown) return;

  const entries = Object.entries(breakdown);
  const colors  = [
    '#E10600', '#BFE23A', '#CBB3E8', '#E34234',
    '#D4FF3F', '#7B5EA7', '#B80500', '#2D1845',
    '#A988D4', '#E85B4E', '#B5E62A', '#9BB828'
  ];

  container.innerHTML = entries.map(([cat, amount], i) => {
    const pct = totalBudget > 0 ? Math.round((amount / totalBudget) * 100) : 0;
    const color = colors[i % colors.length];
    const label = _formatCategoryLabel(cat);
    return `
      <div class="budget-bar" role="listitem">
        <div class="budget-bar__header">
          <span class="budget-bar__label">${_escapeHtml(label)}</span>
          <span class="budget-bar__amount">${formatCurrency(amount, currency)} <span class="budget-bar__pct">(${pct}%)</span></span>
        </div>
        <div class="budget-bar__track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${label}: ${pct}%">
          <div class="budget-bar__fill" style="width:${pct}%; background:${color}"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Vendor Card ──────────────────────────────────────────────────────────────

/**
 * Returns HTML string for a vendor card.
 * @param {Object} vendor
 * @param {string} [currency='INR']
 * @returns {string} HTML string
 */
export function renderVendorCard(vendor, currency = 'INR') {
  const statusClass = vendor.booked ? 'badge--success' : 'badge--pending';
  const statusLabel = vendor.booked ? 'Booked ✓' : 'Pending';
  const priorityClass = `badge--priority-${vendor.priority || 'medium'}`;

  return `
    <div class="vendor-card glass-card" data-vendor-id="${_escapeHtml(vendor.id || '')}">
      <div class="vendor-card__header">
        <h3 class="vendor-card__name">${_escapeHtml(vendor.name || vendor.category || 'Vendor')}</h3>
        <div class="vendor-card__badges">
          <span class="badge ${priorityClass}">${_escapeHtml(vendor.priority || 'medium')}</span>
          <span class="badge ${statusClass}">${statusLabel}</span>
        </div>
      </div>
      <div class="vendor-card__cost">${formatCurrency(vendor.estimated || 0, currency)}</div>
      ${vendor.notes ? `<p class="vendor-card__notes">${_escapeHtml(vendor.notes)}</p>` : ''}
      <div class="vendor-card__actions">
        <button class="btn btn--sm btn--secondary" data-action="toggle-vendor" data-id="${_escapeHtml(vendor.id || '')}"
          aria-label="${vendor.booked ? 'Mark as pending' : 'Mark as booked'}: ${_escapeHtml(vendor.name || '')}">
          ${vendor.booked ? 'Mark Pending' : 'Mark Booked'}
        </button>
        <button class="btn btn--sm btn--ghost" data-action="delete-vendor" data-id="${_escapeHtml(vendor.id || '')}"
          aria-label="Delete vendor: ${_escapeHtml(vendor.name || '')}">
          🗑️
        </button>
      </div>
    </div>
  `;
}

// ─── Timeline Item ────────────────────────────────────────────────────────────

/**
 * Returns HTML string for a timeline task item.
 * @param {Object} task
 * @param {boolean} isOverdue
 * @returns {string} HTML string
 */
export function renderTimelineItem(task, isOverdue = false) {
  const overdueClass = isOverdue && !task.done ? 'timeline-item--overdue' : '';
  const doneClass    = task.done ? 'timeline-item--done' : '';
  const priorityClass = `timeline-item--priority-${task.priority || 'medium'}`;

  return `
    <div class="timeline-item ${overdueClass} ${doneClass} ${priorityClass}" 
         data-task-id="${_escapeHtml(task.id)}">
      <label class="timeline-item__check" for="task-${_escapeHtml(task.id)}">
        <input type="checkbox" id="task-${_escapeHtml(task.id)}"
          ${task.done ? 'checked' : ''}
          data-action="toggle-task" data-id="${_escapeHtml(task.id)}"
          aria-label="Mark task as done: ${_escapeHtml(task.task)}" />
        <span class="timeline-item__label">${_escapeHtml(task.task)}</span>
      </label>
      <div class="timeline-item__meta">
        <span class="timeline-item__date">${formatDate(task.dueDate)}</span>
        <span class="badge badge--category">${_escapeHtml(task.category || 'General')}</span>
        ${isOverdue && !task.done ? '<span class="badge badge--overdue">Overdue</span>' : ''}
      </div>
    </div>
  `;
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

/**
 * Returns HTML string for a chat bubble.
 * @param {'user'|'ai'} role
 * @param {string} content
 * @param {string} [timestamp]
 * @returns {string} HTML string
 */
export function renderChatBubble(role, content, timestamp) {
  const isUser  = role === 'user';
  const cls     = isUser ? 'chat-bubble--user' : 'chat-bubble--ai';
  const avatar  = isUser ? '👤' : '✨';
  const name    = isUser ? 'You' : 'EventGenie';
  const time    = timestamp
    ? new Date(timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  return `
    <div class="chat-bubble ${cls}" role="listitem">
      <span class="chat-bubble__avatar" aria-hidden="true">${avatar}</span>
      <div class="chat-bubble__body">
        <div class="chat-bubble__header">
          <strong class="chat-bubble__name">${name}</strong>
          ${time ? `<time class="chat-bubble__time">${time}</time>` : ''}
        </div>
        <div class="chat-bubble__content">${_formatAIText(content)}</div>
      </div>
    </div>
  `;
}

// ─── Counter Animation ────────────────────────────────────────────────────────

/**
 * Animates a number counting up from `from` to `to` in an element.
 * @param {number} from
 * @param {number} to
 * @param {string} elementId
 * @param {number} [duration=800] - Animation duration in ms
 * @param {Function} [formatter] - Optional formatting function
 */
export function animateCounter(from, to, elementId, duration = 800, formatter) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const start = performance.now();
  const range = to - from;

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current  = Math.round(from + range * eased);
    el.textContent = formatter ? formatter(current) : current.toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

// ─── AI Thinking Indicator ────────────────────────────────────────────────────

/**
 * Shows an animated "AI is thinking" indicator in the chat.
 * @returns {HTMLElement} The thinking element (for removal later)
 */
export function showAIThinking() {
  const el = document.createElement('div');
  el.className = 'chat-bubble chat-bubble--ai chat-bubble--thinking';
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-label', 'EventGenie is thinking');
  el.innerHTML = `
    <span class="chat-bubble__avatar" aria-hidden="true">✨</span>
    <div class="chat-bubble__body">
      <div class="thinking-dots" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  return el;
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

function _getOrCreateToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Safely escapes HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string} Sanitized string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const _escapeHtml = escapeHtml;

function _formatAIText(text) {
  // Convert newlines to <br> and **bold** to <strong>
  return _escapeHtml(text)
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function _formatCategoryLabel(key) {
  // Convert camelCase or snake_case to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}
