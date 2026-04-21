const NeuroUI = (() => {
  'use strict';

  const CONFIG = {
    TOOLTIP_AUTO_DISMISS_MS: 4000,
    TOOLTIP_FADE_MS: 300,
    TOOLTIP_ID: 'nf-behavioral-tooltip',
  };

  let _isActive = false;
  let _activeTooltip = null;
  let _dismissTimer = null;
  let _userIntent = '';
  let _clickHandler = null;

  function showWarningTooltip(targetEl, event) {
    removeTooltip();

    const tooltip = document.createElement('div');
    tooltip.id = CONFIG.TOOLTIP_ID;
    tooltip.className = 'nf-tooltip';
    tooltip.innerHTML = `
      <div class="nf-tooltip-header">
        <span class="nf-tooltip-icon">🧠</span>
        <span class="nf-tooltip-title">Does this match your goal?</span>
      </div>
      ${_userIntent ? `<div class="nf-tooltip-intent">Goal: "${_userIntent}"</div>` : ''}
      <div class="nf-tooltip-actions">
        <button class="nf-tooltip-btn nf-tooltip-dismiss">Dismiss</button>
        <button class="nf-tooltip-btn nf-tooltip-continue">Continue anyway</button>
      </div>
    `;

    document.body.appendChild(tooltip);
    positionTooltip(tooltip, event);

    const dismissBtn = tooltip.querySelector('.nf-tooltip-dismiss');
    const continueBtn = tooltip.querySelector('.nf-tooltip-continue');

    dismissBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeTooltip();
    });

    continueBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeTooltip();
      revealElement(targetEl);
    });

    requestAnimationFrame(() => {
      tooltip.classList.add('nf-tooltip-visible');
    });

    _activeTooltip = tooltip;

    _dismissTimer = setTimeout(() => {
      removeTooltip();
    }, CONFIG.TOOLTIP_AUTO_DISMISS_MS);
  }

  function positionTooltip(tooltip, event) {
    const margin = 12;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let x = event.clientX + margin;
    let y = event.clientY + margin;

    requestAnimationFrame(() => {
      const rect = tooltip.getBoundingClientRect();

      if (x + rect.width > viewportW - margin) {
        x = event.clientX - rect.width - margin;
      }
      if (y + rect.height > viewportH - margin) {
        y = event.clientY - rect.height - margin;
      }

      x = Math.max(margin, x);
      y = Math.max(margin, y);

      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    });

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  }

  function removeTooltip() {
    if (_dismissTimer) {
      clearTimeout(_dismissTimer);
      _dismissTimer = null;
    }

    if (_activeTooltip) {
      _activeTooltip.classList.remove('nf-tooltip-visible');
      _activeTooltip.classList.add('nf-tooltip-hiding');
      const el = _activeTooltip;
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, CONFIG.TOOLTIP_FADE_MS);
      _activeTooltip = null;
    }
  }

  function revealElement(el) {
    const wasBlurred = el.classList.contains('nf-blurred');
    const wasSemi = el.classList.contains('nf-semi-relevant');

    el.classList.remove('nf-blurred', 'nf-semi-relevant');
    el.style.pointerEvents = 'auto';

    setTimeout(() => {
      if (wasBlurred) el.classList.add('nf-blurred');
      if (wasSemi) el.classList.add('nf-semi-relevant');
    }, 8000);
  }

  function handleDocumentClick(event) {
    if (!_isActive) return;

    let el = event.target;
    let depth = 0;
    const maxDepth = 10;

    while (el && el !== document.body && depth < maxDepth) {
      if (
        el.classList &&
        (el.classList.contains('nf-blurred') || el.classList.contains('nf-semi-relevant'))
      ) {
        event.preventDefault();
        event.stopPropagation();
        showWarningTooltip(el, event);
        return;
      }
      el = el.parentElement;
      depth++;
    }
  }

  function showFocusOverlay() {
    document.body.classList.add('nf-overlay-active');
  }

  function hideFocusOverlay() {
    document.body.classList.remove('nf-overlay-active');
  }

  function activate(intent) {
    _isActive = true;
    _userIntent = intent || '';

    if (!_clickHandler) {
      _clickHandler = handleDocumentClick;
      document.addEventListener('click', _clickHandler, true);
    }

    showFocusOverlay();
  }

  function deactivate() {
    _isActive = false;
    _userIntent = '';

    removeTooltip();
    hideFocusOverlay();

    if (_clickHandler) {
      document.removeEventListener('click', _clickHandler, true);
      _clickHandler = null;
    }
  }

  function updateIntent(intent) {
    _userIntent = intent || '';
  }

  function isActive() {
    return _isActive;
  }

  return {
    activate,
    deactivate,
    updateIntent,
    isActive,
    showFocusOverlay,
    hideFocusOverlay,
    removeTooltip,
  };
})();
