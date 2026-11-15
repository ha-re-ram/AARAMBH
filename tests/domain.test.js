const { test, describe } = require('node:test');
const assert = require('node:assert');
const domain = require('../js/domain.js');

describe('Domain Logic Unit Tests', () => {
  describe('HTML Sanitization (XSS Prevention)', () => {
    test('escapes malicious script tags and event handlers', () => {
      const malicious = '<img src=x onerror="alert(1)"> & <script>alert("pwn")</script>';
      const sanitized = domain.escapeHtml(malicious);
      assert.strictEqual(
        sanitized,
        '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &lt;script&gt;alert(&quot;pwn&quot;)&lt;/script&gt;'
      );
    });

    test('handles non-string gracefully', () => {
      assert.strictEqual(domain.escapeHtml(null), '');
      assert.strictEqual(domain.escapeHtml(undefined), '');
      assert.strictEqual(domain.escapeHtml(123), '');
    });
  });

  describe('Daily Progress Calculation', () => {
    test('returns 0% when no habits exist', () => {
      const progress = domain.calculateProgress([], []);
      assert.strictEqual(progress.percentage, 0);
      assert.strictEqual(progress.strokeDashoffset, 251.3);
      assert.strictEqual(progress.label, '0%');
    });

    test('calculates correct percentages and ring offsets', () => {
      const habits = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
      
      const half = domain.calculateProgress(habits, [1, 2]);
      assert.strictEqual(half.completed, 2);
      assert.strictEqual(half.total, 4);
      assert.strictEqual(half.percentage, 50);
      assert.strictEqual(half.strokeDashoffset, 251.3 / 2);
      assert.strictEqual(half.label, '50%');

      const full = domain.calculateProgress(habits, [1, 2, 3, 4]);
      assert.strictEqual(full.completed, 4);
      assert.strictEqual(full.percentage, 100);
      assert.strictEqual(full.strokeDashoffset, 0);
      assert.strictEqual(full.label, '100%');
    });
  });

  describe('True Consecutive Streak Calculation', () => {
    test('returns 0 when neither today nor yesterday was done', () => {
      const ref = new Date(2026, 10, 15);
      const history = {
        '2026-11-10': [1]
      };
      assert.strictEqual(domain.calculateStreak(1, history, ref), 0);
    });

    test('streak active if done yesterday, even if not yet done today', () => {
      const ref = new Date(2026, 10, 15);
      const history = {
        '2026-11-14': [1],
        '2026-11-13': [1],
        '2026-11-12': [1]
      };
      // Done for 3 consecutive days prior to today
      assert.strictEqual(domain.calculateStreak(1, history, ref), 3);
    });

    test('streak includes today when done today', () => {
      const ref = new Date(2026, 10, 15);
      const history = {
        '2026-11-15': [1],
        '2026-11-14': [1],
        '2026-11-13': [1]
      };
      assert.strictEqual(domain.calculateStreak(1, history, ref), 3);
    });

    test('broken streak stops counting at the skipped day', () => {
      const ref = new Date(2026, 10, 15);
      const history = {
        '2026-11-15': [1],
        '2026-11-14': [1],
        // skipped 2026-11-13
        '2026-11-12': [1],
        '2026-11-11': [1]
      };
      assert.strictEqual(domain.calculateStreak(1, history, ref), 2);
    });
  });

  describe('Growth Garden Logic (Untoggle Bug Fix)', () => {
    test('empty array in history does NOT mark heat-dot as active', () => {
      const ref = new Date(2026, 10, 15);
      const history = {
        '2026-11-15': [], // untoggled/empty
        '2026-11-14': [1] // completed
      };

      const garden = domain.generateGrowthGarden(history, 28, ref);
      assert.strictEqual(garden.dots.length, 28);

      const todayDot = garden.dots[garden.dots.length - 1];
      assert.strictEqual(todayDot.hasHarvest, false);
      assert.strictEqual(todayDot.completedCount, 0);

      const yesterdayDot = garden.dots[garden.dots.length - 2];
      assert.strictEqual(yesterdayDot.hasHarvest, true);
      assert.strictEqual(yesterdayDot.completedCount, 1);

      assert.strictEqual(garden.periodHarvests, 1);
    });
  });

  describe('Habit CRUD operations', () => {
    test('createHabit validates inputs', () => {
      assert.throws(() => domain.createHabit({ name: '' }), /cannot be empty/);
      assert.throws(() => domain.createHabit({ name: '   ' }), /cannot be empty/);

      const habit = domain.createHabit({ name: 'Morning Prayer', icon: 'heart', critical: true });
      assert.strictEqual(habit.name, 'Morning Prayer');
      assert.strictEqual(habit.icon, 'heart');
      assert.strictEqual(habit.critical, true);
      assert.strictEqual(habit.count, 0);
    });

    test('toggleHabitState toggles on and cleans up on untoggle', () => {
      const state = {
        habits: [{ id: 101, name: 'Meditation', count: 0, lastDone: '' }],
        history: {}
      };

      // Toggle on
      domain.toggleHabitState(state, 101, '2026-11-15');
      assert.deepStrictEqual(state.history['2026-11-15'], [101]);
      assert.strictEqual(state.habits[0].lastDone, '2026-11-15');

      // Untoggle off
      domain.toggleHabitState(state, 101, '2026-11-15');
      assert.strictEqual(state.history['2026-11-15'], undefined); // key purged
      assert.strictEqual(state.habits[0].lastDone, '');
    });

    test('updateHabit updates fields safely', () => {
      const habits = [{ id: 1, name: 'Old', icon: 'zap', critical: false }];
      const updated = domain.updateHabit(habits, 1, { name: 'New Name', icon: 'sun', critical: true });
      assert.strictEqual(updated[0].name, 'New Name');
      assert.strictEqual(updated[0].icon, 'sun');
      assert.strictEqual(updated[0].critical, true);
    });

    test('deleteHabit removes habit from habits and history', () => {
      const state = {
        habits: [{ id: 1 }, { id: 2 }],
        history: {
          '2026-11-14': [1, 2],
          '2026-11-15': [1]
        }
      };

      domain.deleteHabit(state, 1);
      assert.strictEqual(state.habits.length, 1);
      assert.strictEqual(state.habits[0].id, 2);
      assert.deepStrictEqual(state.history['2026-11-14'], [2]);
      assert.strictEqual(state.history['2026-11-15'], undefined);
    });
  });
});
