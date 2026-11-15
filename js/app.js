/**
 * AARAMBH Application Coordinator
 * Local-First, Accessible, XSS-Safe
 */

(function () {
  'use strict';

  const { escapeHtml, getLocalDateString, calculateProgress, calculateStreak, generateGrowthGarden, createHabit, toggleHabitState, updateHabit, deleteHabit, syncDailyState } = window.AarambhDomain;
  const { initStorage, getState, saveState, resetStorage, createExportPayload, validateImport, applyImport, checkBackupReminder, recordBackupDone } = window.AarambhStorage;
  const { getIconSvg, replaceIconTags } = window.AarambhIcons;

  const app = {
    view: 'dashboard',
    editDate: null,
    editingHabitId: null,
    pendingImportData: null,
    diaryPageSize: 10,
    diaryVisibleCount: 10,

    async init() {
      try {
        await initStorage();
        const state = getState();
        syncDailyState(state);
        await saveState(state);

        this.renderAll();
        this.navigate('dashboard');
        this.setupKeyboardListeners();
        this.checkBackupAlert();
        this.registerServiceWorker();
      } catch (err) {
        console.error('[AARAMBH] Initialization failed:', err);
        this.showToast('Failed to load local storage. Using default sanctuary.', 'error');
      }
    },

    announce(message) {
      const announcer = document.getElementById('a11y-announcer');
      if (announcer) {
        announcer.textContent = message;
      }
    },

    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast-item ${type === 'error' ? 'toast-error' : 'toast-info'}`;
      toast.innerHTML = `<span style="margin-right: 6px;">🌸</span> ${escapeHtml(message)}`;
      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },

    navigate(viewName) {
      this.view = viewName;
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      const activeTab = document.getElementById(`v-${viewName}`);
      if (activeTab) activeTab.classList.add('active');

      document.querySelectorAll('.nav-link').forEach(el => {
        el.classList.remove('active');
      });

      const activeNavBtn = document.getElementById(`nav-${viewName}`);
      if (activeNavBtn) {
        activeNavBtn.classList.add('active');
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderAll();
    },

    async toggleHabit(id) {
      const state = getState();
      const numId = Number(id);
      const habit = state.habits.find(h => Number(h.id) === numId);
      if (!habit) return;

      const todayKey = getLocalDateString();
      const wasDone = Array.isArray(state.history[todayKey]) && state.history[todayKey].includes(numId);

      toggleHabitState(state, numId, todayKey);
      await saveState(state);

      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(40);
      }

      this.renderDashboard();
      this.renderHeader();

      const progress = calculateProgress(state.habits, state.history[todayKey]);
      const statusText = wasDone ? 'unmarked' : 'completed';
      this.announce(`${habit.name} ${statusText}. Daily progress is now ${progress.percentage} percent.`);
    },

    openNewMission() {
      this.editingHabitId = null;
      document.getElementById('habit-modal-title').textContent = 'New Sacred Habit';
      document.getElementById('modal-habit-name').value = '';
      document.getElementById('modal-habit-icon').value = 'shield-heart';
      document.getElementById('modal-habit-critical').checked = false;
      document.getElementById('btn-delete-habit').classList.add('hidden');
      this.openModal('habit-modal');
      setTimeout(() => document.getElementById('modal-habit-name').focus(), 50);
    },

    openEditHabit(id) {
      const state = getState();
      const habit = state.habits.find(h => Number(h.id) === Number(id));
      if (!habit) return;

      this.editingHabitId = Number(id);
      document.getElementById('habit-modal-title').textContent = 'Edit Habit';
      document.getElementById('modal-habit-name').value = habit.name;
      document.getElementById('modal-habit-icon').value = habit.icon;
      document.getElementById('modal-habit-critical').checked = Boolean(habit.critical);
      document.getElementById('btn-delete-habit').classList.remove('hidden');
      this.openModal('habit-modal');
      setTimeout(() => document.getElementById('modal-habit-name').focus(), 50);
    },

    async saveHabitModal() {
      const name = document.getElementById('modal-habit-name').value.trim();
      if (!name) {
        this.showToast('Please enter a habit title, honey.', 'error');
        document.getElementById('modal-habit-name').focus();
        return;
      }

      const icon = document.getElementById('modal-habit-icon').value;
      const critical = document.getElementById('modal-habit-critical').checked;
      const state = getState();

      if (this.editingHabitId) {
        state.habits = updateHabit(state.habits, this.editingHabitId, { name, icon, critical });
        this.showToast('Habit updated peacefully.');
      } else {
        const newHabit = createHabit({ name, icon, critical });
        state.habits.push(newHabit);
        this.showToast('New sacred habit welcomed.');
      }

      await saveState(state);
      this.closeModal('habit-modal');
      this.renderDashboard();
      this.renderHeader();
    },

    async deleteHabitConfirm() {
      if (!this.editingHabitId) return;
      if (!confirm('Are you sure you want to release this habit from your sanctuary?')) {
        return;
      }

      const state = getState();
      deleteHabit(state, this.editingHabitId);
      await saveState(state);

      this.closeModal('habit-modal');
      this.renderDashboard();
      this.renderHeader();
      this.showToast('Habit released from your journey.');
      this.announce('Habit deleted.');
    },

    async saveDiary() {
      const input = document.getElementById('diary-input');
      const text = input.value.trim();
      if (!text) {
        this.showToast('Whisper something from your heart first, darling.', 'error');
        input.focus();
        return;
      }

      const state = getState();
      const targetDate = this.editDate || getLocalDateString();
      state.notes[targetDate] = text;
      this.editDate = null;
      input.value = '';

      await saveState(state);
      this.renderDiary();
      this.showToast('Whisper safely captured on this device.');
      this.announce('Whisper archived in your Soul Diary.');
    },

    editEntry(dateKey) {
      const state = getState();
      const note = state.notes[dateKey];
      if (typeof note !== 'string') return;

      this.editDate = dateKey;
      const input = document.getElementById('diary-input');
      input.value = note;
      document.getElementById('label-diary-date').textContent = `REPAIRING: ${dateKey}`;
      document.getElementById('edit-indicator').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      input.focus();
    },

    cancelEditEntry() {
      this.editDate = null;
      document.getElementById('diary-input').value = '';
      document.getElementById('label-diary-date').textContent = getLocalDateString();
      document.getElementById('edit-indicator').classList.add('hidden');
    },

    async deleteEntry(dateKey) {
      if (!confirm(`Erase this whisper from ${dateKey}, honey?`)) return;

      const state = getState();
      delete state.notes[dateKey];
      if (this.editDate === dateKey) {
        this.cancelEditEntry();
      }

      await saveState(state);
      this.renderDiary();
      this.showToast('Whisper released.');
      this.announce('Diary entry deleted.');
    },

    loadMoreDiary() {
      this.diaryVisibleCount += this.diaryPageSize;
      this.renderDiary();
    },

    addVowInput() {
      this.syncActiveSettingsInputs();
      const state = getState();
      state.principles.push('');
      this.renderSettings();
      const inputs = document.querySelectorAll('.vow-field');
      if (inputs.length > 0) {
        inputs[inputs.length - 1].focus();
      }
    },

    removeVow(index) {
      this.syncActiveSettingsInputs();
      const state = getState();
      if (index >= 0 && index < state.principles.length) {
        state.principles.splice(index, 1);
        this.renderSettings();
        this.announce('Sacred vow removed.');
      }
    },

    syncActiveSettingsInputs() {
      const state = getState();
      const nameInput = document.getElementById('in-name');
      if (nameInput) {
        state.user.name = nameInput.value.trim() || 'Beautiful Soul';
      }

      const vowFields = document.querySelectorAll('.vow-field');
      if (vowFields.length > 0) {
        state.principles = Array.from(vowFields).map(f => f.value.trim());
      }
    },

    async saveSettings() {
      this.syncActiveSettingsInputs();
      const state = getState();
      state.principles = state.principles.filter(p => p !== '');
      await saveState(state);

      this.showToast('Heart core updated.');
      this.navigate('dashboard');
    },

    triggerAngel() {
      const state = getState();
      const highStreak = Math.max(...state.habits.map(h => h.count), 0);
      document.getElementById('rescue-streak-count').textContent = `${highStreak} beautiful days`;
      this.openModal('rescue-modal');
    },

    exportAll() {
      const payload = createExportPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `aarambh_memory_${getLocalDateString()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);

      recordBackupDone();
      this.showToast('Memory core exported safely to your device.');
    },

    handleFileSelect(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          const validation = validateImport(parsed);

          if (!validation.valid) {
            alert(`Cannot import backup: ${validation.errors.join(' ')}`);
            return;
          }

          this.pendingImportData = validation;
          document.getElementById('import-user').textContent = validation.summary.userName;
          document.getElementById('import-habits').textContent = `${validation.summary.habitCount} habits`;
          document.getElementById('import-vows').textContent = `${validation.summary.vowCount} vows`;
          document.getElementById('import-harvests').textContent = `${validation.summary.harvestCount} harvest days`;
          document.getElementById('import-notes').textContent = `${validation.summary.noteCount} diary whispers`;
          document.getElementById('import-dates').textContent = validation.summary.dateRange;

          this.openModal('import-preview-modal');
        } catch (err) {
          alert('Invalid file format. Please provide a valid AARAMBH JSON backup.');
        } finally {
          event.target.value = '';
        }
      };
      reader.readAsText(file);
    },

    async confirmImport() {
      if (!this.pendingImportData) return;

      await applyImport(this.pendingImportData);
      this.pendingImportData = null;
      this.closeModal('import-preview-modal');
      this.renderAll();
      this.showToast('Memories restored successfully.');
      this.announce('Backup imported.');
    },

    openDestroyModal() {
      document.getElementById('destroy-input-confirm').value = '';
      document.getElementById('btn-confirm-destroy').disabled = true;
      this.openModal('destroy-modal');
    },

    handleDestroyInput(val) {
      const btn = document.getElementById('btn-confirm-destroy');
      btn.disabled = val.trim().toUpperCase() !== 'RELEASE';
    },

    async executeDestroy() {
      await resetStorage();
      this.closeModal('destroy-modal');
      this.renderAll();
      this.navigate('dashboard');
      this.showToast('All memories gently released.');
      this.announce('Memory core reset.');
    },

    openModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      }
    },

    closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    },

    checkBackupAlert() {
      const reminder = checkBackupReminder(null, 7);
      if (reminder.needsBackup) {
        setTimeout(() => {
          const container = document.getElementById('toast-container');
          if (!container) return;

          const toast = document.createElement('div');
          toast.className = 'toast-item toast-info';
          toast.innerHTML = `
            <div>
              <strong>🌸 Gentle Reminder:</strong>
              <div style="font-size: 13px; margin: 4px 0 8px;">Keep your sacred reflections safe with a local backup.</div>
              <button onclick="app.exportAll(); this.parentElement.parentElement.remove();" class="btn-magical" style="font-size: 11px; padding: 6px 14px; border-radius: 14px;">EXPORT NOW</button>
              <button onclick="this.parentElement.parentElement.remove();" class="btn-secondary" style="font-size: 11px; padding: 6px 12px; border-radius: 14px; margin-left: 6px;">LATER</button>
            </div>
          `;
          container.appendChild(toast);
        }, 1500);
      }
    },

    setupKeyboardListeners() {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(modal => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
          });
        }
      });
    },

    registerServiceWorker() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(reg => {
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.onstatechange = () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                this.showToast('New update ready! Refresh when peaceful.', 'info');
              }
            };
          };
        }).catch(err => console.warn('[SW] Registration failed:', err));
      }
    },

    renderAll() {
      this.renderHeader();
      this.renderDashboard();
      this.renderDiary();
      this.renderSettings();
    },

    renderHeader() {
      const state = getState();
      const todayKey = getLocalDateString();
      const firstName = (state.user.name || 'Soul').split(' ')[0];
      
      const greetingEl = document.getElementById('angelic-greeting');
      if (greetingEl) {
        greetingEl.textContent = `Sending you light and love, ${firstName}.`;
      }

      const progress = calculateProgress(state.habits, state.history[todayKey]);
      const circle = document.getElementById('heart-progress');
      if (circle) {
        circle.style.strokeDashoffset = progress.strokeDashoffset;
        const progressContainer = circle.closest('[role="progressbar"]');
        if (progressContainer) {
          progressContainer.setAttribute('aria-valuenow', progress.percentage);
          progressContainer.setAttribute('aria-label', `Daily discipline progress: ${progress.percentage}%`);
        }
      }

      const textEl = document.getElementById('heart-text');
      if (textEl) {
        textEl.textContent = progress.label;
      }
    },

    renderDashboard() {
      const state = getState();
      const todayKey = getLocalDateString();
      const habitContainer = document.getElementById('habit-container');
      if (!habitContainer) return;

      if (!state.habits || state.habits.length === 0) {
        habitContainer.innerHTML = `
          <div class="aesthetic-card" style="padding: 32px 20px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">🌸</div>
            <h3 class="font-heading" style="font-size: 17px; font-weight: 700; color: #ff758f; margin: 0 0 6px;">Your Garden is Ready</h3>
            <p style="font-size: 13px; color: #755963; margin: 0 0 18px;">Begin by cultivating your first sacred habit.</p>
            <button onclick="app.openNewMission()" class="btn-magical" style="padding: 12px 24px; font-size: 13px;">Add First Habit</button>
          </div>
        `;
      } else {
        habitContainer.innerHTML = state.habits.map(h => {
          const isDone = Array.isArray(state.history[todayKey]) && state.history[todayKey].includes(Number(h.id));
          const iconSvg = getIconSvg(h.icon, 'w-6 h-6');
          const safeName = escapeHtml(h.name);
          const safeBadge = h.critical ? 'Sacred Vow' : 'Daily Love';
          
          return `
            <div style="position: relative; margin-bottom: 12px;">
              <button type="button" 
                      role="checkbox" 
                      aria-checked="${isDone}" 
                      aria-label="${safeName}. ${safeBadge}. Streak: ${h.count} days. ${isDone ? 'Completed today' : 'Not completed today'}"
                      onclick="app.toggleHabit(${h.id})" 
                      class="habit-card-btn ${isDone ? 'completed' : ''}">
                <div style="display: flex; align-items: center; gap: 16px;">
                  <div class="habit-icon-box">
                    ${iconSvg}
                  </div>
                  <div>
                    <h3 class="font-heading" style="font-size: 16px; font-weight: 700; margin: 0 0 4px; color: ${isDone ? '#9f1c37' : 'var(--text-main)'};">
                      ${safeName}
                    </h3>
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #755963; font-weight: 700;">
                      ${safeBadge}
                    </span>
                  </div>
                </div>
                <div style="text-align: right; display: flex; align-items: center; gap: 10px;">
                  <span class="habit-count-text">${h.count}</span>
                </div>
              </button>
              <button type="button"
                      aria-label="Edit habit: ${safeName}"
                      onclick="event.stopPropagation(); app.openEditHabit(${h.id});" 
                      style="position: absolute; right: 70px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: #a8949b; cursor: pointer; padding: 8px;">
                ${getIconSvg('edit', 'w-4 h-4')}
              </button>
            </div>
          `;
        }).join('');
      }

      // Render Growth Garden
      const garden = generateGrowthGarden(state.history, 28);
      const flowerField = document.getElementById('flower-field');
      if (flowerField) {
        flowerField.innerHTML = garden.dots.map(dot => `
          <div class="heat-dot ${dot.hasHarvest ? 'active' : ''} ${dot.isToday ? 'today' : ''}" 
               role="img" 
               aria-label="${dot.label}" 
               title="${dot.label}"></div>
        `).join('');
      }

      const streakBadge = document.getElementById('streak-flower');
      if (streakBadge) {
        streakBadge.textContent = `🌸 ${garden.allTimeHarvests} HARVESTS`;
      }

      // Render Sacred Commitments (Vows)
      const vowsContainer = document.getElementById('sacred-vows');
      if (vowsContainer) {
        if (!state.principles || state.principles.length === 0) {
          vowsContainer.innerHTML = `<p style="font-size: 13px; color: #755963; text-align: center; font-style: italic;">No commitments recorded yet. Anchor your principles in Settings.</p>`;
        } else {
          vowsContainer.innerHTML = state.principles.map(v => `
            <div class="aesthetic-card" style="padding: 16px 20px; display: flex; align-items: center; gap: 14px; background: rgba(255, 255, 255, 0.7); margin-bottom: 10px;">
              <span style="color: #ff758f; flex-shrink: 0;">${getIconSvg('star', 'w-4 h-4')}</span>
              <p style="font-size: 13.5px; font-weight: 600; font-style: italic; color: #422830; margin: 0; line-height: 1.5;">${escapeHtml(v)}</p>
            </div>
          `).join('');
        }
      }
    },

    renderDiary() {
      const state = getState();
      const todayKey = getLocalDateString();
      const labelDate = document.getElementById('label-diary-date');
      if (labelDate) {
        labelDate.textContent = this.editDate ? `REPAIRING: ${this.editDate}` : todayKey;
      }

      const editIndicator = document.getElementById('edit-indicator');
      if (editIndicator) {
        editIndicator.classList.toggle('hidden', !this.editDate);
      }

      const historyContainer = document.getElementById('diary-history');
      if (!historyContainer) return;

      const dates = Object.keys(state.notes || {}).sort().reverse();

      if (dates.length === 0) {
        historyContainer.innerHTML = `
          <div class="aesthetic-card" style="padding: 36px 20px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">🕊️</div>
            <h3 class="font-heading" style="font-size: 17px; font-weight: 700; color: #b82e4b; margin: 0 0 6px;">Your Sanctuary is Waiting</h3>
            <p style="font-size: 13px; color: #755963; margin: 0;">Whisper your first reflection above. Only you will ever see it.</p>
          </div>
        `;
        return;
      }

      const visibleDates = dates.slice(0, this.diaryVisibleCount);
      let html = visibleDates.map(dateKey => {
        const safeNote = escapeHtml(state.notes[dateKey]);
        return `
          <article class="aesthetic-card" style="padding: 22px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 11px; font-weight: 700; color: #ff758f; background: #fff0f3; padding: 4px 12px; border-radius: 12px; text-transform: uppercase;">
                ${escapeHtml(dateKey)}
              </span>
              <div style="display: flex; gap: 8px;">
                <button type="button" 
                        onclick="app.editEntry('${escapeHtml(dateKey)}')" 
                        aria-label="Repair entry from ${escapeHtml(dateKey)}"
                        style="background: transparent; border: none; color: #9333ea; font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: underline;">
                  REPAIR
                </button>
                <button type="button" 
                        onclick="app.deleteEntry('${escapeHtml(dateKey)}')" 
                        aria-label="Delete entry from ${escapeHtml(dateKey)}"
                        style="background: transparent; border: none; color: #dc2626; font-size: 12px; font-weight: 700; cursor: pointer; padding-left: 6px;">
                  RELEASE
                </button>
              </div>
            </div>
            <p style="font-size: 14.5px; color: #422830; line-height: 1.7; font-style: italic; margin: 0; white-space: pre-wrap;">"${safeNote}"</p>
          </article>
        `;
      }).join('');

      if (dates.length > this.diaryVisibleCount) {
        html += `
          <div style="text-align: center; margin-top: 16px;">
            <button onclick="app.loadMoreDiary()" class="btn-secondary" style="font-size: 13px;">Show Earlier Whispers (${dates.length - this.diaryVisibleCount} remaining)</button>
          </div>
        `;
      }

      historyContainer.innerHTML = html;
    },

    renderSettings() {
      const state = getState();
      const nameInput = document.getElementById('in-name');
      if (nameInput && document.activeElement !== nameInput) {
        nameInput.value = state.user.name || 'Beautiful Soul';
      }

      const prinEditor = document.getElementById('prin-editor');
      if (!prinEditor) return;

      prinEditor.innerHTML = (state.principles || []).map((vow, i) => `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
          <label for="vow-field-${i}" class="sr-only">Sacred Vow ${i + 1}</label>
          <input type="text" 
                 id="vow-field-${i}" 
                 value="${escapeHtml(vow)}" 
                 class="vow-field" 
                 placeholder="Vow ${i + 1}..." 
                 style="flex: 1;">
          <button type="button" 
                  onclick="app.removeVow(${i})" 
                  aria-label="Delete Sacred Vow ${i + 1}"
                  style="background: transparent; border: none; color: #dc2626; cursor: pointer; padding: 10px;">
            ${getIconSvg('trash', 'w-5 h-5')}
          </button>
        </div>
      `).join('');
    }
  };

  window.app = app;
  window.addEventListener('DOMContentLoaded', () => app.init());
})();
