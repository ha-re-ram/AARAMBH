const { test, describe } = require('node:test');
const assert = require('node:assert');
const storage = require('../js/storage.js');

describe('Storage Layer Unit Tests', () => {
  test('formatLocalDate returns YYYY-MM-DD in local time', () => {
    const d = new Date(2026, 10, 15, 23, 45); // Nov 15, 2026 23:45 local time
    const formatted = storage.formatLocalDate(d);
    assert.strictEqual(formatted, '2026-11-15');
  });

  test('normalizeState provides defaults for null/empty/corrupted input', () => {
    const normalized = storage.normalizeState(null);
    assert.strictEqual(normalized.schemaVersion, 1);
    assert.strictEqual(normalized.user.name, 'Beautiful Soul');
    assert.strictEqual(normalized.habits.length, 2);
    assert.strictEqual(normalized.principles.length, 2);
    assert.deepStrictEqual(normalized.history, {});
    assert.deepStrictEqual(normalized.notes, {});
  });

  test('normalizeState preserves and cleans valid data', () => {
    const raw = {
      user: { name: '  Heroic Seeker  ' },
      habits: [
        { id: '10', name: 'Dawn Yoga', icon: 'zap', count: '5', lastDone: '2026-11-14', critical: true }
      ],
      principles: ['Vow 1', '   ', 'Vow 2'],
      history: {
        '2026-11-14': [10],
        '2026-11-15': [] // empty arrays should be dropped
      },
      notes: {
        '2026-11-14': 'A peaceful night.',
        '2026-11-15': '   ' // whitespace-only notes should be dropped
      }
    };

    const normalized = storage.normalizeState(raw);
    assert.strictEqual(normalized.user.name, 'Heroic Seeker');
    assert.strictEqual(normalized.habits.length, 1);
    assert.strictEqual(normalized.habits[0].id, 10);
    assert.strictEqual(normalized.habits[0].count, 5);
    assert.strictEqual(normalized.habits[0].critical, true);
    assert.deepStrictEqual(normalized.principles, ['Vow 1', 'Vow 2']);
    assert.deepStrictEqual(normalized.history, { '2026-11-14': [10] });
    assert.deepStrictEqual(normalized.notes, { '2026-11-14': 'A peaceful night.' });
  });

  test('validateImport validates versioned export file', () => {
    const payload = {
      app: 'AARAMBH',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: {
        user: { name: 'Arjun' },
        habits: [{ id: 1, name: 'Meditation', count: 12 }],
        principles: ['Patience is power'],
        history: { '2026-11-14': [1] },
        notes: { '2026-11-14': 'Deep quiet.' }
      }
    };

    const result = storage.validateImport(payload);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.isVersioned, true);
    assert.strictEqual(result.summary.userName, 'Arjun');
    assert.strictEqual(result.summary.habitCount, 1);
    assert.strictEqual(result.summary.vowCount, 1);
    assert.strictEqual(result.summary.noteCount, 1);
    assert.strictEqual(result.summary.dateRange, '2026-11-14 to 2026-11-14');
  });

  test('validateImport gracefully supports legacy export format without version wrapper', () => {
    const legacyPayload = {
      user: { name: 'Mira' },
      habits: [{ id: 1, name: 'Chanting' }],
      principles: ['Be gentle'],
      history: {},
      notes: {}
    };

    const result = storage.validateImport(legacyPayload);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.isVersioned, false);
    assert.strictEqual(result.summary.userName, 'Mira');
    assert.strictEqual(result.summary.habitCount, 1);
  });

  test('validateImport rejects invalid non-object payload', () => {
    const result = storage.validateImport("not a json object");
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  test('checkBackupReminder flags reminder after threshold', () => {
    const reminderWhenEmpty = storage.checkBackupReminder({ habits: [], notes: {} });
    assert.strictEqual(reminderWhenEmpty.needsBackup, false);

    // Mock state with notes and old backup date
    const mockState = {
      habits: [{ id: 1 }],
      notes: { '2026-11-01': 'Old note' },
      lastBackupDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
    };

    const reminder = storage.checkBackupReminder(mockState, 7);
    assert.strictEqual(reminder.needsBackup, true);
    assert.strictEqual(reminder.daysSinceLastBackup, 10);
  });
});
