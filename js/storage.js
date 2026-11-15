/**
 * AARAMBH Storage Layer - Local-First with IndexedDB
 * 
 * Provides:
 * - Zero-dependency IndexedDB wrapper with schema versioning.
 * - Automatic migration from legacy localStorage (`aarambh_angel_vfinal`).
 * - Versioned export and schema-validated import preview.
 * - Atomic state persistence and backup reminders.
 * - In-memory cache for synchronous read efficiency.
 */

const DB_NAME = 'AARAMBH_DB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const STATE_KEY = 'current';
const LEGACY_LOCALSTORAGE_KEY = 'aarambh_angel_vfinal';

const DEFAULT_INIT = {
  schemaVersion: 1,
  user: { name: 'Beautiful Soul' },
  habits: [
    { id: 1, name: 'Purity Shield', icon: 'shield-heart', count: 0, lastDone: '', critical: true },
    { id: 2, name: 'Growth Skill', icon: 'zap', count: 0, lastDone: '', critical: false }
  ],
  principles: [
    "You are too strong for these cheap thrills.",
    "Your energy is your magic."
  ],
  history: {},
  notes: {},
  lastDate: '',
  lastBackupDate: null
};

let dbInstance = null;
let memoryState = null;

/**
 * Format local date as YYYY-MM-DD
 */
function formatLocalDate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Open or initialize IndexedDB connection
 */
function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      reject(e.target.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Read raw record from IndexedDB
 */
async function getStoredState() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[Storage] IndexedDB read failed, falling back to memory/localStorage', err);
    return null;
  }
}

/**
 * Persist record to IndexedDB
 */
async function setStoredState(state) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(state, STATE_KEY);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[Storage] IndexedDB write failed:', err);
    // Fallback sync to localStorage as redundancy if possible
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LEGACY_LOCALSTORAGE_KEY, JSON.stringify(state));
      }
    } catch (_) {}
    throw err;
  }
}

/**
 * Sanitize and normalize state object
 */
function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_INIT));
  }

  const todayKey = formatLocalDate();
  const state = {
    schemaVersion: 1,
    user: {
      name: (raw.user && typeof raw.user.name === 'string' && raw.user.name.trim()) 
        ? raw.user.name.trim() 
        : 'Beautiful Soul'
    },
    habits: Array.isArray(raw.habits) ? raw.habits.map((h, i) => ({
      id: Number(h.id) || (Date.now() + i),
      name: typeof h.name === 'string' ? h.name : 'Habit',
      icon: typeof h.icon === 'string' ? h.icon : 'sparkles',
      count: Math.max(0, parseInt(h.count, 10) || 0),
      lastDone: typeof h.lastDone === 'string' ? h.lastDone : '',
      critical: Boolean(h.critical)
    })) : [...DEFAULT_INIT.habits],
    principles: Array.isArray(raw.principles) 
      ? raw.principles.filter(p => typeof p === 'string' && p.trim() !== '')
      : [...DEFAULT_INIT.principles],
    history: {},
    notes: {},
    lastDate: typeof raw.lastDate === 'string' ? raw.lastDate : todayKey,
    lastBackupDate: raw.lastBackupDate || null
  };

  // Normalize history
  if (raw.history && typeof raw.history === 'object' && !Array.isArray(raw.history)) {
    for (const [k, v] of Object.entries(raw.history)) {
      if (Array.isArray(v) && v.length > 0) {
        state.history[k] = v.map(id => Number(id)).filter(id => !isNaN(id));
      }
    }
  }

  // Normalize notes
  if (raw.notes && typeof raw.notes === 'object' && !Array.isArray(raw.notes)) {
    for (const [k, v] of Object.entries(raw.notes)) {
      if (typeof v === 'string' && v.trim() !== '') {
        state.notes[k] = v;
      }
    }
  }

  return state;
}

/**
 * Initialize storage with migration support
 */
async function initStorage() {
  const todayKey = formatLocalDate();

  // 1. Try reading from IndexedDB
  let existing = await getStoredState();

  // 2. If nothing in IndexedDB, check for legacy localStorage
  if (!existing && typeof localStorage !== 'undefined') {
    try {
      const legacyRaw = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        console.info('[Storage] Migrating legacy localStorage data to IndexedDB...');
        existing = normalizeState(parsed);
        await setStoredState(existing);
      }
    } catch (err) {
      console.warn('[Storage] Failed to read/parse legacy localStorage:', err);
    }
  }

  // 3. Fallback to default state if still empty
  if (!existing) {
    existing = JSON.parse(JSON.stringify(DEFAULT_INIT));
    existing.lastDate = todayKey;
    await setStoredState(existing);
  } else {
    existing = normalizeState(existing);
  }

  memoryState = existing;
  return memoryState;
}

/**
 * Synchronous getter for in-memory state
 */
function getState() {
  if (!memoryState) {
    memoryState = JSON.parse(JSON.stringify(DEFAULT_INIT));
    memoryState.lastDate = formatLocalDate();
  }
  return memoryState;
}

/**
 * Save state atomically to IndexedDB and update memory state
 */
async function saveState(updaterOrNewState) {
  const current = getState();
  let updated;

  if (typeof updaterOrNewState === 'function') {
    updated = updaterOrNewState(current);
  } else {
    updated = updaterOrNewState;
  }

  const normalized = normalizeState(updated);
  memoryState = normalized;

  // Persist to IndexedDB
  await setStoredState(normalized);
  return normalized;
}

/**
 * Reset memory core / factory reset
 */
async function resetStorage() {
  memoryState = JSON.parse(JSON.stringify(DEFAULT_INIT));
  memoryState.lastDate = formatLocalDate();

  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('[Storage] Error clearing IndexedDB:', e);
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY);
  }

  await setStoredState(memoryState);
  return memoryState;
}

/**
 * Create a versioned export payload
 */
function createExportPayload() {
  const state = getState();
  return {
    app: 'AARAMBH',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    generator: 'AARAMBH Local-First Engine',
    data: {
      user: state.user,
      habits: state.habits,
      principles: state.principles,
      history: state.history,
      notes: state.notes,
      lastDate: state.lastDate
    }
  };
}

/**
 * Validate imported JSON file
 */
function validateImport(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['File does not contain valid JSON object.'], summary: null };
  }

  // Check versioned wrapper vs legacy raw state
  let rawData = payload;
  let isVersioned = false;

  if (payload.app === 'AARAMBH' && payload.data && typeof payload.data === 'object') {
    rawData = payload.data;
    isVersioned = true;
  }

  // Validate or coerce user
  const user = (rawData.user && typeof rawData.user.name === 'string') 
    ? rawData.user 
    : { name: 'Beautiful Soul' };

  // Validate habits
  const habits = Array.isArray(rawData.habits) ? rawData.habits : [];
  if (!Array.isArray(rawData.habits)) {
    errors.push('Notice: No habits list found; default habits will be restored.');
  }

  // Validate principles
  const principles = Array.isArray(rawData.principles) ? rawData.principles : [];

  // Validate history
  const history = (rawData.history && typeof rawData.history === 'object' && !Array.isArray(rawData.history)) 
    ? rawData.history 
    : {};

  // Validate notes
  const notes = (rawData.notes && typeof rawData.notes === 'object' && !Array.isArray(rawData.notes)) 
    ? rawData.notes 
    : {};

  const historyDates = Object.keys(history).filter(k => Array.isArray(history[k]) && history[k].length > 0);
  const noteDates = Object.keys(notes).filter(k => typeof notes[k] === 'string' && notes[k].trim() !== '');

  const allDates = [...new Set([...historyDates, ...noteDates])].sort();
  const dateRange = allDates.length > 0 
    ? `${allDates[0]} to ${allDates[allDates.length - 1]}`
    : 'No active history recorded';

  const normalized = normalizeState(rawData);

  return {
    valid: true,
    isVersioned,
    errors,
    summary: {
      userName: user.name,
      habitCount: habits.length,
      vowCount: principles.length,
      harvestCount: historyDates.length,
      noteCount: noteDates.length,
      dateRange
    },
    data: normalized
  };
}

/**
 * Apply validated import data
 */
async function applyImport(validatedData) {
  if (!validatedData || !validatedData.data) {
    throw new Error('Invalid backup payload provided to applyImport');
  }
  return await saveState(validatedData.data);
}

/**
 * Check if a local backup reminder should be shown
 * Default threshold: 7 days
 */
function checkBackupReminder(customState = null, daysThreshold = 7) {
  const state = customState || getState();
  const hasContent = (state.habits && state.habits.length > 0) || 
                     (state.notes && Object.keys(state.notes).length > 0);

  if (!hasContent) return { needsBackup: false, daysSinceLastBackup: 0 };

  if (!state.lastBackupDate) {
    // If user has notes but never backed up, trigger reminder after 3 notes
    return { needsBackup: Object.keys(state.notes || {}).length >= 3, daysSinceLastBackup: null };
  }

  const lastBackup = new Date(state.lastBackupDate).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - lastBackup) / (1000 * 60 * 60 * 24));

  return {
    needsBackup: diffDays >= daysThreshold,
    daysSinceLastBackup: diffDays
  };
}

/**
 * Record backup completion timestamp
 */
async function recordBackupDone() {
  return await saveState(s => {
    s.lastBackupDate = new Date().toISOString();
    return s;
  });
}

// Module exports for testing and browser consumption
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DB_NAME,
    DB_VERSION,
    STORE_NAME,
    STATE_KEY,
    DEFAULT_INIT,
    formatLocalDate,
    normalizeState,
    initStorage,
    getState,
    saveState,
    resetStorage,
    createExportPayload,
    validateImport,
    applyImport,
    checkBackupReminder,
    recordBackupDone
  };
}

if (typeof window !== 'undefined') {
  window.AarambhStorage = {
    formatLocalDate,
    initStorage,
    getState,
    saveState,
    resetStorage,
    createExportPayload,
    validateImport,
    applyImport,
    checkBackupReminder,
    recordBackupDone
  };
}
