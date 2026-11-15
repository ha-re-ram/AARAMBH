/**
 * AARAMBH Core Domain Logic
 * 
 * Pure functions for:
 * - HTML Sanitization & XSS prevention
 * - Daily progress calculation & progress ring offset
 * - True consecutive streak calculation
 * - Growth Garden (28-day harvest) generation
 * - Habit CRUD operations & validation
 * - Daily date sync
 */

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format local date as YYYY-MM-DD
 */
function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Subtract N days from a Date object
 */
function subtractDays(d, days) {
  const result = new Date(d);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Calculate completion percentage and ring offset for today
 * Ring circumference: 2 * PI * 40 ~= 251.3
 */
function calculateProgress(habits = [], historyForDate = []) {
  if (!Array.isArray(habits) || habits.length === 0) {
    return {
      total: 0,
      completed: 0,
      percentage: 0,
      strokeDashoffset: 251.3,
      label: '0%'
    };
  }

  const habitIdSet = new Set(habits.map(h => Number(h.id)));
  const completedIds = Array.isArray(historyForDate) 
    ? historyForDate.filter(id => habitIdSet.has(Number(id)))
    : [];

  const completed = completedIds.length;
  const total = habits.length;
  const percentage = Math.round((completed / total) * 100);
  const strokeDashoffset = Math.max(0, 251.3 - (percentage / 100) * 251.3);

  return {
    total,
    completed,
    percentage,
    strokeDashoffset,
    label: `${percentage}%`
  };
}

/**
 * Calculate genuine consecutive day streak for a habit
 * Scans backward from today (or yesterday if today isn't done yet).
 */
function calculateStreak(habitId, history = {}, referenceDate = new Date()) {
  const numId = Number(habitId);
  const todayKey = getLocalDateString(referenceDate);
  const yesterdayKey = getLocalDateString(subtractDays(referenceDate, 1));

  const isDoneOnKey = (key) => {
    const list = history[key];
    return Array.isArray(list) && list.some(id => Number(id) === numId);
  };

  const doneToday = isDoneOnKey(todayKey);
  const doneYesterday = isDoneOnKey(yesterdayKey);

  // If not done today AND not done yesterday, streak is broken
  if (!doneToday && !doneYesterday) {
    return 0;
  }

  let streak = 0;
  let currentOffset = doneToday ? 0 : 1;

  while (true) {
    const checkKey = getLocalDateString(subtractDays(referenceDate, currentOffset));
    if (isDoneOnKey(checkKey)) {
      streak++;
      currentOffset++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Generate 28-day Growth Garden heatmap data
 */
function generateGrowthGarden(history = {}, days = 28, referenceDate = new Date()) {
  const dots = [];
  let totalHarvests = 0;

  for (let i = days - 1; i >= 0; i--) {
    const d = subtractDays(referenceDate, i);
    const dateKey = getLocalDateString(d);
    const completedList = history[dateKey];
    const completedCount = Array.isArray(completedList) ? completedList.length : 0;
    const hasHarvest = completedCount > 0;

    if (hasHarvest) totalHarvests++;

    dots.push({
      dateKey,
      completedCount,
      hasHarvest,
      isToday: i === 0,
      label: `${dateKey}: ${completedCount} completed`
    });
  }

  // Count total unique historical harvest days across all time
  const allHistoricalHarvests = Object.entries(history).filter(
    ([_, list]) => Array.isArray(list) && list.length > 0
  ).length;

  return {
    dots,
    periodHarvests: totalHarvests,
    allTimeHarvests: allHistoricalHarvests
  };
}

/**
 * Add a new habit with validation
 */
function createHabit({ name, icon = 'sparkles', critical = false }) {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) {
    throw new Error('Habit name cannot be empty.');
  }
  if (trimmed.length > 60) {
    throw new Error('Habit name must be under 60 characters.');
  }

  const validIcons = ['shield-heart', 'sparkles', 'target', 'zap', 'heart', 'feather', 'sun', 'star'];
  const safeIcon = validIcons.includes(icon) ? icon : 'sparkles';

  return {
    id: Date.now(),
    name: trimmed,
    icon: safeIcon,
    count: 0,
    lastDone: '',
    critical: Boolean(critical)
  };
}

/**
 * Toggle habit completion state for a given date
 */
function toggleHabitState(state, habitId, dateKey = getLocalDateString()) {
  const numId = Number(habitId);
  const habit = state.habits.find(h => Number(h.id) === numId);
  if (!habit) return state;

  if (!state.history[dateKey]) {
    state.history[dateKey] = [];
  }

  const isCompletedToday = state.history[dateKey].includes(numId);

  if (isCompletedToday) {
    // Untoggle
    state.history[dateKey] = state.history[dateKey].filter(id => Number(id) !== numId);
    if (state.history[dateKey].length === 0) {
      delete state.history[dateKey];
    }
    habit.lastDone = '';
  } else {
    // Toggle on
    state.history[dateKey].push(numId);
    habit.lastDone = dateKey;
  }

  // Recalculate genuine streak
  habit.count = calculateStreak(numId, state.history);

  return state;
}

/**
 * Update habit properties
 */
function updateHabit(habits, habitId, updates) {
  const numId = Number(habitId);
  return habits.map(h => {
    if (Number(h.id) !== numId) return h;
    const trimmed = typeof updates.name === 'string' ? updates.name.trim() : h.name;
    const validIcons = ['shield-heart', 'sparkles', 'target', 'zap', 'heart', 'feather', 'sun', 'star'];
    const safeIcon = validIcons.includes(updates.icon) ? updates.icon : h.icon;
    const critical = typeof updates.critical === 'boolean' ? updates.critical : h.critical;

    return {
      ...h,
      name: trimmed || h.name,
      icon: safeIcon,
      critical
    };
  });
}

/**
 * Delete habit and purge its history
 */
function deleteHabit(state, habitId) {
  const numId = Number(habitId);
  state.habits = state.habits.filter(h => Number(h.id) !== numId);

  for (const [dateKey, list] of Object.entries(state.history)) {
    if (Array.isArray(list)) {
      state.history[dateKey] = list.filter(id => Number(id) !== numId);
      if (state.history[dateKey].length === 0) {
        delete state.history[dateKey];
      }
    }
  }

  return state;
}

/**
 * Daily synchronization to update streak status
 */
function syncDailyState(state, todayKey = getLocalDateString()) {
  if (state.lastDate !== todayKey) {
    state.habits.forEach(h => {
      h.count = calculateStreak(h.id, state.history);
      if (h.lastDone !== todayKey) {
        h.lastDone = '';
      }
    });
    state.lastDate = todayKey;
  }
  return state;
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHtml,
    getLocalDateString,
    subtractDays,
    calculateProgress,
    calculateStreak,
    generateGrowthGarden,
    createHabit,
    toggleHabitState,
    updateHabit,
    deleteHabit,
    syncDailyState
  };
}

if (typeof window !== 'undefined') {
  window.AarambhDomain = {
    escapeHtml,
    getLocalDateString,
    subtractDays,
    calculateProgress,
    calculateStreak,
    generateGrowthGarden,
    createHabit,
    toggleHabitState,
    updateHabit,
    deleteHabit,
    syncDailyState
  };
}
