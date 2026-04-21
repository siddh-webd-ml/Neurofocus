(() => {
  'use strict';

  const intentInput     = document.getElementById('intentInput');
  const clearIntentBtn  = document.getElementById('clearIntent');
  const intentsChips    = document.getElementById('intentsChips');
  const focusToggle     = document.getElementById('focusToggle');
  const toggleStatus    = document.getElementById('toggleStatus');
  const statusDot       = document.getElementById('statusDot');
  const rescanBtn       = document.getElementById('rescanBtn');

  const timerProgress   = document.getElementById('timerProgress');
  const timerTime       = document.getElementById('timerTime');
  const timerLabel      = document.getElementById('timerLabel');
  const timerPresets    = document.querySelectorAll('.timer-preset');

  const RING_CIRCUMFERENCE = 2 * Math.PI * 52;

  let state = {
    focusActive: false,
    userIntents: [],
    userIntent: '',
    apiKey: '',
    timerDuration: 25 * 60 * 1000,
    timerEndTime: null,
    timerRunning: false,
  };

  let timerInterval = null;

  function parseIntents(input) {
    return input
      .split(',')
      .map(intent => intent.trim())
      .filter(intent => intent.length > 0);
  }

  function renderIntentChips() {
    intentsChips.innerHTML = '';
    
    state.userIntents.forEach((intent, idx) => {
      const chipEl = document.createElement('div');
      chipEl.className = 'intent-chip';
      chipEl.innerHTML = `
        <span>${escapeHtml(intent)}</span>
        <button class="intent-chip-remove" data-index="${idx}" title="Remove">×</button>
      `;
      
      const removeBtn = chipEl.querySelector('.intent-chip-remove');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.userIntents.splice(idx, 1);
        saveState();
        updateInputAndChips();
        
        if (state.focusActive) {
          sendToContent({
            type: 'UPDATE_INTENT',
            intents: state.userIntents,
          });
        }
      });
      
      intentsChips.appendChild(chipEl);
    });
  }

  function updateInputAndChips() {
    intentInput.value = state.userIntents.join(', ');
    renderIntentChips();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function updateToggleUI() {
    if (state.focusActive) {
      focusToggle.classList.add('active');
      focusToggle.setAttribute('aria-checked', 'true');
      toggleStatus.textContent = 'Active';
      toggleStatus.classList.add('active');
      statusDot.classList.add('active');
      statusDot.title = 'Active';
    } else {
      focusToggle.classList.remove('active');
      focusToggle.setAttribute('aria-checked', 'false');
      toggleStatus.textContent = 'Off';
      toggleStatus.classList.remove('active');
      statusDot.classList.remove('active');
      statusDot.title = 'Inactive';
    }
  }

  function injectTimerGradient() {
    const svg = document.querySelector('.timer-ring');
    if (!svg) return;
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'timerGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#7C3AED');
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#3B82F6');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.insertBefore(defs, svg.firstChild);
  }

  function formatTime(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function updateTimerRing(remaining, total) {
    if (!timerProgress) return;
    const fraction = total > 0 ? remaining / total : 1;
    const offset = RING_CIRCUMFERENCE * (1 - fraction);
    timerProgress.style.strokeDasharray = RING_CIRCUMFERENCE;
    timerProgress.style.strokeDashoffset = offset;
  }

  function startTimerTick() {
    stopTimerTick();
    timerInterval = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay();
  }

  function stopTimerTick() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimerDisplay() {
    if (!state.timerRunning || !state.timerEndTime) {
      const totalMs = state.timerDuration || 25 * 60 * 1000;
      timerTime.textContent = formatTime(totalMs);
      updateTimerRing(1, 1);
      timerLabel.textContent = state.focusActive ? 'Focusing' : 'Ready';
      timerLabel.className = 'timer-label' + (state.focusActive ? ' active' : '');
      setPresetsDisabled(false);
      return;
    }

    const now = Date.now();
    const remaining = state.timerEndTime - now;
    const totalMs = state.timerDuration || 25 * 60 * 1000;

    if (remaining <= 0) {
      timerTime.textContent = '00:00';
      updateTimerRing(0, 1);
      timerLabel.textContent = 'Done!';
      timerLabel.className = 'timer-label done';
      state.timerRunning = false;
      state.timerEndTime = null;
      stopTimerTick();
      setPresetsDisabled(false);

      chrome.storage.local.get(['focusActive'], (data) => {
        state.focusActive = data.focusActive || false;
        updateToggleUI();
      });
      return;
    }

    timerTime.textContent = formatTime(remaining);
    updateTimerRing(remaining, totalMs);
    timerLabel.textContent = 'Focusing';
    timerLabel.className = 'timer-label active';
    setPresetsDisabled(true);
  }

  function setPresetsDisabled(disabled) {
    timerPresets.forEach(btn => {
      if (disabled) {
        btn.classList.add('disabled');
      } else {
        btn.classList.remove('disabled');
      }
    });
  }

  function startTimer() {
    const durationMs = state.timerDuration || 25 * 60 * 1000;
    state.timerEndTime = Date.now() + durationMs;
    state.timerRunning = true;
    saveState();

    chrome.runtime.sendMessage({
      target: 'background',
      type: 'START_TIMER',
      durationMs: durationMs
    });

    startTimerTick();
  }

  function stopTimer() {
    state.timerRunning = false;
    state.timerEndTime = null;
    saveState();

    chrome.runtime.sendMessage({
      target: 'background',
      type: 'STOP_TIMER'
    });

    stopTimerTick();
    updateTimerDisplay();
  }

  function saveState() {
    chrome.storage.local.set({
      focusActive: state.focusActive,
      userIntent: state.userIntent,
      userIntents: state.userIntents,
      apiKey: state.apiKey,
      timerDuration: state.timerDuration,
      timerEndTime: state.timerEndTime,
      timerRunning: state.timerRunning,
    });
  }

  function loadState() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (data) => {
        state = { ...state, ...data };
        resolve();
      });
    });
  }

  async function sendToContent(message) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        return await chrome.tabs.sendMessage(tab.id, message);
      }
    } catch (e) {
      // Tab may not be available or message failed
    }
    return null;
  }

  async function toggleFocus() {
    state.focusActive = !state.focusActive;
    state.userIntents = parseIntents(intentInput.value.trim());
    state.userIntent = state.userIntents.join(', ');

    updateToggleUI();

    if (state.focusActive) {
      await sendToContent({
        type: 'FOCUS_ON',
        intents: state.userIntents,
      });
      startTimer();
    } else {
      await sendToContent({ type: 'FOCUS_OFF' });
      stopTimer();
    }

    chrome.runtime.sendMessage({
      target: 'background',
      type: 'UPDATE_BADGE',
      isActive: state.focusActive,
    });

    saveState();
  }

  let intentDebounce = null;

  function handleIntentChange() {
    if (intentDebounce) clearTimeout(intentDebounce);

    state.userIntents = parseIntents(intentInput.value.trim());
    renderIntentChips();

    intentDebounce = setTimeout(async () => {
      state.userIntent = state.userIntents.join(', ');
      saveState();

      if (state.focusActive) {
        await sendToContent({
          type: 'UPDATE_INTENT',
          intents: state.userIntents,
        });
      }
    }, 500);
  }

  focusToggle.addEventListener('click', toggleFocus);

  intentInput.addEventListener('input', handleIntentChange);
  intentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      intentInput.blur();
      if (!state.focusActive) toggleFocus();
    }
  });

  clearIntentBtn.addEventListener('click', () => {
    intentInput.value = '';
    handleIntentChange();
    intentInput.focus();
  });

  rescanBtn.addEventListener('click', async () => {
    rescanBtn.textContent = '⟳ Scanning...';
    await sendToContent({ type: 'RESCAN' });
    setTimeout(() => {
      rescanBtn.textContent = '⟳ Rescan';
    }, 1000);
  });

  timerPresets.forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.timerRunning) return;

      const minutes = parseInt(btn.dataset.minutes, 10);
      state.timerDuration = minutes * 60 * 1000;
      saveState();

      timerPresets.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      updateTimerDisplay();
    });
  });

  async function init() {
    injectTimerGradient();

    await loadState();

    if (state.userIntent && !state.userIntents.length) {
      state.userIntents = parseIntents(state.userIntent);
    }

    updateInputAndChips();
    updateToggleUI();

    const selectedMinutes = Math.round((state.timerDuration || 25 * 60 * 1000) / 60000);
    timerPresets.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.minutes, 10) === selectedMinutes);
    });

    if (state.timerRunning && state.timerEndTime) {
      const remaining = state.timerEndTime - Date.now();
      if (remaining > 0) {
        startTimerTick();
      } else {
        state.timerRunning = false;
        state.timerEndTime = null;
        saveState();
        updateTimerDisplay();
      }
    } else {
      updateTimerDisplay();
    }
  }

  init();
})();
