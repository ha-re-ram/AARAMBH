/**
 * AARAMBH End-to-End Test Suite (Playwright)
 * Testing all core flows, offline capabilities, export/import, and privacy guarantees.
 */

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  try {
    ({ chromium } = require('/home/ha-re-ram/.gemini/antigravity/brain/5b473291-2e2b-4629-9cfd-50f5f5e24bdf/scratch/node_modules/playwright'));
  } catch (err) {
    chromium = null;
  }
}

const assert = require('node:assert');
const { test, describe } = require('node:test');

const BASE_URL = 'http://localhost:8080';

describe('AARAMBH End-to-End Suite', () => {
  let browser;

  test.before(async (t) => {
    if (!chromium) {
      t.skip('Playwright is not installed in the environment');
      return;
    }
    browser = await chromium.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: true,
      args: ['--no-sandbox']
    });
  });

  test.after(async () => {
    if (browser) await browser.close();
  });

  test('Public Landing Page renders prerendered content and navigates to app', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/index.html`);

    const title = await page.title();
    assert.ok(title.includes('AARAMBH'), `Unexpected title: ${title}`);

    // Verify prerendered copy
    const heading = await page.innerText('h1');
    assert.ok(heading.includes('Personal Discipline'), `Unexpected heading: ${heading}`);

    // Click CTA to navigate to app
    await page.click('a:has-text("Enter Your Sanctuary")');
    await page.waitForURL('**/app.html');
    assert.ok(page.url().endsWith('app.html'), 'Failed to navigate to app.html');

    await context.close();
  });

  test('Core Habit Flows: Add, Toggle, Edit, and Delete habit in app', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/app.html`);

    // 1. Add Habit
    await page.click('button[aria-label="Create New Sacred Habit"]');
    await page.fill('#modal-habit-name', 'Mindful Breathing');
    await page.selectOption('#modal-habit-icon', 'feather');
    await page.check('#modal-habit-critical');
    await page.click('button:has-text("Anchor Habit")');
    await page.waitForTimeout(300);

    // Verify habit added
    const habitCards = page.locator('#habit-container button[role="checkbox"]');
    const habitCount = await habitCards.count();
    assert.ok(habitCount >= 3, `Expected at least 3 habits, found ${habitCount}`);

    // 2. Toggle Habit Progress
    const lastHabit = habitCards.last();
    await lastHabit.click();
    await page.waitForTimeout(300);

    const isChecked = await lastHabit.getAttribute('aria-checked');
    assert.strictEqual(isChecked, 'true', 'Habit should be marked as checked');

    const progressText = await page.innerText('#heart-text');
    assert.notStrictEqual(progressText, '0%', 'Progress should increase after checking habit');

    // 3. Edit Habit
    await page.click('button[aria-label="Edit habit: Mindful Breathing"]');
    await page.fill('#modal-habit-name', 'Deep Pranayama');
    await page.click('button:has-text("Anchor Habit")');
    await page.waitForTimeout(300);

    const updatedText = await page.innerText('#habit-container');
    assert.ok(updatedText.includes('Deep Pranayama'), 'Habit name should be updated');

    // 4. Delete Habit
    page.on('dialog', async d => await d.accept());
    await page.click('button[aria-label="Edit habit: Deep Pranayama"]');
    await page.click('#btn-delete-habit');
    await page.waitForTimeout(300);

    const finalHabits = await page.innerText('#habit-container');
    assert.ok(!finalHabits.includes('Deep Pranayama'), 'Deleted habit should no longer exist');

    await context.close();
  });

  test('Soul Diary Flow: Add, Edit/Repair, and Prevent Overflow', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/app.html`);

    await page.click('#nav-diary');
    await page.waitForTimeout(300);

    // Enter test reflection
    const testWhisper = 'Grateful for stillness and morning sunlight.';
    await page.fill('#diary-input', testWhisper);
    await page.click('button:has-text("ARCHIVE WHISPER")');
    await page.waitForTimeout(300);

    // Check entry rendered
    const historyText = await page.innerText('#diary-history');
    assert.ok(historyText.includes(testWhisper), 'Archived whisper should appear in history');

    // Repair Entry
    await page.click('button:has-text("REPAIR")');
    await page.waitForTimeout(200);
    const inputVal = await page.inputValue('#diary-input');
    assert.strictEqual(inputVal, testWhisper);

    // Update and save
    const updatedWhisper = 'Grateful for stillness, sunlight, and steady focus.';
    await page.fill('#diary-input', updatedWhisper);
    await page.click('button:has-text("ARCHIVE WHISPER")');
    await page.waitForTimeout(300);

    const updatedHistory = await page.innerText('#diary-history');
    assert.ok(updatedHistory.includes(updatedWhisper), 'Updated whisper should appear');

    // Verify word-break layout safety with long text
    const longString = 'peace_'.repeat(50);
    await page.fill('#diary-input', longString);
    await page.click('button:has-text("ARCHIVE WHISPER")');
    await page.waitForTimeout(300);

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize().width;
    assert.ok(bodyScrollWidth <= viewportWidth + 20, `Body horizontal overflow occurred: ${bodyScrollWidth} > ${viewportWidth}`);

    await context.close();
  });

  test('Settings: Add Vow without wiping in-progress form inputs', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/app.html`);

    await page.click('#nav-settings');
    await page.waitForTimeout(300);

    // User types new hero name
    await page.fill('#in-name', 'Devoted Seeker');

    // User clicks Add Vow
    await page.click('button:has-text("+ Add Vow")');
    await page.waitForTimeout(200);

    // Verify hero name was NOT wiped
    const currentName = await page.inputValue('#in-name');
    assert.strictEqual(currentName, 'Devoted Seeker', 'Add vow should not wipe in-progress name input');

    // Fill in the new vow
    const vowInputs = page.locator('.vow-field');
    const lastVow = vowInputs.last();
    await lastVow.fill('Serve all living beings with quiet kindness.');

    // Save
    await page.click('button:has-text("Update Heart Core")');
    await page.waitForTimeout(300);

    // Verify greeting updated on dashboard
    const greeting = await page.innerText('#angelic-greeting');
    assert.ok(greeting.includes('Devoted'), `Greeting should reflect new name, got: ${greeting}`);

    await context.close();
  });

  test('Versioned Export and Import with Preview and Validation', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/app.html`);

    await page.click('#nav-settings');
    await page.waitForTimeout(300);

    // Generate valid backup payload
    const backupPayload = {
      app: 'AARAMBH',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: {
        user: { name: 'Lotus Master' },
        habits: [
          { id: 801, name: 'Satsang', icon: 'sparkles', count: 7, lastDone: '', critical: true }
        ],
        principles: ['Stillness is supreme.'],
        history: { '2026-11-15': [801] },
        notes: { '2026-11-15': 'A day of quiet mastery.' }
      }
    };

    // Trigger import via input
    await page.evaluate((payload) => {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const file = new File([blob], 'backup.json');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const input = document.getElementById('import-file-input');
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, backupPayload);

    await page.waitForTimeout(400);

    // Verify Preview Modal opened
    const isModalVisible = await page.isVisible('#import-preview-modal:not(.hidden)');
    assert.ok(isModalVisible, 'Import preview modal should be visible');

    const previewUser = await page.innerText('#import-user');
    assert.strictEqual(previewUser, 'Lotus Master');

    // Confirm restore
    await page.click('button:has-text("Confirm & Restore")');
    await page.waitForTimeout(300);

    // Verify state restored
    await page.click('#nav-dashboard');
    const greeting = await page.innerText('#angelic-greeting');
    assert.ok(greeting.includes('Lotus'), `Greeting should update to Lotus Master: ${greeting}`);

    await context.close();
  });

  test('Destroy Memory Core requires typed confirmation "RELEASE"', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/app.html`);

    await page.click('#nav-settings');
    await page.waitForTimeout(300);

    await page.click('button:has-text("Destroy Memory Core")');
    await page.waitForTimeout(300);

    // Verify button is initially disabled
    const isBtnDisabled = await page.isDisabled('#btn-confirm-destroy');
    assert.strictEqual(isBtnDisabled, true, 'Destroy button must be disabled initially');

    // Type partial or wrong phrase
    await page.fill('#destroy-input-confirm', 'NO');
    assert.strictEqual(await page.isDisabled('#btn-confirm-destroy'), true);

    // Type correct confirmation
    await page.fill('#destroy-input-confirm', 'RELEASE');
    assert.strictEqual(await page.isDisabled('#btn-confirm-destroy'), false);

    // Click confirm destroy
    await page.click('#btn-confirm-destroy');
    await page.waitForTimeout(400);

    // Verify state reset to defaults
    const greeting = await page.innerText('#angelic-greeting');
    assert.ok(greeting.includes('Beautiful'), 'State should reset to default Beautiful Soul');

    await context.close();
  });

  test('Zero Outbound Tracking: No external domains contacted during app usage', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const externalDomains = [];
    page.on('request', req => {
      const hostname = new URL(req.url()).hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        externalDomains.push(hostname);
      }
    });

    await page.goto(`${BASE_URL}/app.html`);
    await page.click('#nav-diary');
    await page.fill('#diary-input', 'A quiet personal note.');
    await page.click('button:has-text("ARCHIVE WHISPER")');
    await page.waitForTimeout(300);
    await page.click('#nav-settings');
    await page.waitForTimeout(300);

    assert.strictEqual(
      externalDomains.length, 
      0, 
      `External domains were contacted during private app usage: ${externalDomains.join(', ')}`
    );

    await context.close();
  });
});
